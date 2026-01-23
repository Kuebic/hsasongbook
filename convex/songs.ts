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
  getPublicGroup,
  filterUndefined,
} from "./permissions";
import { hasContentChanged } from "./versions";

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
 * Returns { canEdit, isOwner }
 */
export const canEdit = query({
  args: { songId: v.id("songs") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { canEdit: false, isOwner: false };
    }

    const song = await ctx.db.get(args.songId);
    if (!song) {
      return { canEdit: false, isOwner: false };
    }

    const isOwner = await isSongOwner(ctx, args.songId, userId);
    const canEditResult = await canEditSong(ctx, args.songId, userId);

    return {
      canEdit: canEditResult,
      isOwner,
    };
  },
});

// ============ MUTATIONS ============

/**
 * Create a new song
 * Access: Authenticated users only (not anonymous)
 */
export const create = mutation({
  args: {
    title: v.string(),
    artist: v.optional(v.string()),
    themes: v.array(v.string()),
    copyright: v.optional(v.string()),
    lyrics: v.optional(v.string()),
    slug: v.string(),
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

    const songId = await ctx.db.insert("songs", {
      ...args,
      createdBy: userId,
    });

    return songId;
  },
});

/**
 * Update a song
 * Access: Owner, or Public group members for Public-owned songs
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

    // Smart version creation for Public-owned songs (only if changed)
    const publicGroup = await getPublicGroup(ctx);
    const isPublicOwned =
      song.ownerType === "group" &&
      song.ownerId === publicGroup?._id.toString();

    if (isPublicOwned) {
      // Create snapshot of current state before update
      const snapshot = JSON.stringify({
        title: song.title,
        artist: song.artist,
        themes: song.themes,
        copyright: song.copyright,
        lyrics: song.lyrics,
      });

      // Only create version if content actually changed
      const hasChanged = await hasContentChanged(ctx, "song", args.id, snapshot);
      if (hasChanged) {
        await ctx.runMutation(internal.versions.createVersion, {
          contentType: "song",
          contentId: args.id,
          snapshot,
          changedBy: userId,
        });
      }
    }

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
