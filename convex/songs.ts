import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  requireAuth,
  requireAuthenticatedUser,
  getContentOwnerInfo,
  canEditSong,
  isSongOwner,
  getCommunityGroup,
  filterUndefined,
  isGroupAdminOrOwner,
  isCommunityGroup,
} from "./permissions";
import { Id } from "./_generated/dataModel";
import { maybeCreateVersionSnapshot } from "./versions";

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

/**
 * Get song by URL slug WITH owner info for display
 * Access: Everyone
 */
export const getBySlugWithOwner = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const song = await ctx.db
      .query("songs")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!song) return null;

    const owner = await getContentOwnerInfo(ctx, song);

    return { ...song, owner };
  },
});

/**
 * Get count of all songs
 * Access: Everyone
 */
export const count = query({
  args: {},
  handler: async (ctx) => {
    const songs = await ctx.db.query("songs").collect();
    return songs.length;
  },
});

// ============ PERMISSION QUERIES ============

/**
 * Check if current user can edit a song
 * Returns { canEdit, isOwner, isOriginalCreator }
 *
 * - isOwner: true if user owns the song (or is group owner for group-owned songs)
 * - isOriginalCreator: true if user originally created the song (via createdBy)
 *   This is important for reclaim functionality - original creator can always reclaim
 */
export const canEdit = query({
  args: { songId: v.id("songs") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { canEdit: false, isOwner: false, isOriginalCreator: false };
    }

    const song = await ctx.db.get(args.songId);
    if (!song) {
      return { canEdit: false, isOwner: false, isOriginalCreator: false };
    }

    const isOwner = await isSongOwner(ctx, args.songId, userId);
    const isOriginalCreator = song.createdBy === userId;
    const canEditResult = await canEditSong(ctx, args.songId, userId);

    return {
      canEdit: canEditResult,
      isOwner,
      isOriginalCreator,
    };
  },
});

// ============ MUTATIONS ============

/**
 * Create a new song
 * Access: Authenticated users only (not anonymous)
 *
 * Phase 2: Supports group ownership
 * - If ownerType='group', verify user is owner/admin of that group
 * - Community group excluded (transfer only)
 */
export const create = mutation({
  args: {
    title: v.string(),
    artist: v.optional(v.string()),
    themes: v.array(v.string()),
    copyright: v.optional(v.string()),
    lyrics: v.optional(v.string()),
    slug: v.string(),
    // Phase 2: Group ownership
    ownerType: v.optional(v.union(v.literal("user"), v.literal("group"))),
    ownerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(ctx);

    // Check slug uniqueness
    const existing = await ctx.db
      .query("songs")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) {
      throw new Error("A song with this slug already exists");
    }

    // Phase 2: Validate group ownership
    let ownerType = args.ownerType;
    let ownerId = args.ownerId;

    if (ownerType === "group" && ownerId) {
      // Prevent creating content directly owned by the Community group
      const isCommunity = await isCommunityGroup(ctx, ownerId);
      if (isCommunity) {
        throw new Error(
          "Cannot create content directly owned by the Community group. Content must be transferred to Community."
        );
      }

      // Verify user is owner/admin of the group
      const groupId = ownerId as Id<"groups">;
      const canPostAsGroup = await isGroupAdminOrOwner(ctx, groupId, userId);
      if (!canPostAsGroup) {
        throw new Error(
          "You must be an owner or admin of the group to post on its behalf"
        );
      }
    } else {
      // Default to user ownership
      ownerType = undefined;
      ownerId = undefined;
    }

    const songId = await ctx.db.insert("songs", {
      title: args.title,
      artist: args.artist,
      themes: args.themes,
      copyright: args.copyright,
      lyrics: args.lyrics,
      slug: args.slug,
      createdBy: userId,
      ownerType,
      ownerId,
    });

    return songId;
  },
});

/**
 * Update a song
 * Access: Owner, or Community group members for Community-owned songs
 */
export const update = mutation({
  args: {
    id: v.id("songs"),
    title: v.optional(v.string()),
    artist: v.optional(v.string()),
    themes: v.optional(v.array(v.string())),
    copyright: v.optional(v.string()),
    lyrics: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const song = await ctx.db.get(args.id);
    if (!song) {
      throw new Error("Song not found");
    }

    // Permission check
    const canEdit = await canEditSong(ctx, args.id, userId);
    if (!canEdit) {
      throw new Error("You don't have permission to edit this song");
    }

    // Create version snapshot for Community-owned songs (if changed)
    await maybeCreateVersionSnapshot(ctx, "song", { ...song, _id: args.id }, userId);

    // Patch song with updated timestamp
    const { id: _id, ...updates } = args;
    const cleanUpdates = {
      ...filterUndefined(updates),
      updatedAt: Date.now(),
    };
    await ctx.db.patch(args.id, cleanUpdates);

    return args.id;
  },
});

/**
 * Transfer a song to the Community group (crowdsourced)
 * Access: Original creator only
 *
 * This allows anyone to donate their song to Community for community editing,
 * even if they're not a member of the Community group.
 * The original creator retains edit rights via createdBy.
 */
export const transferToCommunity = mutation({
  args: { id: v.id("songs") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const song = await ctx.db.get(args.id);
    if (!song) {
      throw new Error("Song not found");
    }

    // Only original creator can transfer
    if (song.createdBy !== userId) {
      throw new Error("Only the original creator can transfer this song");
    }

    // Check if already community-owned
    const communityGroup = await getCommunityGroup(ctx);
    if (!communityGroup) {
      throw new Error("Community group not found");
    }

    if (
      song.ownerType === "group" &&
      song.ownerId === communityGroup._id.toString()
    ) {
      throw new Error("Song is already owned by Community");
    }

    // Create initial version snapshot before transferring
    const snapshot = JSON.stringify({
      title: song.title,
      artist: song.artist,
      themes: song.themes,
      copyright: song.copyright,
      lyrics: song.lyrics,
    });

    await ctx.runMutation(internal.versions.createVersion, {
      contentType: "song",
      contentId: args.id.toString(),
      snapshot,
      changedBy: userId,
      changeDescription: "Original version (before community transfer)",
    });

    // Transfer to Community
    await ctx.db.patch(args.id, {
      ownerType: "group",
      ownerId: communityGroup._id.toString(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Reclaim a song from the Community group back to personal ownership
 * Access: Original creator only
 *
 * Allows the person who originally created and transferred the song
 * to take it back under their personal ownership.
 */
export const reclaimFromCommunity = mutation({
  args: { id: v.id("songs") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const song = await ctx.db.get(args.id);
    if (!song) {
      throw new Error("Song not found");
    }

    // Only original creator can reclaim
    if (song.createdBy !== userId) {
      throw new Error("Only the original creator can reclaim this song");
    }

    // Check if currently community-owned
    const communityGroup = await getCommunityGroup(ctx);
    if (
      !communityGroup ||
      song.ownerType !== "group" ||
      song.ownerId !== communityGroup._id.toString()
    ) {
      throw new Error("Song is not currently owned by Community");
    }

    // Reclaim to personal ownership
    await ctx.db.patch(args.id, {
      ownerType: undefined,
      ownerId: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
