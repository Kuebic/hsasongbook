import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { requireAuthenticatedUser } from "./permissions";

const r2 = new R2(components.r2);

// ============ R2 CLIENT API ============

// Export the R2 client API for use with useUploadFile hook
export const {
  generateUploadUrl,
  syncMetadata,
  deleteObject,
  getMetadata,
  listMetadata,
} = r2.clientApi<DataModel>({
  // Only authenticated users can upload
  checkUpload: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to upload files");
    }
    const user = await ctx.db.get(userId);
    if (!user?.email) {
      throw new Error("Anonymous users cannot upload files. Please sign in.");
    }
  },
  // Only authenticated users can delete their own files
  checkDelete: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to delete files");
    }
  },
});

// ============ AVATAR MUTATIONS ============

/**
 * Save the avatar key to the user record after successful upload
 * Deletes the old avatar if one exists
 * Access: Authenticated users only
 */
export const saveAvatar = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const { userId, user } = await requireAuthenticatedUser(ctx);

    // Delete old avatar from R2 if exists
    if (user.avatarKey) {
      try {
        await r2.deleteObject(ctx, user.avatarKey);
      } catch {
        // Ignore errors deleting old avatar - it may not exist
        console.warn("Failed to delete old avatar:", user.avatarKey);
      }
    }

    // Save new avatar key to user record
    await ctx.db.patch(userId, { avatarKey: args.key });

    return { success: true };
  },
});

/**
 * Remove the user's avatar
 * Access: Authenticated users only
 */
export const removeAvatar = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId, user } = await requireAuthenticatedUser(ctx);

    // Delete from R2 if exists
    if (user.avatarKey) {
      try {
        await r2.deleteObject(ctx, user.avatarKey);
      } catch {
        console.warn("Failed to delete avatar from R2:", user.avatarKey);
      }
    }

    // Clear avatar key from user record
    await ctx.db.patch(userId, { avatarKey: undefined });

    return { success: true };
  },
});

// ============ AVATAR QUERIES ============

/**
 * Get a signed URL for a user's avatar
 * Returns null if user has no avatar
 * Access: Everyone
 */
export const getAvatarUrl = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user?.avatarKey) {
      return null;
    }

    // Generate signed URL valid for 24 hours
    return await r2.getUrl(user.avatarKey, {
      expiresIn: 60 * 60 * 24,
    });
  },
});

/**
 * Get avatar URLs for multiple users (batch)
 * Useful for displaying avatars on arrangement cards
 * Access: Everyone
 */
export const getAvatarUrls = query({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const results: Record<string, string | null> = {};

    await Promise.all(
      args.userIds.map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (user?.avatarKey) {
          results[userId] = await r2.getUrl(user.avatarKey, {
            expiresIn: 60 * 60 * 24,
          });
        } else {
          results[userId] = null;
        }
      })
    );

    return results;
  },
});
