import { v } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
import {
  canEditArrangement,
  filterUndefined,
  isArrangementOwner,
  isArrangementCollaborator,
  requireAuth,
  requireAuthenticatedUser,
  formatUserInfo,
  getPublicGroup,
  isGroupAdminOrOwner,
  isPublicGroup,
  getContentOwnerInfo,
} from "./permissions";
import { hasContentChanged } from "./versions";

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
 * Get all arrangements for a song WITH creator info
 * Access: Everyone
 */
export const getBySongWithCreators = query({
  args: { songId: v.id("songs") },
  handler: async (ctx, args) => {
    const arrangements = await ctx.db
      .query("arrangements")
      .withIndex("by_song", (q) => q.eq("songId", args.songId))
      .collect();

    // Join with user data
    return Promise.all(
      arrangements.map(async (arr) => {
        const creator = arr.createdBy ? await ctx.db.get(arr.createdBy) : null;
        return {
          ...arr,
          creator: formatUserInfo(creator),
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
 * Get featured arrangements WITH song data and creator info (joined)
 * This is what the frontend FeaturedArrangements widget needs
 * Access: Everyone
 */
export const getFeaturedWithSongs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 6;

    // Get all arrangements and calculate scores
    const arrangements = await ctx.db.query("arrangements").collect();

    const scored = arrangements.map((arr) => ({
      arrangement: arr,
      score: (arr.rating || 0) * 0.6 + (arr.favorites || 0) * 0.004,
    }));

    // Sort by score descending and take top N
    scored.sort((a, b) => b.score - a.score);
    const topArrangements = scored.slice(0, limit).map((s) => s.arrangement);

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
 * - Public group excluded (transfer only)
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
    chordProContent: v.string(),
    slug: v.string(),
    tags: v.optional(v.array(v.string())),
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
      // Prevent creating content directly owned by the Public group
      const isPublic = await isPublicGroup(ctx, ownerId);
      if (isPublic) {
        throw new Error(
          "Cannot create content directly owned by the Public group. Content must be transferred to Public."
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
      chordProContent: args.chordProContent,
      slug: args.slug,
      createdBy: userId,
      rating: 0,
      favorites: 0,
      tags: args.tags ?? [],
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
    chordProContent: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
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

    // Smart version creation for Public-owned arrangements (only if changed)
    const publicGroup = await getPublicGroup(ctx);
    const isPublicOwned =
      arrangement.ownerType === "group" &&
      arrangement.ownerId === publicGroup?._id.toString();

    if (isPublicOwned) {
      // Create snapshot of current state before update
      const snapshot = JSON.stringify({
        name: arrangement.name,
        key: arrangement.key,
        tempo: arrangement.tempo,
        capo: arrangement.capo,
        timeSignature: arrangement.timeSignature,
        chordProContent: arrangement.chordProContent,
        tags: arrangement.tags,
      });

      // Only create version if content actually changed
      const hasChanged = await hasContentChanged(
        ctx,
        "arrangement",
        args.id,
        snapshot
      );
      if (hasChanged) {
        await ctx.runMutation(internal.versions.createVersion, {
          contentType: "arrangement",
          contentId: args.id,
          snapshot,
          changedBy: userId,
        });
      }
    }

    const { id: _id, ...updates } = args;

    // Filter out undefined values and add timestamp
    const cleanUpdates = {
      ...filterUndefined(updates),
      updatedAt: Date.now(),
    };

    await ctx.db.patch(args.id, cleanUpdates);

    return args.id;
  },
});

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
 * Transfer an arrangement to the Public group (crowdsourced)
 * Access: Original creator only
 *
 * This allows anyone to donate their arrangement to Public for community editing,
 * even if they're not a member of the Public group.
 * The original creator retains edit rights via createdBy.
 */
export const transferToPublic = mutation({
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

    // Check if already public
    const publicGroup = await getPublicGroup(ctx);
    if (!publicGroup) {
      throw new Error("Public group not found");
    }

    if (
      arrangement.ownerType === "group" &&
      arrangement.ownerId === publicGroup._id.toString()
    ) {
      throw new Error("Arrangement is already owned by Public");
    }

    // Transfer to Public
    await ctx.db.patch(args.id, {
      ownerType: "group",
      ownerId: publicGroup._id.toString(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Reclaim an arrangement from the Public group back to personal ownership
 * Access: Original creator only
 *
 * Allows the person who originally created and transferred the arrangement
 * to take it back under their personal ownership.
 */
export const reclaimFromPublic = mutation({
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

    // Check if currently public
    const publicGroup = await getPublicGroup(ctx);
    if (
      !publicGroup ||
      arrangement.ownerType !== "group" ||
      arrangement.ownerId !== publicGroup._id.toString()
    ) {
      throw new Error("Arrangement is not currently owned by Public");
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
