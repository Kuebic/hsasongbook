import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";

// ============ QUERIES ============

/**
 * Get the currently authenticated user
 * Returns null if not authenticated
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const user = await ctx.db.get(userId);
    return user;
  },
});

/**
 * Get a user by ID
 * Access: Everyone
 */
export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Get stats for the current user (songs, arrangements, setlists created)
 * Access: Authenticated users only
 */
export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Use indexes for efficient lookups
    const songs = await ctx.db
      .query("songs")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", userId))
      .collect();
    const arrangements = await ctx.db
      .query("arrangements")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", userId))
      .collect();
    const setlists = await ctx.db
      .query("setlists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return {
      songs: songs.length,
      arrangements: arrangements.length,
      setlists: setlists.length,
    };
  },
});

// ============ MUTATIONS ============

/**
 * Update current user's display name
 * Access: Authenticated users only
 */
export const updateDisplayName = mutation({
  args: { displayName: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to update display name");
    }

    const user = await ctx.db.get(userId);
    if (!user?.email) {
      throw new Error(
        "Anonymous users cannot update display name. Please sign in."
      );
    }

    // Validate display name (3-50 chars, no leading/trailing whitespace)
    const trimmed = args.displayName.trim();
    if (trimmed.length < 3 || trimmed.length > 50) {
      throw new Error("Display name must be between 3 and 50 characters");
    }

    await ctx.db.patch(userId, { displayName: trimmed });

    return { success: true };
  },
});
