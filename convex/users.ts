import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, internalMutation } from "./_generated/server";
import { requireAuthenticatedUser } from "./permissions";

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
 * Get a user by username
 * Access: Everyone (for public profile pages)
 */
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.username.toLowerCase();
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", normalized))
      .first();
  },
});

/**
 * Search users by username (prefix match)
 * Access: Authenticated users only (for adding collaborators)
 * Returns up to 10 matching non-anonymous users
 */
export const searchByUsername = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const searchQuery = args.query.toLowerCase().trim();
    if (searchQuery.length < 2) {
      return [];
    }

    // Get all users with usernames (not anonymous) and filter by prefix
    const users = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("username"), undefined))
      .collect();

    // Filter by prefix match on username and exclude current user
    const matches = users
      .filter(
        (u) =>
          u.username &&
          u.username.toLowerCase().startsWith(searchQuery) &&
          u._id !== userId &&
          u.email // Only non-anonymous users
      )
      .slice(0, 10)
      .map((u) => ({
        _id: u._id,
        username: u.username,
        displayName: u.displayName,
        showRealName: u.showRealName,
        avatarKey: u.avatarKey,
      }));

    return matches;
  },
});

/**
 * Search users by username or email (for sharing)
 * Access: Authenticated users only
 * Returns up to 10 matching non-anonymous users
 */
export const searchByUsernameOrEmail = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const term = args.searchTerm.toLowerCase().trim();
    if (term.length < 2) {
      return [];
    }

    // Get all users with usernames (not anonymous)
    const users = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("username"), undefined))
      .collect();

    // Filter by match on username or email, exclude current user
    const matches = users
      .filter(
        (u) =>
          u._id !== userId &&
          u.email && // Only non-anonymous users
          (u.username?.toLowerCase().includes(term) ||
            u.email?.toLowerCase().includes(term))
      )
      .slice(0, 10)
      .map((u) => ({
        _id: u._id,
        username: u.username,
        displayName: u.displayName,
        // Don't expose full email for privacy
      }));

    return matches;
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
    const { userId, user } = await requireAuthenticatedUser(ctx);

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
    const { userId } = await requireAuthenticatedUser(ctx);

    // Validate display name (3-50 chars, no leading/trailing whitespace)
    const trimmed = args.displayName.trim();
    if (trimmed.length < 3 || trimmed.length > 50) {
      throw new Error("Display name must be between 3 and 50 characters");
    }

    await ctx.db.patch(userId, { displayName: trimmed });

    return { success: true };
  },
});

/**
 * Update current user's showRealName preference
 * Access: Authenticated users only
 */
export const updateShowRealName = mutation({
  args: { showRealName: v.boolean() },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(ctx);

    await ctx.db.patch(userId, { showRealName: args.showRealName });

    return { success: true };
  },
});

/**
 * Update current user's recently viewed visibility preference
 * Access: Authenticated users only
 */
export const updateRecentlyViewedVisibility = mutation({
  args: { showRecentlyViewed: v.boolean() },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(ctx);

    await ctx.db.patch(userId, { showRecentlyViewed: args.showRecentlyViewed });

    return { success: true };
  },
});

/**
 * Mark welcome onboarding as completed
 * Access: Authenticated users only
 */
export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireAuthenticatedUser(ctx);
    await ctx.db.patch(userId, { onboardingCompleted: true });
    return { success: true };
  },
});

/**
 * Mark ChordPro tutorial as seen
 * Access: Authenticated users only
 */
export const markChordProTutorialSeen = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireAuthenticatedUser(ctx);
    await ctx.db.patch(userId, { hasSeenChordProTutorial: true });
    return { success: true };
  },
});

// ============ INTERNAL MUTATIONS ============

/**
 * Prune anonymous users older than 7 days
 * Called by cron job weekly - cleans up auth tables for stale anonymous users
 */
export const pruneAnonymousUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - SEVEN_DAYS_MS;

    // Find all anonymous users older than 7 days
    const anonymousUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isAnonymous"), true))
      .collect();

    const staleUsers = anonymousUsers.filter(
      (user) => user._creationTime < cutoffTime
    );

    let deletedCount = 0;

    for (const user of staleUsers) {
      // 1. Get all sessions for this user
      const sessions = await ctx.db
        .query("authSessions")
        .withIndex("userId", (q) => q.eq("userId", user._id))
        .collect();

      // 2. Delete refresh tokens and verifiers for each session
      for (const session of sessions) {
        const refreshTokens = await ctx.db
          .query("authRefreshTokens")
          .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
          .collect();
        for (const token of refreshTokens) {
          await ctx.db.delete(token._id);
        }

        const verifiers = await ctx.db
          .query("authVerifiers")
          .withIndex("signature")
          .filter((q) => q.eq(q.field("sessionId"), session._id))
          .collect();
        for (const verifier of verifiers) {
          await ctx.db.delete(verifier._id);
        }
      }

      // 3. Get all accounts for this user and delete verification codes
      const accounts = await ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) => q.eq("userId", user._id))
        .collect();

      for (const account of accounts) {
        const verificationCodes = await ctx.db
          .query("authVerificationCodes")
          .withIndex("accountId", (q) => q.eq("accountId", account._id))
          .collect();
        for (const code of verificationCodes) {
          await ctx.db.delete(code._id);
        }
      }

      // 4. Delete sessions
      for (const session of sessions) {
        await ctx.db.delete(session._id);
      }

      // 5. Delete accounts
      for (const account of accounts) {
        await ctx.db.delete(account._id);
      }

      // 6. Delete the user
      await ctx.db.delete(user._id);
      deletedCount++;
    }

    console.log(
      `Pruned ${deletedCount} anonymous users older than 7 days (${staleUsers.length} found)`
    );

    return { deletedCount };
  },
});
