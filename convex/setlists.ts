import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { filterUndefined, requireAuth, requireAuthenticatedUser } from "./permissions";

// ============ QUERIES ============

/**
 * Get user's setlists
 * Access: Owner only (returns empty for unauthenticated)
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("setlists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/**
 * Get single setlist by ID
 * Access: Owner only
 */
export const get = query({
  args: { id: v.id("setlists") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const setlist = await ctx.db.get(args.id);

    // Verify ownership
    if (!setlist || setlist.userId !== userId) {
      return null;
    }

    return setlist;
  },
});

/**
 * Get setlist with full arrangement and song data
 * Access: Owner only
 */
export const getWithArrangements = query({
  args: { id: v.id("setlists") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const setlist = await ctx.db.get(args.id);

    // Verify ownership
    if (!setlist || setlist.userId !== userId) {
      return null;
    }

    // Load arrangements with their songs
    const arrangements = await Promise.all(
      setlist.arrangementIds.map(async (arrId) => {
        const arr = await ctx.db.get(arrId);
        if (!arr) return null;

        // Load parent song
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

    return {
      ...setlist,
      arrangements: arrangements.filter((a) => a !== null),
    };
  },
});

// ============ MUTATIONS ============

/**
 * Create a new setlist
 * Access: Authenticated users only (not anonymous)
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    performanceDate: v.optional(v.string()),
    arrangementIds: v.optional(v.array(v.id("arrangements"))),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(ctx);

    const setlistId = await ctx.db.insert("setlists", {
      name: args.name,
      description: args.description,
      performanceDate: args.performanceDate,
      arrangementIds: args.arrangementIds ?? [],
      userId,
    });

    return setlistId;
  },
});

/**
 * Update a setlist
 * Access: Owner only
 */
export const update = mutation({
  args: {
    id: v.id("setlists"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    performanceDate: v.optional(v.string()),
    arrangementIds: v.optional(v.array(v.id("arrangements"))),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const setlist = await ctx.db.get(args.id);
    if (!setlist) {
      throw new Error("Setlist not found");
    }

    // Check ownership
    if (setlist.userId !== userId) {
      throw new Error("You can only edit your own setlists");
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

/**
 * Delete a setlist
 * Access: Owner only
 */
export const remove = mutation({
  args: { id: v.id("setlists") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const setlist = await ctx.db.get(args.id);
    if (!setlist) {
      throw new Error("Setlist not found");
    }

    // Check ownership
    if (setlist.userId !== userId) {
      throw new Error("You can only delete your own setlists");
    }

    await ctx.db.delete(args.id);
  },
});

/**
 * Add an arrangement to a setlist
 * Access: Owner only
 */
export const addArrangement = mutation({
  args: {
    setlistId: v.id("setlists"),
    arrangementId: v.id("arrangements"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const setlist = await ctx.db.get(args.setlistId);
    if (!setlist) {
      throw new Error("Setlist not found");
    }

    // Check ownership
    if (setlist.userId !== userId) {
      throw new Error("You can only add to your own setlists");
    }

    // Check if arrangement exists
    const arrangement = await ctx.db.get(args.arrangementId);
    if (!arrangement) {
      throw new Error("Arrangement not found");
    }

    // Check if already in setlist
    if (setlist.arrangementIds.includes(args.arrangementId)) {
      throw new Error("Arrangement is already in this setlist");
    }

    // Add to end of setlist
    await ctx.db.patch(args.setlistId, {
      arrangementIds: [...setlist.arrangementIds, args.arrangementId],
      updatedAt: Date.now(),
    });

    return args.setlistId;
  },
});
