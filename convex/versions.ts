import { v } from "convex/values";
import { query, mutation, internalMutation, QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
import {
  getCommunityGroup,
  isGroupAdminOrOwner,
  requireAuth,
  formatUserInfo,
} from "./permissions";

// ============ HELPER FUNCTIONS ============

/**
 * Check if a user is a Community group admin/owner
 */
async function isCommunityGroupModerator(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<boolean> {
  const communityGroup = await getCommunityGroup(ctx);
  if (!communityGroup) return false;

  return await isGroupAdminOrOwner(ctx, communityGroup._id, userId);
}

/**
 * Check if content is owned by the Community group
 */
async function isCommunityGroupOwned(
  ctx: QueryCtx | MutationCtx,
  contentType: "song" | "arrangement",
  contentId: string
): Promise<boolean> {
  const communityGroup = await getCommunityGroup(ctx);
  if (!communityGroup) return false;

  if (contentType === "song") {
    const song = await ctx.db.get(contentId as Id<"songs">);
    return (
      song?.ownerType === "group" && song?.ownerId === communityGroup._id.toString()
    );
  } else {
    const arrangement = await ctx.db.get(contentId as Id<"arrangements">);
    return (
      arrangement?.ownerType === "group" &&
      arrangement?.ownerId === communityGroup._id.toString()
    );
  }
}

/**
 * Check if user is the original creator of the content
 */
async function isOriginalCreator(
  ctx: QueryCtx | MutationCtx,
  contentType: "song" | "arrangement",
  contentId: string,
  userId: Id<"users">
): Promise<boolean> {
  if (contentType === "song") {
    const song = await ctx.db.get(contentId as Id<"songs">);
    return song?.createdBy === userId;
  } else {
    const arrangement = await ctx.db.get(contentId as Id<"arrangements">);
    return arrangement?.createdBy === userId;
  }
}

/**
 * Check if user can access version history for content
 * (either Community group moderator OR original creator)
 */
async function canAccessVersionHistory(
  ctx: QueryCtx | MutationCtx,
  contentType: "song" | "arrangement",
  contentId: string,
  userId: Id<"users">
): Promise<boolean> {
  // Community group moderators can access all community content
  const isModerator = await isCommunityGroupModerator(ctx, userId);
  if (isModerator) return true;

  // Original creators can access their own content's version history
  const isCreator = await isOriginalCreator(ctx, contentType, contentId, userId);
  return isCreator;
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
 * Create a version snapshot for Community-owned content if it has changed.
 * This is the centralized helper for version creation in update mutations.
 *
 * @param ctx - Mutation context
 * @param contentType - "song" or "arrangement"
 * @param content - The current content object (before update)
 * @param userId - The user making the change
 */
export async function maybeCreateVersionSnapshot(
  ctx: MutationCtx,
  contentType: "song" | "arrangement",
  content: {
    _id: string;
    ownerType?: "user" | "group";
    ownerId?: string;
    // Song fields
    title?: string;
    artist?: string;
    themes?: string[];
    copyright?: string;
    lyrics?: string;
    // Arrangement fields
    name?: string;
    key?: string;
    tempo?: number;
    capo?: number;
    timeSignature?: string;
    chordProContent?: string;
    tags?: string[];
  },
  userId: Id<"users">
): Promise<void> {
  // Check if Community-owned
  const isCommunity = await isCommunityGroupOwned(ctx, contentType, content._id);
  if (!isCommunity) return;

  // Create snapshot based on content type
  const snapshot =
    contentType === "song"
      ? JSON.stringify({
          title: content.title,
          artist: content.artist,
          themes: content.themes,
          copyright: content.copyright,
          lyrics: content.lyrics,
        })
      : JSON.stringify({
          name: content.name,
          key: content.key,
          tempo: content.tempo,
          capo: content.capo,
          timeSignature: content.timeSignature,
          chordProContent: content.chordProContent,
          tags: content.tags,
        });

  // Only create version if content changed
  const changed = await hasContentChanged(ctx, contentType, content._id, snapshot);
  if (changed) {
    await ctx.db.insert("contentVersions", {
      contentType,
      contentId: content._id,
      version: await getNextVersion(ctx, contentType, content._id),
      snapshot,
      changedBy: userId,
      changedAt: Date.now(),
    });
  }
}

/**
 * Check if content has actually changed since the last version.
 * Returns true if a new version should be created.
 */
async function hasContentChanged(
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
 * Check if current user is a Community group moderator (admin/owner)
 * Used by frontend to conditionally show version history UI
 */
export const isCurrentUserCommunityModerator = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    return await isCommunityGroupModerator(ctx, userId);
  },
});

/**
 * Check if current user can access version history for specific content
 * Returns true if user is Community group moderator OR original content creator
 * Used by frontend to conditionally show version history UI
 */
export const canCurrentUserAccessVersionHistory = query({
  args: {
    contentType: v.union(v.literal("song"), v.literal("arrangement")),
    contentId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    // Must be community-owned content
    const isCommunityOwned = await isCommunityGroupOwned(
      ctx,
      args.contentType,
      args.contentId
    );
    if (!isCommunityOwned) return false;

    return await canAccessVersionHistory(ctx, args.contentType, args.contentId, userId);
  },
});

/**
 * Get version history for content
 * Access: Community group moderators OR original content creator
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

    // Only show history for Community-owned content
    const isCommunityOwned = await isCommunityGroupOwned(
      ctx,
      args.contentType,
      args.contentId
    );
    if (!isCommunityOwned) return [];

    // Check if user can access version history (moderator or original creator)
    const canAccess = await canAccessVersionHistory(
      ctx,
      args.contentType,
      args.contentId,
      userId
    );
    if (!canAccess) return [];

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
 * Get a specific version
 * Access: Community group moderators OR original content creator
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

    // Only show for Community-owned content
    const isCommunityOwned = await isCommunityGroupOwned(
      ctx,
      args.contentType,
      args.contentId
    );
    if (!isCommunityOwned) return null;

    // Check if user can access version history (moderator or original creator)
    const canAccess = await canAccessVersionHistory(
      ctx,
      args.contentType,
      args.contentId,
      userId
    );
    if (!canAccess) return null;

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
 * Rollback to a specific version
 * Access: Community group moderators OR original content creator
 */
export const rollback = mutation({
  args: {
    contentType: v.union(v.literal("song"), v.literal("arrangement")),
    contentId: v.string(),
    version: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Only for Community-owned content
    const isCommunityOwned = await isCommunityGroupOwned(
      ctx,
      args.contentType,
      args.contentId
    );
    if (!isCommunityOwned) {
      throw new Error("Can only rollback Community group content");
    }

    // Check if user can access version history (moderator or original creator)
    const canAccess = await canAccessVersionHistory(
      ctx,
      args.contentType,
      args.contentId,
      userId
    );
    if (!canAccess) {
      throw new Error("Only Community group moderators or original creators can rollback versions");
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
