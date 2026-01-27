import { v } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
import { nanoid } from "nanoid";
import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";
import {
  canEditArrangement,
  filterUndefined,
  isArrangementOwner,
  isArrangementCollaborator,
  requireAuth,
  requireAuthenticatedUser,
  formatUserInfo,
  getCommunityGroup,
  isGroupAdminOrOwner,
  isCommunityGroup,
  getContentOwnerInfo,
} from "./permissions";
import { maybeCreateVersionSnapshot } from "./versions";

// R2 client for audio file cleanup
const r2 = new R2(components.r2);

// ============ HELPER FUNCTIONS ============

/**
 * Find a collaborator by arrangement and user ID
 */
async function findCollaborator(
  ctx: QueryCtx | MutationCtx,
  arrangementId: Id<"arrangements">,
  userId: Id<"users">
) {
  return await ctx.db
    .query("arrangementCollaborators")
    .withIndex("by_arrangement_and_user", (q) =>
      q.eq("arrangementId", arrangementId).eq("userId", userId)
    )
    .unique();
}

/**
 * Recalculates and updates a song's denormalized arrangement summary.
 * Called after arrangement create, update, or delete.
 */
async function updateSongArrangementSummary(
  ctx: MutationCtx,
  songId: Id<"songs">
) {
  const arrangements = await ctx.db
    .query("arrangements")
    .withIndex("by_song", (q) => q.eq("songId", songId))
    .collect();

  // Extract unique keys (filter out undefined/null)
  const keys = [
    ...new Set(
      arrangements.map((a) => a.key).filter((k): k is string => Boolean(k))
    ),
  ];

  // Extract tempos (filter out undefined/null)
  const tempos = arrangements
    .map((a) => a.tempo)
    .filter((t): t is number => t !== undefined && t !== null);

  // Extract unique difficulties
  const difficulties = [
    ...new Set(
      arrangements
        .map((a) => a.difficulty)
        .filter(
          (d): d is "simple" | "standard" | "advanced" => d !== undefined
        )
    ),
  ];

  // Calculate total favorites from arrangements
  const totalFavorites = arrangements.reduce(
    (sum, a) => sum + (a.favorites || 0),
    0
  );

  await ctx.db.patch(songId, {
    arrangementCount: arrangements.length,
    arrangementKeys: keys,
    arrangementTempoMin: tempos.length > 0 ? Math.min(...tempos) : undefined,
    arrangementTempoMax: tempos.length > 0 ? Math.max(...tempos) : undefined,
    arrangementDifficulties: difficulties.length > 0 ? difficulties : undefined,
    arrangementTotalFavorites: totalFavorites,
  });
}

// ============ QUERIES ============

/**
 * Get single arrangement by ID
 * Access: Everyone
 */
export const get = query({
  args: { id: v.id("arrangements") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get arrangement by URL slug
 * Access: Everyone
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("arrangements")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

/**
 * Get arrangement by URL slug WITH creator info and owner info
 * Access: Everyone
 *
 * Phase 2: Also returns owner info for group ownership display
 */
export const getBySlugWithCreator = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const arrangement = await ctx.db
      .query("arrangements")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!arrangement) return null;

    const creator = arrangement.createdBy
      ? await ctx.db.get(arrangement.createdBy)
      : null;

    // Phase 2: Get owner info for display
    const owner = await getContentOwnerInfo(ctx, arrangement);

    return {
      ...arrangement,
      creator: formatUserInfo(creator),
      owner,
    };
  },
});

/**
 * Get all arrangements for a song
 * Access: Everyone
 */
