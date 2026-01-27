import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAuthenticatedUser } from "./permissions";

// ============ QUERIES ============

/**
 * Get user's recently viewed arrangements with full arrangement and song data
 * Returns up to 10 recent views, sorted by most recent first
 */
export const getRecentViews = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = args.limit ?? 10;

    const views = await ctx.db
      .query("userViews")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Sort by viewedAt descending and take limit
    const sortedViews = views
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, limit);

    // Batch fetch all arrangements with their songs
    const arrangements = await Promise.all(
      sortedViews.map(async (view) => {
        const arrangement = await ctx.db.get(view.arrangementId);
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
          viewedAt: view.viewedAt,
        };
      })
    );

    // Filter out deleted arrangements
    return arrangements.filter((a): a is NonNullable<typeof a> => a !== null);
  },
});

// ============ MUTATIONS ============

/**
 * Record a view of an arrangement
 * Upserts: if user has viewed before, updates timestamp; otherwise creates new record
 * Limits to 20 most recent views per user to prevent unbounded growth
 */
export const recordView = mutation({
  args: {
    arrangementId: v.id("arrangements"),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(ctx);

    // Check if arrangement exists
    const arrangement = await ctx.db.get(args.arrangementId);
    if (!arrangement) {
      throw new Error("Arrangement not found");
    }

    // Check for existing view record
    const existing = await ctx.db
      .query("userViews")
      .withIndex("by_user_and_arrangement", (q) =>
        q.eq("userId", userId).eq("arrangementId", args.arrangementId)
      )
      .unique();

    if (existing) {
      // Update existing view timestamp
      await ctx.db.patch(existing._id, {
        viewedAt: Date.now(),
      });
    } else {
      // Create new view record
      await ctx.db.insert("userViews", {
        userId,
        arrangementId: args.arrangementId,
        viewedAt: Date.now(),
      });

      // Clean up old views to keep only the most recent 20
      const allViews = await ctx.db
        .query("userViews")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      if (allViews.length > 20) {
        // Sort by viewedAt and delete oldest ones
        const sortedViews = allViews.sort((a, b) => b.viewedAt - a.viewedAt);
        const viewsToDelete = sortedViews.slice(20);

        for (const view of viewsToDelete) {
          await ctx.db.delete(view._id);
        }
      }
    }

    return { success: true };
  },
});
