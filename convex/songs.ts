import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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

// ============ MUTATIONS ============

/**
 * Create a new song
 * Access: Authenticated users only (not anonymous)
 */
export const create = mutation({
  args: {
    title: v.string(),
    artist: v.optional(v.string()),
    themes: v.array(v.string()),
    copyright: v.optional(v.string()),
    lyrics: v.optional(v.string()),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to create songs");
    }

    // Check user is not anonymous (anonymous users don't have email)
    const user = await ctx.db.get(userId);
    if (!user?.email) {
      throw new Error("Anonymous users cannot create songs. Please sign in.");
    }

    // Check slug uniqueness
    const existing = await ctx.db
      .query("songs")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) {
      throw new Error("A song with this slug already exists");
    }

    const songId = await ctx.db.insert("songs", {
      ...args,
      createdBy: userId,
    });

    return songId;
  },
});