export const getBySong = query({
  args: { songId: v.id("songs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("arrangements")
      .withIndex("by_song", (q) => q.eq("songId", args.songId))
      .collect();
  },
});

/**
 * Get all arrangements for a song WITH creator info and owner info
 * Access: Everyone
 */
export const getBySongWithCreators = query({
  args: { songId: v.id("songs") },
  handler: async (ctx, args) => {
    const arrangements = await ctx.db
      .query("arrangements")
      .withIndex("by_song", (q) => q.eq("songId", args.songId))
      .collect();

    // Join with user data and owner info
    return Promise.all(
      arrangements.map(async (arr) => {
        const creator = arr.createdBy ? await ctx.db.get(arr.createdBy) : null;
        const owner = await getContentOwnerInfo(ctx, arr);
        return {
          ...arr,
          creator: formatUserInfo(creator),
          owner,
        };
      })
    );
  },
});

/**
 * Get all arrangements by a specific creator
 * Access: Everyone (for public profile pages)
 */
export const getByCreator = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const arrangements = await ctx.db
      .query("arrangements")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", args.userId))
      .collect();

    // Join with song data for display
    return Promise.all(
      arrangements.map(async (arr) => {
        const song = await ctx.db.get(arr.songId);
        return {
          ...arr,
          song: song
            ? {
                _id: song._id,
                slug: song.slug,
                title: song.title,
                artist: song.artist,
              }
            : null,
        };
      })
    );
  },
});

/**
 * Get all arrangements
 * Access: Everyone
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("arrangements").collect();
  },
});

/**
 * Get count of all arrangements
 * Access: Everyone
 */
export const count = query({
  args: {},
  handler: async (ctx) => {
    const arrangements = await ctx.db.query("arrangements").collect();
    return arrangements.length;
  },
});

/**
 * Get arrangement counts grouped by song
 * Returns { [songId]: count } for all songs with arrangements
 * Access: Everyone
 *
 * This is optimized for the song list - returns minimal data instead of
 * fetching all arrangement objects with their full chordProContent.
 */
export const getCountsBySong = query({
  args: {},
  handler: async (ctx) => {
    const arrangements = await ctx.db.query("arrangements").collect();
    const counts: Record<string, number> = {};
    for (const arr of arrangements) {
      const songId = arr.songId.toString();
      counts[songId] = (counts[songId] || 0) + 1;
    }
    return counts;
  },
});

/**
 * Get all distinct tags used across arrangements
 * Used for tag autocomplete suggestions
 * Access: Everyone
 */
export const getDistinctTags = query({
  args: {},
  handler: async (ctx) => {
    const arrangements = await ctx.db.query("arrangements").collect();
    const tagSet = new Set<string>();
    for (const arr of arrangements) {
      for (const tag of arr.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  },
});

/**
 * Get styles with arrangement counts for homepage browsing
 * Access: Everyone
 */
export const getStylesWithCounts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const arrangements = await ctx.db.query("arrangements").collect();
    const styleCounts: Record<string, number> = {};

    for (const arr of arrangements) {
      if (arr.style) {
        styleCounts[arr.style] = (styleCounts[arr.style] || 0) + 1;
      }
    }

    return Object.entries(styleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, args.limit || 10)
      .map(([style, count]) => ({ style, count }));
  },
});

/**
 * Get arrangement IDs where the current user is a collaborator
 * Used for filtering "my arrangements" on song pages
 * Access: Authenticated users only
 */
export const getMyCollaborationIds = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const collaborations = await ctx.db
      .query("arrangementCollaborators")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return collaborations.map((c) => c.arrangementId);
  },
});

/**
 * Get all arrangements where current user is creator OR collaborator
 * Used for the "My Arrangements" section on the profile page
 * Access: Authenticated users only
 */
export const getMyArrangements = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // 1. Get arrangements I created
    const createdArrangements = await ctx.db
      .query("arrangements")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", userId))
      .collect();

    // 2. Get arrangements I'm a collaborator on
    const collaborations = await ctx.db
      .query("arrangementCollaborators")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const collaboratorArrangements = await Promise.all(
      collaborations.map((c) => ctx.db.get(c.arrangementId))
    );

    // 3. Merge and deduplicate
    const allArrangements = [
      ...createdArrangements,
      ...collaboratorArrangements.filter(
        (arr): arr is NonNullable<typeof arr> => arr !== null
      ),
    ];

    const uniqueArrangements = Array.from(
      new Map(allArrangements.map((arr) => [arr._id.toString(), arr])).values()
    );

    // 4. Join with song data
    return Promise.all(
      uniqueArrangements.map(async (arr) => {
        const song = await ctx.db.get(arr.songId);
        return {
          ...arr,
          song: song
            ? {
                _id: song._id,
                slug: song.slug,
                title: song.title,
                artist: song.artist,
              }
            : null,
        };
      })
    );
  },
});

