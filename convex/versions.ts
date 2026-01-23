import { v } from "convex/values";
import { query, mutation, internalMutation, QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
import {
  getPublicGroup,
  isGroupAdminOrOwner,
  requireAuth,
  formatUserInfo,
} from "./permissions";

// ============ HELPER FUNCTIONS ============

/**
 * Check if a user is a Public group admin/owner
 */
async function isPublicGroupModerator(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<boolean> {
  const publicGroup = await getPublicGroup(ctx);
  if (!publicGroup) return false;

  return await isGroupAdminOrOwner(ctx, publicGroup._id, userId);
}

/**
 * Check if content is owned by the Public group
 */
async function isPublicGroupOwned(
  ctx: QueryCtx | MutationCtx,
  contentType: "song" | "arrangement",
  contentId: string
): Promise<boolean> {
  const publicGroup = await getPublicGroup(ctx);
  if (!publicGroup) return false;

  if (contentType === "song") {
    const song = await ctx.db.get(contentId as Id<"songs">);
    return (
      song?.ownerType === "group" && song?.ownerId === publicGroup._id.toString()
    );
  } else {
    const arrangement = await ctx.db.get(contentId as Id<"arrangements">);
    return (
      arrangement?.ownerType === "group" &&
      arrangement?.ownerId === publicGroup._id.toString()
    );
  }
}

/**
 * Get the next version number for content
 */
async function getNextVersion(
  ctx: QueryCtx | MutationCtx,
  contentType: "song" | "arrangement",
  contentId: string
): Promise<number> {
  const versions = await ctx.db
    .query("contentVersions")
    .withIndex("by_content", (q) =>
      q.eq("contentType", contentType).eq("contentId", contentId)
    )
    .collect();
  return versions.reduce((max, v) => Math.max(max, v.version), 0) + 1;
}

/**
 * Check if content has actually changed since the last version.
 * Returns true if a new version should be created.
 * Exported for use in arrangements.ts and songs.ts
 */
export async function hasContentChanged(
  ctx: MutationCtx,
  contentType: "song" | "arrangement",
  contentId: string,
  newSnapshot: string
): Promise<boolean> {
  const versions = await ctx.db
    .query("contentVersions")
    .withIndex("by_content", (q) =>
      q.eq("contentType", contentType).eq("contentId", contentId)
    )
    .collect();

  // First version - always create
  if (versions.length === 0) return true;

  // Find the latest version
  const latest = versions.reduce(
    (max, v) => (v.version > max.version ? v : max),
    versions[0]
  );

  // Compare snapshots
  return latest.snapshot !== newSnapshot;
}

// ============ QUERIES ============

/**
 * Check if current user is a Public group moderator (admin/owner)
 * Used by frontend to conditionally show version history UI
 */
export const isCurrentUserPublicModerator = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    return await isPublicGroupModerator(ctx, userId);
  },
});

/**
 * Get version history for content (Public group admin/owner only)
 */
export const getHistory = query({
  args: {
    contentType: v.union(v.literal("song"), v.literal("arrangement")),
    contentId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Only Public group admins/owners can view version history
    const isModerator = await isPublicGroupModerator(ctx, userId);
    if (!isModerator) return [];

    // Only show history for Public-owned content
    const isPublicOwned = await isPublicGroupOwned(
      ctx,
      args.contentType,
      args.contentId
    );
    if (!isPublicOwned) return [];

    const versions = await ctx.db
      .query("contentVersions")
      .withIndex("by_content", (q) =>
        q.eq("contentType", args.contentType).eq("contentId", args.contentId)
      )
      .collect();

    // Sort by version descending (newest first)
    versions.sort((a, b) => b.version - a.version);

    const limited = args.limit ? versions.slice(0, args.limit) : versions;

    // Join with user data
    return Promise.all(
      limited.map(async (version) => {
        const user = await ctx.db.get(version.changedBy);
        return {
          ...version,
          changedByUser: formatUserInfo(user),
        };
      })
    );
  },
});

/**
 * Get a specific version (Public group admin/owner only)
 */
export const getVersion = query({
  args: {
    contentType: v.union(v.literal("song"), v.literal("arrangement")),
    contentId: v.string(),
    version: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Only Public group admins/owners can view versions
    const isModerator = await isPublicGroupModerator(ctx, userId);
    if (!isModerator) return null;

    // Only show for Public-owned content
    const isPublicOwned = await isPublicGroupOwned(
      ctx,
      args.contentType,
      args.contentId
    );
    if (!isPublicOwned) return null;

    const version = await ctx.db
      .query("contentVersions")
      .withIndex("by_content_and_version", (q) =>
        q
          .eq("contentType", args.contentType)
          .eq("contentId", args.contentId)
          .eq("version", args.version)
      )
      .unique();

    if (!version) return null;

    const user = await ctx.db.get(version.changedBy);
    return {
      ...version,
      changedByUser: formatUserInfo(user),
    };
  },
});

