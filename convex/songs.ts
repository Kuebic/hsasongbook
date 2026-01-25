import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  requireAuth,
  requireAuthenticatedUser,
  getContentOwnerInfo,
  canEditSong,
  isSongOwner,
  getCommunityGroup,
  filterUndefined,
  isGroupAdminOrOwner,
  isCommunityGroup,
} from "./permissions";
import { Id } from "./_generated/dataModel";
import { maybeCreateVersionSnapshot } from "./versions";

// ============ QUERIES ============

/**
 * Get all songs (for browse/search page)
 * Access: Everyone (including anonymous)
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("songs").collect();
  },
});

/**
 * Get single song by ID
 * Access: Everyone
 */
export const get = query({
  args: { id: v.id("songs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get song by URL slug
 * Access: Everyone
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("songs")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

/**
 * Get song by URL slug WITH owner info for display
 * Access: Everyone
 */
export const getBySlugWithOwner = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const song = await ctx.db
      .query("songs")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!song) return null;

    const owner = await getContentOwnerInfo(ctx, song);

    return { ...song, owner };
  },
});

/**
 * Get count of all songs
 * Access: Everyone
 */
export const count = query({
  args: {},
  handler: async (ctx) => {
    const songs = await ctx.db.query("songs").collect();
    return songs.length;
  },
});

// ============ PERMISSION QUERIES ============

/**
 * Check if current user can edit a song
 * Returns { canEdit, isOwner, isOriginalCreator }
 *
 * - isOwner: true if user owns the song (or is group owner for group-owned songs)
 * - isOriginalCreator: true if user originally created the song (via createdBy)
 *   This is important for reclaim functionality - original creator can always reclaim
 */
export const canEdit = query({
  args: { songId: v.id("songs") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { canEdit: false, isOwner: false, isOriginalCreator: false };
    }

    const song = await ctx.db.get(args.songId);
    if (!song) {
      return { canEdit: false, isOwner: false, isOriginalCreator: false };
    }

    const isOwner = await isSongOwner(ctx, args.songId, userId);
    const isOriginalCreator = song.createdBy === userId;
    const canEditResult = await canEditSong(ctx, args.songId, userId);

    return {
      canEdit: canEditResult,
      isOwner,
      isOriginalCreator,
    };
  },
});

// ============ MUTATIONS ============

/**
 * Create a new song
 * Access: Authenticated users only (not anonymous)
 *
 * Phase 2: Supports group ownership
 * - If ownerType='group', verify user is owner/admin of that group
 * - Community group excluded (transfer only)
 */
export const create = mutation({
  args: {
    title: v.string(),
    artist: v.optional(v.string()),
    themes: v.array(v.string()),
    copyright: v.optional(v.string()),
    lyrics: v.optional(v.string()),
    origin: v.optional(v.string()),
    slug: v.string(),
    // Phase 2: Group ownership
    ownerType: v.optional(v.union(v.literal("user"), v.literal("group"))),
    ownerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(ctx);

    // Check slug uniqueness
    const existing = await ctx.db
      .query("songs")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) {
      throw new Error("A song with this slug already exists");
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

    const songId = await ctx.db.insert("songs", {
      title: args.title,
      artist: args.artist,
      themes: args.themes,
      copyright: args.copyright,
      lyrics: args.lyrics,
      origin: args.origin,
      slug: args.slug,
      createdBy: userId,
      ownerType,
      ownerId,
    });

    return songId;
  },
});

/**
 * Update a song
 * Access: Owner, or Community group members for Community-owned songs
 */
export const update = mutation({
  args: {
    id: v.id("songs"),
    title: v.optional(v.string()),
    artist: v.optional(v.string()),
    themes: v.optional(v.array(v.string())),
    copyright: v.optional(v.string()),
    lyrics: v.optional(v.string()),
    origin: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const song = await ctx.db.get(args.id);
    if (!song) {
      throw new Error("Song not found");
    }

    // Permission check
    const canEdit = await canEditSong(ctx, args.id, userId);
    if (!canEdit) {
      throw new Error("You don't have permission to edit this song");
    }

    // Create version snapshot for Community-owned songs (if changed)
    await maybeCreateVersionSnapshot(ctx, "song", { ...song, _id: args.id }, userId);

    // Patch song with updated timestamp
    const { id: _id, ...updates } = args;
    const cleanUpdates = {
      ...filterUndefined(updates),
      updatedAt: Date.now(),
    };
    await ctx.db.patch(args.id, cleanUpdates);

    return args.id;
  },
});