/**
 * Get featured arrangements WITH song data and creator info (joined)
 * This is what the frontend FeaturedArrangements widget needs
 * Access: Everyone
 *
 * Uses by_favorites index to efficiently get top arrangements,
 * then applies score-based sorting for final ranking.
 */
export const getFeaturedWithSongs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 6;

    // Use index to get top arrangements by favorites (proxy for popularity)
    // Take more than needed to allow for score-based reordering
    const sampleSize = Math.max(limit * 5, 30);
    const topByFavorites = await ctx.db
      .query("arrangements")
      .withIndex("by_favorites")
      .order("desc")
      .take(sampleSize);

    // Sort by favorites (popularity)
    const topArrangements = topByFavorites.slice(0, limit);

    // Join with songs and creators
    const results = await Promise.all(
      topArrangements.map(async (arr) => {
        const song = await ctx.db.get(arr.songId);
        const creator = arr.createdBy ? await ctx.db.get(arr.createdBy) : null;
        return {
          ...arr,
          song: song
            ? {
                _id: song._id,
                slug: song.slug,
                title: song.title,
                artist: song.artist,
              }
            : null,
          creator: formatUserInfo(creator),
        };
      })
    );

    return results;
  },
});

// ============ MUTATIONS ============

/**
 * Create a new arrangement
 * Access: Authenticated users only (not anonymous)
 *
 * Phase 2: Supports group ownership and co-authors
 * - If ownerType='group', verify user is owner/admin of that group
 * - Community group excluded (transfer only)
 * - Creates arrangementAuthors records for co-authors
 */
