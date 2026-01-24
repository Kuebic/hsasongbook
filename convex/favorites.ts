import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id, Doc } from "./_generated/dataModel";
import { requireAuthenticatedUser } from "./permissions";

// ============ QUERIES ============

/**
 * Check if the current user has favorited a specific item
 */
export const isFavorited = query({
  args: {
    targetType: v.union(v.literal("song"), v.literal("arrangement")),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const favorite = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_and_target", (q) =>
        q
          .eq("userId", userId)
          .eq("targetType", args.targetType)
          .eq("targetId", args.targetId)
      )
      .unique();

    return !!favorite;
  },
});

/**
 * Get list of IDs the current user has favorited (for browse filtering)
 */
export const getFavoriteIds = query({
  args: {
    targetType: v.union(v.literal("song"), v.literal("arrangement")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const favorites = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", userId).eq("targetType", args.targetType)
      )
      .collect();

    return favorites.map((f) => f.targetId);
  },
});

/**
 * Get user's favorited songs with full song data
 */
export const getUserFavoriteSongs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const favorites = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", userId).eq("targetType", "song")
      )
      .collect();

    // Batch fetch all songs
    const songs = await Promise.all(
      favorites.map(async (f) => {
        const song = await ctx.db.get(f.targetId as Id<"songs">);
        if (!song) return null;
        return {
          ...song,
          favoritedAt: f.createdAt,
        };
      })
    );

    // Filter out deleted songs and sort by favorited date (newest first)
    return songs
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => b.favoritedAt - a.favoritedAt);
  },
});

/**
 * Get user's favorited arrangements with full arrangement and song data
 */
export const getUserFavoriteArrangements = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const favorites = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", userId).eq("targetType", "arrangement")
      )
      .collect();

    // Batch fetch all arrangements with their songs
    const arrangements = await Promise.all(
      favorites.map(async (f) => {
        const arrangement = await ctx.db.get(
          f.targetId as Id<"arrangements">
        );
        if (!arrangement) return null;

        const song = await ctx.db.get(arrangement.songId);
        if (!song) return null;

        const creator = await ctx.db.get(arrangement.createdBy);

        return {
          ...arrangement,
          song: {
            _id: song._id,
            title: song.title,
            artist: song.artist,
            slug: song.slug,
          },
          creator: creator
            ? {
                _id: creator._id,
                username: creator.username,
                displayName: creator.displayName,
              }
            : null,
          favoritedAt: f.createdAt,
        };
      })
    );

    // Filter out deleted arrangements and sort by favorited date (newest first)
    return arrangements
      .filter((a): a is NonNullable<typeof a> => a !== null)
      .sort((a, b) => b.favoritedAt - a.favoritedAt);
  },
});

/**
 * Get favorite count for a specific item
 */
export const getFavoriteCount = query({
  args: {
    targetType: v.union(v.literal("song"), v.literal("arrangement")),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("userFavorites")
      .withIndex("by_target", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId)
      )
      .collect();

    return favorites.length;
  },
});

// ============ MUTATIONS ============

/**
 * Toggle favorite status for a song or arrangement
 */
export const toggle = mutation({
  args: {
    targetType: v.union(v.literal("song"), v.literal("arrangement")),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    // Check if already favorited
    const existing = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_and_target", (q) =>
        q
          .eq("userId", user._id)
          .eq("targetType", args.targetType)
          .eq("targetId", args.targetId)
      )
      .unique();

    if (existing) {
      // Remove favorite
      await ctx.db.delete(existing._id);
      // Decrement count on target
      await updateFavoriteCount(ctx, args.targetType, args.targetId, -1);
      return { favorited: false };
    } else {
      // Add favorite
      await ctx.db.insert("userFavorites", {
        userId: user._id,
        targetType: args.targetType,
        targetId: args.targetId,
        createdAt: Date.now(),
      });
      // Increment count on target
      await updateFavoriteCount(ctx, args.targetType, args.targetId, 1);
      return { favorited: true };
    }
  },
});

// ============ HELPER FUNCTIONS ============

/**
 * Update the denormalized favorites count on a song or arrangement
 */
async function updateFavoriteCount(
  ctx: QueryCtx & { db: { patch: Function } },
  targetType: "song" | "arrangement",
  targetId: string,
  delta: number
) {
  if (targetType === "song") {
    const song = await ctx.db.get(targetId as Id<"songs">);
    if (song) {
      await ctx.db.patch(targetId as Id<"songs">, {
        favorites: Math.max(0, (song.favorites || 0) + delta),
      });
    }
  } else {
    const arrangement = await ctx.db.get(targetId as Id<"arrangements">);
    if (arrangement) {
      await ctx.db.patch(targetId as Id<"arrangements">, {
        favorites: Math.max(0, (arrangement.favorites || 0) + delta),
      });
    }
  }
}