// ============ MUTATIONS ============

/**
 * Create a new version (internal - called automatically on save)
 */
export const createVersion = internalMutation({
  args: {
    contentType: v.union(v.literal("song"), v.literal("arrangement")),
    contentId: v.string(),
    snapshot: v.string(),
    changedBy: v.id("users"),
    changeDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const nextVersion = await getNextVersion(ctx, args.contentType, args.contentId);

    const versionId = await ctx.db.insert("contentVersions", {
      contentType: args.contentType,
      contentId: args.contentId,
      version: nextVersion,
      snapshot: args.snapshot,
      changedBy: args.changedBy,
      changedAt: Date.now(),
      changeDescription: args.changeDescription,
    });

    return versionId;
  },
});

/**
 * Rollback to a specific version (Public group admin/owner only)
 */
export const rollback = mutation({
  args: {
    contentType: v.union(v.literal("song"), v.literal("arrangement")),
    contentId: v.string(),
    version: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Only Public group admins/owners can rollback
    const isModerator = await isPublicGroupModerator(ctx, userId);
    if (!isModerator) {
      throw new Error("Only Public group moderators can rollback versions");
    }

    // Only for Public-owned content
    const isPublicOwned = await isPublicGroupOwned(
      ctx,
      args.contentType,
      args.contentId
    );
    if (!isPublicOwned) {
      throw new Error("Can only rollback Public group content");
    }

    // Get the target version
    const targetVersion = await ctx.db
      .query("contentVersions")
      .withIndex("by_content_and_version", (q) =>
        q
          .eq("contentType", args.contentType)
          .eq("contentId", args.contentId)
          .eq("version", args.version)
      )
      .unique();

    if (!targetVersion) {
      throw new Error("Version not found");
    }

    // Parse the snapshot
    const snapshot = JSON.parse(targetVersion.snapshot);

    // Apply the rollback based on content type
    if (args.contentType === "song") {
      const songId = args.contentId as Id<"songs">;
      const song = await ctx.db.get(songId);
      if (!song) throw new Error("Song not found");

      // Create a new version with current state before rollback
      const currentSnapshot = JSON.stringify({
        title: song.title,
        artist: song.artist,
        themes: song.themes,
        copyright: song.copyright,
        lyrics: song.lyrics,
      });

      await ctx.db.insert("contentVersions", {
        contentType: "song",
        contentId: args.contentId,
        version: await getNextVersion(ctx, "song", args.contentId),
        snapshot: currentSnapshot,
        changedBy: userId,
        changedAt: Date.now(),
        changeDescription: `Rollback preparation (before rollback to v${args.version})`,
      });

      // Apply rollback
      await ctx.db.patch(songId, {
        title: snapshot.title,
        artist: snapshot.artist,
        themes: snapshot.themes,
        copyright: snapshot.copyright,
        lyrics: snapshot.lyrics,
      });

      // Create version for the rollback
      await ctx.db.insert("contentVersions", {
        contentType: "song",
        contentId: args.contentId,
        version: await getNextVersion(ctx, "song", args.contentId),
        snapshot: targetVersion.snapshot,
        changedBy: userId,
        changedAt: Date.now(),
        changeDescription: `Rolled back to version ${args.version}`,
      });
    } else {
      const arrangementId = args.contentId as Id<"arrangements">;
      const arrangement = await ctx.db.get(arrangementId);
      if (!arrangement) throw new Error("Arrangement not found");

      // Create a new version with current state before rollback
      const currentSnapshot = JSON.stringify({
        name: arrangement.name,
        key: arrangement.key,
        tempo: arrangement.tempo,
        capo: arrangement.capo,
        timeSignature: arrangement.timeSignature,
        chordProContent: arrangement.chordProContent,
        tags: arrangement.tags,
      });

      await ctx.db.insert("contentVersions", {
        contentType: "arrangement",
        contentId: args.contentId,
        version: await getNextVersion(ctx, "arrangement", args.contentId),
        snapshot: currentSnapshot,
        changedBy: userId,
        changedAt: Date.now(),
        changeDescription: `Rollback preparation (before rollback to v${args.version})`,
      });

      // Apply rollback
      await ctx.db.patch(arrangementId, {
        name: snapshot.name,
        key: snapshot.key,
        tempo: snapshot.tempo,
        capo: snapshot.capo,
        timeSignature: snapshot.timeSignature,
        chordProContent: snapshot.chordProContent,
        tags: snapshot.tags,
        updatedAt: Date.now(),
      });

      // Create version for the rollback
      await ctx.db.insert("contentVersions", {
        contentType: "arrangement",
        contentId: args.contentId,
        version: await getNextVersion(ctx, "arrangement", args.contentId),
        snapshot: targetVersion.snapshot,
        changedBy: userId,
        changedAt: Date.now(),
        changeDescription: `Rolled back to version ${args.version}`,
      });
    }

    return { success: true };
  },
});