export const create = mutation({
  args: {
    songId: v.id("songs"),
    name: v.string(),
    key: v.optional(v.string()),
    tempo: v.optional(v.number()),
    capo: v.optional(v.number()),
    timeSignature: v.optional(v.string()),
    difficulty: v.optional(
      v.union(v.literal("simple"), v.literal("standard"), v.literal("advanced"))
    ),
    chordProContent: v.string(),
    slug: v.string(),
    tags: v.optional(v.array(v.string())),
    // Structured categorization fields
    instrument: v.optional(v.union(v.literal("guitar"), v.literal("piano"))),
    energy: v.optional(
      v.union(v.literal("high"), v.literal("medium"), v.literal("reflective"))
    ),
    style: v.optional(v.string()),
    settings: v.optional(v.array(v.string())),
    // Phase 2: Group ownership
    ownerType: v.optional(v.union(v.literal("user"), v.literal("group"))),
    ownerId: v.optional(v.string()),
    // Phase 2: Co-authors (for group-owned arrangements)
    coAuthors: v.optional(
      v.array(
        v.object({
          userId: v.id("users"),
          isPrimary: v.boolean(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(ctx);

    // Verify song exists
    const song = await ctx.db.get(args.songId);
    if (!song) {
      throw new Error("Song not found");
    }

    // Check slug uniqueness
    const existing = await ctx.db
      .query("arrangements")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) {
      throw new Error("An arrangement with this slug already exists");
    }

    // Phase 2: Validate group ownership
    let ownerType = args.ownerType;
    let ownerId = args.ownerId;

    if (ownerType === "group" && ownerId) {
      // Prevent creating content directly owned by the Community group
      const isCommunity = await isCommunityGroup(ctx, ownerId);
      if (isCommunity) {
        throw new Error(
          "Cannot create content directly owned by the Community group. Content must be transferred to Community."
        );
      }

      // Verify user is owner/admin of the group
      const groupId = ownerId as Id<"groups">;
      const canPostAsGroup = await isGroupAdminOrOwner(ctx, groupId, userId);
      if (!canPostAsGroup) {
        throw new Error(
          "You must be an owner or admin of the group to post on its behalf"
        );
      }
    } else {
      // Default to user ownership
      ownerType = undefined;
      ownerId = undefined;
    }

    const arrangementId = await ctx.db.insert("arrangements", {
      songId: args.songId,
      name: args.name,
      key: args.key,
      tempo: args.tempo,
      capo: args.capo,
      timeSignature: args.timeSignature,
      difficulty: args.difficulty,
      chordProContent: args.chordProContent,
      slug: args.slug,
      createdBy: userId,
      favorites: 0,
      tags: args.tags ?? [],
      instrument: args.instrument,
      energy: args.energy,
      style: args.style,
      settings: args.settings,
      ownerType,
      ownerId,
    });

    // Phase 2: Create co-author records for group-owned arrangements
    if (ownerType === "group" && args.coAuthors && args.coAuthors.length > 0) {
      // Check if current user is in the coAuthors list
      const currentUserIncluded = args.coAuthors.some(
        (author) => author.userId === userId
      );

      // If not, add current user as primary author
      if (!currentUserIncluded) {
        await ctx.db.insert("arrangementAuthors", {
          arrangementId,
          userId,
          isPrimary: true,
          addedAt: Date.now(),
        });
      }

      // Insert all specified co-authors
      for (const author of args.coAuthors) {
        await ctx.db.insert("arrangementAuthors", {
          arrangementId,
          userId: author.userId,
          isPrimary: author.isPrimary,
          addedAt: Date.now(),
        });
      }
    } else if (ownerType === "group") {
      // Group-owned with no co-authors specified: add current user as primary
      await ctx.db.insert("arrangementAuthors", {
        arrangementId,
        userId,
        isPrimary: true,
        addedAt: Date.now(),
      });
    }

    // Update song's denormalized arrangement summary
    await updateSongArrangementSummary(ctx, args.songId);

    return arrangementId;
  },
});

/**
 * Update an arrangement
 * Access: Owner or collaborator
 */
export const update = mutation({
  args: {
    id: v.id("arrangements"),
    name: v.optional(v.string()),
    key: v.optional(v.string()),
    tempo: v.optional(v.number()),
    capo: v.optional(v.number()),
    timeSignature: v.optional(v.string()),
    difficulty: v.optional(
      v.union(v.literal("simple"), v.literal("standard"), v.literal("advanced"))
    ),
    chordProContent: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    // Structured categorization fields
    instrument: v.optional(v.union(v.literal("guitar"), v.literal("piano"))),
    energy: v.optional(
      v.union(v.literal("high"), v.literal("medium"), v.literal("reflective"))
    ),
    style: v.optional(v.string()),
    settings: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const arrangement = await ctx.db.get(args.id);
    if (!arrangement) {
      throw new Error("Arrangement not found");
    }

    // Check edit permission (owner or collaborator)
    const canEdit = await canEditArrangement(ctx, args.id, userId);
    if (!canEdit) {
      throw new Error("You don't have permission to edit this arrangement");
    }

    // Create version snapshot for Community-owned arrangements (if changed)
    await maybeCreateVersionSnapshot(
      ctx,
      "arrangement",
      { ...arrangement, _id: args.id },
      userId
    );

    const { id: _id, ...updates } = args;

    // Filter out undefined values and add timestamp
    const cleanUpdates = {
      ...filterUndefined(updates),
      updatedAt: Date.now(),
    };

    await ctx.db.patch(args.id, cleanUpdates);

    // Update song's denormalized arrangement summary if relevant fields changed
    if (
      args.key !== undefined ||
      args.tempo !== undefined ||
      args.difficulty !== undefined
    ) {
      await updateSongArrangementSummary(ctx, arrangement.songId);
    }

    return args.id;
  },
});

/**
 * Update YouTube URL for an arrangement
 * Access: Owner or collaborator
 */
export const updateYoutubeUrl = mutation({
  args: {
    id: v.id("arrangements"),
    youtubeUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const arrangement = await ctx.db.get(args.id);
    if (!arrangement) {
      throw new Error("Arrangement not found");
    }

    // Check edit permission
    const canEdit = await canEditArrangement(ctx, args.id, userId);
    if (!canEdit) {
      throw new Error("You don't have permission to edit this arrangement");
    }

    // Validate YouTube URL format if provided
    if (args.youtubeUrl) {
      const videoId = extractYoutubeVideoId(args.youtubeUrl);
      if (!videoId) {
        throw new Error("Invalid YouTube URL. Please enter a valid YouTube video URL or video ID.");
      }
    }

    await ctx.db.patch(args.id, {
      youtubeUrl: args.youtubeUrl || undefined,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - Just the VIDEO_ID (11 characters)
 */
function extractYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();

  // Handle direct video IDs (11 alphanumeric characters with - and _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// ============ PERMISSION QUERIES ============

/**
 * Check if current user can edit an arrangement
 * Returns { canEdit, isOwner, isCollaborator, isOriginalCreator }
 *
 * - isOwner: true if user owns the arrangement (or is group owner for group-owned)
 * - isOriginalCreator: true if user originally created the arrangement (via createdBy)
 *   This is important for reclaim functionality - original creator can always reclaim
 */
export const canEdit = query({
  args: { arrangementId: v.id("arrangements") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { canEdit: false, isOwner: false, isCollaborator: false, isOriginalCreator: false };
    }

    const arrangement = await ctx.db.get(args.arrangementId);
    if (!arrangement) {
      return { canEdit: false, isOwner: false, isCollaborator: false, isOriginalCreator: false };
    }

    const isOwner = await isArrangementOwner(ctx, args.arrangementId, userId);
    const isOriginalCreator = arrangement.createdBy === userId;
    const isCollaborator = await isArrangementCollaborator(
      ctx,
      args.arrangementId,
      userId
    );

    return {
      canEdit: isOwner || isCollaborator || isOriginalCreator,
      isOwner,
      isCollaborator,
      isOriginalCreator,
    };
  },
});

/**
 * Get collaborators for an arrangement (owner only)
 * Returns list of collaborators with user info
 */
export const getCollaborators = query({
  args: { arrangementId: v.id("arrangements") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Only owner can view collaborators
    const isOwner = await isArrangementOwner(ctx, args.arrangementId, userId);
    if (!isOwner) {
      return [];
    }

    const collaborators = await ctx.db
      .query("arrangementCollaborators")
      .withIndex("by_arrangement", (q) =>
        q.eq("arrangementId", args.arrangementId)
      )
      .collect();

    // Join with user data
    return Promise.all(
      collaborators.map(async (collab) => {
        const user = await ctx.db.get(collab.userId);
        const addedByUser = await ctx.db.get(collab.addedBy);
        return {
          _id: collab._id,
          userId: collab.userId,
          addedAt: collab.addedAt,
          user: formatUserInfo(user),
          addedBy: addedByUser
            ? {
                _id: addedByUser._id,
                username: addedByUser.username,
              }
            : null,
        };
      })
    );
  },
});

/**
 * Get co-authors for an arrangement (Phase 2)
 * Returns list of co-authors with user info for display
 * Access: Everyone (for display purposes)
 */
export const getCoAuthors = query({
  args: { arrangementId: v.id("arrangements") },
  handler: async (ctx, args) => {
    const authors = await ctx.db
      .query("arrangementAuthors")
      .withIndex("by_arrangement", (q) => q.eq("arrangementId", args.arrangementId))
      .collect();

    if (authors.length === 0) {
      return [];
    }

    // Join with user data
    return Promise.all(
      authors.map(async (author) => {
        const user = await ctx.db.get(author.userId);
        return {
          _id: author._id,
          userId: author.userId,
          isPrimary: author.isPrimary,
          addedAt: author.addedAt,
          user: formatUserInfo(user),
        };
      })
    );
  },
});

// ============ COLLABORATOR MUTATIONS ============

/**
 * Add a collaborator to an arrangement
 * Access: Owner only
 */
export const addCollaborator = mutation({
  args: {
    arrangementId: v.id("arrangements"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuth(ctx);

    // Check ownership
    const isOwner = await isArrangementOwner(
      ctx,
      args.arrangementId,
      currentUserId
    );
    if (!isOwner) {
      throw new Error("Only the owner can add collaborators");
    }

    // Check that user exists and is not anonymous
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    if (!user.email) {
      throw new Error("Cannot add anonymous users as collaborators");
    }

    // Cannot add yourself as a collaborator (you're already the owner)
    if (args.userId === currentUserId) {
      throw new Error("You cannot add yourself as a collaborator");
    }

    // Check if already a collaborator
    const existing = await findCollaborator(ctx, args.arrangementId, args.userId);

    if (existing) {
      throw new Error("User is already a collaborator");
    }

    await ctx.db.insert("arrangementCollaborators", {
      arrangementId: args.arrangementId,
      userId: args.userId,
      addedBy: currentUserId,
      addedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Remove a collaborator from an arrangement
 * Access: Owner only
 */
export const removeCollaborator = mutation({
  args: {
    arrangementId: v.id("arrangements"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuth(ctx);

    // Check ownership
    const isOwner = await isArrangementOwner(
      ctx,
      args.arrangementId,
      currentUserId
    );
    if (!isOwner) {
      throw new Error("Only the owner can remove collaborators");
    }

    // Find the collaborator record
    const collaborator = await findCollaborator(ctx, args.arrangementId, args.userId);

    if (!collaborator) {
      throw new Error("User is not a collaborator");
    }

    await ctx.db.delete(collaborator._id);

    return { success: true };
  },
});

/**
 * Transfer an arrangement to the Community group (crowdsourced)
 * Access: Original creator only
 *
 * This allows anyone to donate their arrangement to Community for community editing,
 * even if they're not a member of the Community group.
 * The original creator retains edit rights via createdBy.
 */
export const transferToCommunity = mutation({
  args: { id: v.id("arrangements") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const arrangement = await ctx.db.get(args.id);
    if (!arrangement) {
      throw new Error("Arrangement not found");
    }

    // Only original creator can transfer
    if (arrangement.createdBy !== userId) {
      throw new Error("Only the original creator can transfer this arrangement");
    }

    // Check if already community-owned
    const communityGroup = await getCommunityGroup(ctx);
    if (!communityGroup) {
      throw new Error("Community group not found");
    }

    if (
      arrangement.ownerType === "group" &&
      arrangement.ownerId === communityGroup._id.toString()
    ) {
      throw new Error("Arrangement is already owned by Community");
    }

    // Create initial version snapshot before transferring
    const snapshot = JSON.stringify({
      name: arrangement.name,
      key: arrangement.key,
      tempo: arrangement.tempo,
      capo: arrangement.capo,
      timeSignature: arrangement.timeSignature,
      chordProContent: arrangement.chordProContent,
      tags: arrangement.tags,
    });

    await ctx.runMutation(internal.versions.createVersion, {
      contentType: "arrangement",
      contentId: args.id.toString(),
      snapshot,
      changedBy: userId,
      changeDescription: "Original version (before community transfer)",
    });

    // Transfer to Community
    await ctx.db.patch(args.id, {
      ownerType: "group",
      ownerId: communityGroup._id.toString(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Reclaim an arrangement from the Community group back to personal ownership
 * Access: Original creator only
 *
 * Allows the person who originally created and transferred the arrangement
 * to take it back under their personal ownership.
 */
export const reclaimFromCommunity = mutation({
  args: { id: v.id("arrangements") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const arrangement = await ctx.db.get(args.id);
    if (!arrangement) {
      throw new Error("Arrangement not found");
    }

    // Only original creator can reclaim
    if (arrangement.createdBy !== userId) {
      throw new Error("Only the original creator can reclaim this arrangement");
    }

    // Check if currently community-owned
    const communityGroup = await getCommunityGroup(ctx);
    if (
      !communityGroup ||
      arrangement.ownerType !== "group" ||
      arrangement.ownerId !== communityGroup._id.toString()
    ) {
      throw new Error("Arrangement is not currently owned by Community");
    }

    // Reclaim to personal ownership
    await ctx.db.patch(args.id, {
      ownerType: undefined,
      ownerId: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ============ SETLIST USAGE QUERY ============

/**
 * Get setlists that contain a specific arrangement
 * Used to warn users before deleting an arrangement
 * Access: Everyone (for display purposes)
 */
export const getSetlistUsage = query({
  args: { arrangementId: v.id("arrangements") },
  handler: async (ctx, args) => {
    const setlists = await ctx.db.query("setlists").collect();
    return setlists
      .filter((s) => s.arrangementIds.includes(args.arrangementId))
      .map((s) => ({ _id: s._id, name: s.name, userId: s.userId }));
  },
});

// ============ DELETE MUTATION ============

/**
 * Delete an arrangement
 * Access: Owner only
 *
 * Cleans up related data:
 * - Collaborators
 * - Co-authors
 * - Version history
 *
 * Note: Setlists referencing this arrangement will have null entries.
 * This is handled gracefully in setlist queries.
 */
export const remove = mutation({
  args: { id: v.id("arrangements") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const arrangement = await ctx.db.get(args.id);
    if (!arrangement) {
      throw new Error("Arrangement not found");
    }

    // Only owner can delete
    const ownerCheck = await isArrangementOwner(ctx, args.id, userId);
    if (!ownerCheck) {
      throw new Error("Only the owner can delete this arrangement");
    }

    // 1. Delete collaborators
    const collaborators = await ctx.db
      .query("arrangementCollaborators")
      .withIndex("by_arrangement", (q) => q.eq("arrangementId", args.id))
      .collect();
    for (const collab of collaborators) {
      await ctx.db.delete(collab._id);
    }

    // 2. Delete co-authors
    const authors = await ctx.db
      .query("arrangementAuthors")
      .withIndex("by_arrangement", (q) => q.eq("arrangementId", args.id))
      .collect();
    for (const author of authors) {
      await ctx.db.delete(author._id);
    }

    // 3. Delete version history
    const versions = await ctx.db
      .query("contentVersions")
      .withIndex("by_content", (q) =>
        q.eq("contentType", "arrangement").eq("contentId", args.id.toString())
      )
      .collect();
    for (const version of versions) {
      await ctx.db.delete(version._id);
    }

    // 4. Delete audio file from R2 if exists
    if (arrangement.audioFileKey) {
      try {
        await r2.deleteObject(ctx, arrangement.audioFileKey);
      } catch {
        console.warn("Failed to delete audio from R2:", arrangement.audioFileKey);
      }
    }

    // 5. Delete the arrangement itself
    await ctx.db.delete(args.id);

    // 6. Update song's denormalized arrangement summary
    await updateSongArrangementSummary(ctx, arrangement.songId);

    return { success: true };
  },
});

// ============ DUPLICATE MUTATION ============

/**
 * Duplicate an arrangement
 * Access: Authenticated users only (not anonymous)
 *
 * Creates a copy of an arrangement with the duplicator as the new owner.
 * Copies: name, key, tempo, capo, timeSignature, chordProContent, tags
 * Does NOT copy: collaborators, co-authors, rating, favorites, ownership
 */
export const duplicate = mutation({
  args: {
    sourceArrangementId: v.id("arrangements"),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(ctx);

    // Get source arrangement
    const source = await ctx.db.get(args.sourceArrangementId);
    if (!source) {
      throw new Error("Arrangement not found");
    }

    // Generate new slug
    const slug = nanoid(6);

    // Verify slug uniqueness (should always be unique with nanoid, but check anyway)
    const existing = await ctx.db
      .query("arrangements")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (existing) {
      throw new Error("Slug collision, please try again");
    }

    // Create duplicate - copy content fields, reset social/ownership fields
    const newArrangementId = await ctx.db.insert("arrangements", {
      songId: source.songId,
      name: args.newName,
      key: source.key,
      tempo: source.tempo,
      capo: source.capo,
      timeSignature: source.timeSignature,
      difficulty: source.difficulty,
      chordProContent: source.chordProContent,
      tags: source.tags,
      slug,
      createdBy: userId,
      favorites: 0,
      // ownerType and ownerId are undefined (user ownership by default)
    });

    // Update song's denormalized arrangement summary
    await updateSongArrangementSummary(ctx, source.songId);

    return { arrangementId: newArrangementId, slug };
  },
});
