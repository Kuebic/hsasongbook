import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";

// ============ QUERIES ============

/**
 * Check if a username is available
 * Access: Everyone (for real-time availability check during signup)
 */
export const isUsernameAvailable = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.username.toLowerCase().trim();

    // Basic validation
    if (normalized.length < 3 || normalized.length > 30) {
      return { available: false, reason: "Username must be 3-30 characters" };
    }

    const usernameRegex = /^[a-z0-9_-]+$/;
    if (!usernameRegex.test(normalized)) {
      return { available: false, reason: "Only lowercase letters, numbers, underscores, and hyphens allowed" };
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", normalized))
      .first();

    return { available: existing === null };
  },
});

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
 * Set username for current user (called after signup)
 * Access: Authenticated users only, can only be set once
 */
export const setUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.username) {
      throw new Error("Username already set");
    }

    // Validate format
    const normalized = args.username.toLowerCase().trim();
    const usernameRegex = /^[a-z0-9_-]{3,30}$/;
    if (!usernameRegex.test(normalized)) {
      throw new Error(
        "Username must be 3-30 characters, lowercase letters, numbers, underscores, or hyphens"
      );
    }

    // Check uniqueness
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", normalized))
      .first();
    if (existing) {
      throw new Error("Username is already taken");
    }

    await ctx.db.patch(userId, { username: normalized });
    return { success: true };
  },
});

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
