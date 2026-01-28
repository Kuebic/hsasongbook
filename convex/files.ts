import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { requireAuthenticatedUser, requireAuth, canEditArrangement } from "./permissions";

// R2 Free Tier Constants
const FREE_TIER_STORAGE_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB
const WARNING_THRESHOLD_BYTES = 8 * 1024 * 1024 * 1024; // 8 GB (80% of free tier)

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

// ============ ARRANGEMENT AUDIO MUTATIONS ============

/**
 * Save audio file key to arrangement after successful upload
 * Deletes old audio file if one exists
 * Access: Arrangement owner or collaborators
 */
export const saveArrangementAudio = mutation({
  args: {
    arrangementId: v.id("arrangements"),
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Check edit permission
    const hasPermission = await canEditArrangement(ctx, args.arrangementId, userId);
    if (!hasPermission) {
      throw new Error("You don't have permission to edit this arrangement");
    }

    const arrangement = await ctx.db.get(args.arrangementId);
    if (!arrangement) {
      throw new Error("Arrangement not found");
    }

    // Delete old audio from R2 if exists
    if (arrangement.audioFileKey) {
      try {
        await r2.deleteObject(ctx, arrangement.audioFileKey);
      } catch {
        console.warn("Failed to delete old audio:", arrangement.audioFileKey);
      }
    }

    // Save new audio key to arrangement
    await ctx.db.patch(args.arrangementId, {
      audioFileKey: args.key,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Remove audio file from arrangement
 * Access: Arrangement owner or collaborators
 */
export const removeArrangementAudio = mutation({
  args: { arrangementId: v.id("arrangements") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Check edit permission
    const hasPermission = await canEditArrangement(ctx, args.arrangementId, userId);
    if (!hasPermission) {
      throw new Error("You don't have permission to edit this arrangement");
    }

    const arrangement = await ctx.db.get(args.arrangementId);
    if (!arrangement?.audioFileKey) {
      return { success: true };
    }

    // Delete from R2
    try {
      await r2.deleteObject(ctx, arrangement.audioFileKey);
    } catch {
      console.warn("Failed to delete audio from R2:", arrangement.audioFileKey);
    }

    // Clear audio key from arrangement
    await ctx.db.patch(args.arrangementId, {
      audioFileKey: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ============ ARRANGEMENT AUDIO QUERIES ============

/**
 * Get a signed URL for arrangement audio
 * Returns null if arrangement has no audio
 * Access: Everyone
 */
export const getArrangementAudioUrl = query({
  args: { arrangementId: v.id("arrangements") },
  handler: async (ctx, args) => {
    const arrangement = await ctx.db.get(args.arrangementId);
    if (!arrangement?.audioFileKey) {
      return null;
    }

    // Generate signed URL valid for 24 hours
    return await r2.getUrl(arrangement.audioFileKey, {
      expiresIn: 60 * 60 * 24,
    });
  },
});

// ============ STORAGE MONITORING ============

/**
 * Get R2 storage statistics for monitoring
 * Access: Authenticated users only (for admin dashboard)
 */
export const getStorageStats = query({
  args: {},
  handler: async (ctx) => {
    // Collect all metadata with pagination
    let allMetadata: Array<{ key: string; size?: number }> = [];
    let cursor: string | undefined = undefined;
    let hasMore = true;

    while (hasMore) {
      const result = await r2.listMetadata(ctx, 1000, cursor);
      allMetadata = allMetadata.concat(result.page);
      hasMore = !result.isDone;
      cursor = result.continueCursor;
    }

    // Calculate total storage
    const totalBytes = allMetadata.reduce((sum, m) => sum + (m.size ?? 0), 0);
    const totalMB = totalBytes / (1024 * 1024);
    const totalGB = totalBytes / (1024 * 1024 * 1024);

    return {
      totalBytes,
      totalMB: Math.round(totalMB * 100) / 100,
      totalGB: Math.round(totalGB * 100) / 100,
      fileCount: allMetadata.length,
      freeTierGB: FREE_TIER_STORAGE_BYTES / (1024 * 1024 * 1024),
      usagePercent: Math.round((totalBytes / FREE_TIER_STORAGE_BYTES) * 100),
      isWarning: totalBytes > WARNING_THRESHOLD_BYTES,
      isOverLimit: totalBytes > FREE_TIER_STORAGE_BYTES,
    };
  },
});

// ============ ORPHAN FILE CLEANUP ============

/**
 * Find and delete orphaned R2 files not linked to any database record
 * Called by monthly cron job
 * Access: Internal only
 */
export const cleanupOrphanedFiles = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. Get all R2 object keys with pagination
    const allR2Keys = new Set<string>();
    let cursor: string | undefined = undefined;
    let hasMore = true;

    while (hasMore) {
      const result = await r2.listMetadata(ctx, 1000, cursor);
      for (const item of result.page) {
        allR2Keys.add(item.key);
      }
      hasMore = !result.isDone;
      cursor = result.continueCursor;
    }

    if (allR2Keys.size === 0) {
      console.log("[R2 Cleanup] No files in R2 bucket");
      return { orphanedCount: 0, deletedCount: 0, errors: 0 };
    }

    // 2. Collect all referenced keys from database
    const referencedKeys = new Set<string>();

    // User avatars
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      if (user.avatarKey) {
        referencedKeys.add(user.avatarKey);
      }
    }

    // Group avatars
    const groups = await ctx.db.query("groups").collect();
    for (const group of groups) {
      if (group.avatarKey) {
        referencedKeys.add(group.avatarKey);
      }
    }

    // Arrangement audio files
    const arrangements = await ctx.db.query("arrangements").collect();
    for (const arrangement of arrangements) {
      if (arrangement.audioFileKey) {
        referencedKeys.add(arrangement.audioFileKey);
      }
    }

    // 3. Find orphaned keys (in R2 but not in database)
    const orphanedKeys: string[] = [];
    for (const key of allR2Keys) {
      if (!referencedKeys.has(key)) {
        orphanedKeys.push(key);
      }
    }

    if (orphanedKeys.length === 0) {
      console.log("[R2 Cleanup] No orphaned files found");
      return { orphanedCount: 0, deletedCount: 0, errors: 0 };
    }

    console.log(`[R2 Cleanup] Found ${orphanedKeys.length} orphaned files`);

    // 4. Delete orphaned files
    let deletedCount = 0;
    let errors = 0;

    for (const key of orphanedKeys) {
      try {
        await r2.deleteObject(ctx, key);
        deletedCount++;
        console.log(`[R2 Cleanup] Deleted orphaned file: ${key}`);
      } catch (error) {
        errors++;
        console.error(`[R2 Cleanup] Failed to delete ${key}:`, error);
      }
    }

    console.log(
      `[R2 Cleanup] Completed: ${deletedCount} deleted, ${errors} errors`
    );

    return {
      orphanedCount: orphanedKeys.length,
      deletedCount,
      errors,
    };
  },
});
