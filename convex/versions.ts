import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// ============ HELPER FUNCTIONS ============

/**
 * Check if a user is a Public group admin/owner
 */
async function isPublicGroupModerator(
  ctx: { db: any },
  userId: Id<"users">
): Promise<boolean> {
  // Find the Public system group
  const groups = await ctx.db.query("groups").collect();
  const publicGroup = groups.find((g: any) => g.isSystemGroup);

  if (!publicGroup) return false;

  const membership = await ctx.db
    .query("groupMembers")
    .withIndex("by_group_and_user", (q: any) =>
      q.eq("groupId", publicGroup._id).eq("userId", userId)
    )
    .unique();

  return (
    membership !== null &&
    (membership.role === "owner" || membership.role === "admin")
  );
}

/**
 * Check if content is owned by the Public group
 */
async function isPublicGroupOwned(
  ctx: { db: any },
  contentType: "song" | "arrangement",
  contentId: string
): Promise<boolean> {
  // Find the Public system group
  const groups = await ctx.db.query("groups").collect();
  const publicGroup = groups.find((g: any) => g.isSystemGroup);

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

// ============ QUERIES ============

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
          changedByUser: user
            ? {
                _id: user._id,
                username: user.username,
                displayName: user.displayName,
                showRealName: user.showRealName,
                avatarKey: user.avatarKey,
              }
            : null,
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
      changedByUser: user
        ? {
            _id: user._id,
            username: user.username,
            displayName: user.displayName,
            showRealName: user.showRealName,
            avatarKey: user.avatarKey,
          }
        : null,
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
    // Get the current highest version number
    const existingVersions = await ctx.db
      .query("contentVersions")
      .withIndex("by_content", (q) =>
        q.eq("contentType", args.contentType).eq("contentId", args.contentId)
      )
      .collect();

    const maxVersion = existingVersions.reduce(
      (max, v) => Math.max(max, v.version),
      0
    );

    const versionId = await ctx.db.insert("contentVersions", {
      contentType: args.contentType,
      contentId: args.contentId,
      version: maxVersion + 1,
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
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

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
        version:
          (await ctx.db
            .query("contentVersions")
            .withIndex("by_content", (q) =>
              q.eq("contentType", "song").eq("contentId", args.contentId)
            )
            .collect()
            .then((v) => v.reduce((max, ver) => Math.max(max, ver.version), 0))) +
          1,
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
        version:
          (await ctx.db
            .query("contentVersions")
            .withIndex("by_content", (q) =>
              q.eq("contentType", "song").eq("contentId", args.contentId)
            )
            .collect()
            .then((v) => v.reduce((max, ver) => Math.max(max, ver.version), 0))) +
          1,
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
        version:
          (await ctx.db
            .query("contentVersions")
            .withIndex("by_content", (q) =>
              q
                .eq("contentType", "arrangement")
                .eq("contentId", args.contentId)
            )
            .collect()
            .then((v) => v.reduce((max, ver) => Math.max(max, ver.version), 0))) +
          1,
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
        version:
          (await ctx.db
            .query("contentVersions")
            .withIndex("by_content", (q) =>
              q
                .eq("contentType", "arrangement")
                .eq("contentId", args.contentId)
            )
            .collect()
            .then((v) => v.reduce((max, ver) => Math.max(max, ver.version), 0))) +
          1,
        snapshot: targetVersion.snapshot,
        changedBy: userId,
        changedAt: Date.now(),
        changeDescription: `Rolled back to version ${args.version}`,
      });
    }

    return { success: true };
  },
});
