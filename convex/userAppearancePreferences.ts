import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuthenticatedUser } from "./permissions";
import { getAuthUserId } from "@convex-dev/auth/server";

// ============ QUERIES ============

/**
 * Get current user's appearance preferences
 * Access: Authenticated users only
 * Returns null if no preferences set (use defaults)
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    // Use getAuthUserId for consistency with mutations
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Check if user is anonymous (no email = can't have preferences)
    const user = await ctx.db.get(userId);
    if (!user || !user.email) {
      return null;
    }

    return await ctx.db
      .query("userAppearancePreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

// ============ MUTATIONS ============

/**
 * Upsert (create or update) appearance preferences
 * Access: Authenticated users only
 */
export const upsert = mutation({
  args: {
    colorPreset: v.optional(v.string()),
    primaryColorId: v.optional(v.string()),
    accentColorId: v.optional(v.string()),
    fontFamily: v.optional(v.string()),
    fontSize: v.optional(v.number()),
    chordFontFamily: v.optional(v.string()),
    chordFontSize: v.optional(v.number()),
    chordFontWeight: v.optional(v.string()),
    chordColorId: v.optional(v.string()),
    chordHighlight: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(ctx);

    const existing = await ctx.db
      .query("userAppearancePreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const data = {
      ...args,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("userAppearancePreferences", {
        userId,
        ...data,
      });
    }
  },
});

/**
 * Reset appearance preferences to defaults (deletes the record)
 * Access: Authenticated users only
 */
export const reset = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireAuthenticatedUser(ctx);

    const existing = await ctx.db
      .query("userAppearancePreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { success: true };
  },
});