/**
 * Transfer a song to the Community group (crowdsourced)
 * Access: Original creator only
 *
 * This allows anyone to donate their song to Community for community editing,
 * even if they're not a member of the Community group.
 * The original creator retains edit rights via createdBy.
 */
export const transferToCommunity = mutation({
  args: { id: v.id("songs") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const song = await ctx.db.get(args.id);
    if (!song) {
      throw new Error("Song not found");
    }

    // Only original creator can transfer
    if (song.createdBy !== userId) {
      throw new Error("Only the original creator can transfer this song");
    }

    // Check if already community-owned
    const communityGroup = await getCommunityGroup(ctx);
    if (!communityGroup) {
      throw new Error("Community group not found");
    }

    if (
      song.ownerType === "group" &&
      song.ownerId === communityGroup._id.toString()
    ) {
      throw new Error("Song is already owned by Community");
    }

    // Create initial version snapshot before transferring
    const snapshot = JSON.stringify({
      title: song.title,
      artist: song.artist,
      themes: song.themes,
      copyright: song.copyright,
      lyrics: song.lyrics,
    });

    await ctx.runMutation(internal.versions.createVersion, {
      contentType: "song",
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
 * Reclaim a song from the Community group back to personal ownership
 * Access: Original creator only
 *
 * Allows the person who originally created and transferred the song
 * to take it back under their personal ownership.
 */
export const reclaimFromCommunity = mutation({
  args: { id: v.id("songs") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const song = await ctx.db.get(args.id);
    if (!song) {
      throw new Error("Song not found");
    }

    // Only original creator can reclaim
    if (song.createdBy !== userId) {
      throw new Error("Only the original creator can reclaim this song");
    }

    // Check if currently community-owned
    const communityGroup = await getCommunityGroup(ctx);
    if (
      !communityGroup ||
      song.ownerType !== "group" ||
      song.ownerId !== communityGroup._id.toString()
    ) {
      throw new Error("Song is not currently owned by Community");
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

// ============ BROWSE QUERIES ============

/**
 * Get recently added songs
 * Access: Everyone
 */
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 6;
    const songs = await ctx.db
      .query("songs")
      .order("desc") // _creationTime descending
      .take(limit);
    return songs;
  },
});

/**
 * Get popular songs (by arrangement count)
 * Access: Everyone
 *
 * Uses denormalized arrangementCount field for efficient querying.
 */
export const getPopular = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 6;

    // Use index on arrangementCount for efficient sorting
    const songs = await ctx.db
      .query("songs")
      .withIndex("by_arrangementCount")
      .order("desc")
      .take(limit);

    return songs;
  },
});

/**
 * Get featured songs by slug list
 * Access: Everyone
 */
export const getFeatured = query({
  args: { slugs: v.array(v.string()) },
  handler: async (ctx, args) => {
    const songs = await Promise.all(
      args.slugs.map((slug) =>
        ctx.db
          .query("songs")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .unique()
      )
    );
    return songs.filter(Boolean);
  },
});

/**
 * Get distinct themes for filter dropdown
 * Access: Everyone
 */
export const getDistinctThemes = query({
  args: {},
  handler: async (ctx) => {
    const songs = await ctx.db.query("songs").collect();
    const themes = new Set<string>();
    for (const song of songs) {
      song.themes?.forEach((t) => themes.add(t));
    }
    return Array.from(themes).sort();
  },
});

/**
 * Get distinct artists for filter dropdown
 * Access: Everyone
 */
export const getDistinctArtists = query({
  args: {},
  handler: async (ctx) => {
    const songs = await ctx.db.query("songs").collect();
    const artists = new Set<string>();
    for (const song of songs) {
      if (song.artist) artists.add(song.artist);
    }
    return Array.from(artists).sort();
  },
});

/**
 * Get distinct origins for filter dropdown
 * Access: Everyone
 */
export const getDistinctOrigins = query({
  args: {},
  handler: async (ctx) => {
    const songs = await ctx.db.query("songs").collect();
    const origins = new Set<string>();
    for (const song of songs) {
      if (song.origin) origins.add(song.origin);
    }
    return Array.from(origins).sort();
  },
});

/**
 * List songs with arrangement summary for browse page
 * Supports filtering by song-level and arrangement-level criteria
 * Access: Everyone
 *
 * Uses denormalized arrangement fields on songs for efficient querying.
 */
export const listWithArrangementSummary = query({
  args: {
    // Song-level filters
    themes: v.optional(v.array(v.string())),
    artist: v.optional(v.string()),
    origin: v.optional(v.string()),
    dateFrom: v.optional(v.number()), // timestamp
    dateTo: v.optional(v.number()),
    searchQuery: v.optional(v.string()),
    // Arrangement-level filters (filter songs by their arrangements)
    hasKey: v.optional(v.string()),
    tempoRange: v.optional(
      v.union(v.literal("slow"), v.literal("medium"), v.literal("fast"))
    ),
    hasDifficulty: v.optional(
      v.union(v.literal("simple"), v.literal("standard"), v.literal("advanced"))
    ),
    // Arrangement filter: show all, only songs with arrangements, or only songs needing arrangements
    arrangementFilter: v.optional(
      v.union(
        v.literal("all"),
        v.literal("has_arrangements"),
        v.literal("needs_arrangements")
      )
    ),
    // Sort options
    sortBy: v.optional(
      v.union(
        v.literal("popular"),
        v.literal("newest"),
        v.literal("oldest"),
        v.literal("alphabetical"),
        v.literal("alphabetical_desc")
      )
    ),
    // Pagination
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all songs (still loads all, but no longer loads arrangements)
    let songs = await ctx.db.query("songs").collect();

    // Apply song-level filters
    if (args.themes && args.themes.length > 0) {
      songs = songs.filter((song) =>
        args.themes!.some((theme) => song.themes?.includes(theme))
      );
    }

    if (args.artist) {
      songs = songs.filter((song) =>
        song.artist?.toLowerCase().includes(args.artist!.toLowerCase())
      );
    }

    if (args.origin) {
      songs = songs.filter((song) => song.origin === args.origin);
    }

    if (args.dateFrom) {
      songs = songs.filter((song) => song._creationTime >= args.dateFrom!);
    }

    if (args.dateTo) {
      songs = songs.filter((song) => song._creationTime <= args.dateTo!);
    }

    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      songs = songs.filter(
        (song) =>
          song.title.toLowerCase().includes(query) ||
          song.artist?.toLowerCase().includes(query) ||
          song.themes?.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Apply arrangement-level filters using denormalized fields
    if (args.hasKey) {
      songs = songs.filter((song) =>
        song.arrangementKeys?.includes(args.hasKey!)
      );
    }

    if (args.tempoRange) {
      const tempoRanges = {
        slow: { min: 0, max: 69 },
        medium: { min: 70, max: 110 },
        fast: { min: 111, max: 999 },
      };
      const range = tempoRanges[args.tempoRange];
      songs = songs.filter((song) => {
        const tempoMin = song.arrangementTempoMin;
        const tempoMax = song.arrangementTempoMax;
        if (tempoMin === undefined || tempoMax === undefined) return false;
        // Song matches if any of its arrangements fall within the tempo range
        return tempoMax >= range.min && tempoMin <= range.max;
      });
    }

    if (args.hasDifficulty) {
      songs = songs.filter((song) =>
        song.arrangementDifficulties?.includes(args.hasDifficulty!)
      );
    }

    // Apply arrangement filter
    if (args.arrangementFilter === "has_arrangements") {
      songs = songs.filter((song) => (song.arrangementCount ?? 0) > 0);
    } else if (args.arrangementFilter === "needs_arrangements") {
      songs = songs.filter((song) => (song.arrangementCount ?? 0) === 0);
    }

    // Apply sorting using denormalized fields
    const sortBy = args.sortBy || "popular";
    switch (sortBy) {
      case "popular":
        songs.sort(
          (a, b) => (b.arrangementCount ?? 0) - (a.arrangementCount ?? 0)
        );
        break;
      case "newest":
        songs.sort((a, b) => b._creationTime - a._creationTime);
        break;
      case "oldest":
        songs.sort((a, b) => a._creationTime - b._creationTime);
        break;
      case "alphabetical":
        songs.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "alphabetical_desc":
        songs.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    // Apply limit
    const limit = args.limit || 50;
    songs = songs.slice(0, limit);

    // Return songs with arrangement summary from denormalized fields
    return songs.map((song) => ({
      ...song,
      arrangementSummary: {
        count: song.arrangementCount ?? 0,
        keys: song.arrangementKeys ?? [],
        tempoMin: song.arrangementTempoMin ?? null,
        tempoMax: song.arrangementTempoMax ?? null,
        avgRating: song.arrangementAvgRating ?? 0,
        totalFavorites: song.arrangementTotalFavorites ?? 0,
        difficulties: song.arrangementDifficulties ?? [],
      },
    }));
  },
});
