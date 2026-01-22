import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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
 * Get arrangement by URL slug WITH creator info
 * Access: Everyone
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

    return {
      ...arrangement,
      creator: creator
        ? {
            _id: creator._id,
            username: creator.username,
            displayName: creator.displayName,
            showRealName: creator.showRealName,
            avatarKey: creator.avatarKey,
          }
        : null,
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
          creator: creator
            ? {
                _id: creator._id,
                username: creator.username,
                displayName: creator.displayName,
                showRealName: creator.showRealName,
                avatarKey: creator.avatarKey,
              }
            : null,
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
          creator: creator
            ? {
                _id: creator._id,
                username: creator.username,
                displayName: creator.displayName,
                showRealName: creator.showRealName,
                avatarKey: creator.avatarKey,
              }
            : null,
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to create arrangements");
    }

    // Check user is not anonymous
    const user = await ctx.db.get(userId);
    if (!user?.email) {
      throw new Error(
        "Anonymous users cannot create arrangements. Please sign in."
      );
    }

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
    });

    return arrangementId;
  },
});

/**
 * Update an arrangement
 * Access: Creator only
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
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to update arrangements");
    }

    const arrangement = await ctx.db.get(args.id);
    if (!arrangement) {
      throw new Error("Arrangement not found");
    }

    // Check ownership
    if (arrangement.createdBy !== userId) {
      throw new Error("You can only edit your own arrangements");
    }

    const { id, ...updates } = args;

    // Filter out undefined values and build patch object
    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    // Add updatedAt timestamp
    cleanUpdates.updatedAt = Date.now();

    await ctx.db.patch(args.id, cleanUpdates);

    return args.id;
  },
});
