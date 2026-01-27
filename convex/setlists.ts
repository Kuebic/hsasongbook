import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  filterUndefined,
  requireAuth,
  requireAuthenticatedUser,
  canViewSetlist,
  canEditSetlist,
} from "./permissions";

// ============ QUERIES ============

/**
 * Get user's setlists
 * Access: Owner only (returns empty for unauthenticated)
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("setlists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/**
 * Get single setlist by ID
 * Access: Based on privacyLevel and sharing
 */
export const get = query({
  args: { id: v.id("setlists") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const setlist = await ctx.db.get(args.id);

    if (!setlist) return null;

    // Check view permission
    const canView = await canViewSetlist(ctx, args.id, userId);
    if (!canView) return null;

    return setlist;
  },
});

/**
 * Get setlist with full arrangement and song data
 * Access: Based on privacyLevel and sharing
 */
export const getWithArrangements = query({
  args: { id: v.id("setlists") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const setlist = await ctx.db.get(args.id);

    if (!setlist) return null;

    // Check view permission
    const canView = await canViewSetlist(ctx, args.id, userId);
    if (!canView) return null;

    // Get songs array (prefer new format, fallback to legacy arrangementIds)
    const songsData =
      setlist.songs ??
      setlist.arrangementIds?.map((id) => ({ arrangementId: id })) ??
      [];

    // Load arrangements with their songs
    const arrangements = await Promise.all(
      songsData.map(async (songEntry) => {
        const arr = await ctx.db.get(songEntry.arrangementId);
        if (!arr) return null;

        // Load parent song
        const song = await ctx.db.get(arr.songId);

        return {
          ...arr,
          song: song
            ? {
                _id: song._id,
                slug: song.slug,
                title: song.title,
                artist: song.artist,
              }
            : null,
        };
      })
    );

    return {
      ...setlist,
      // Return songs array with customKey for frontend
      songs: songsData,
      arrangements: arrangements.filter((a) => a !== null),
    };
  },
});

// ============ MUTATIONS ============

/**
 * Create a new setlist
 * Access: Authenticated users only (not anonymous)
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    performanceDate: v.optional(v.string()),
    // Legacy field - prefer songs
    arrangementIds: v.optional(v.array(v.id("arrangements"))),
    // New field with per-song metadata
    songs: v.optional(
      v.array(
        v.object({
          arrangementId: v.id("arrangements"),
          customKey: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(ctx);

    // Prefer songs array, fallback to arrangementIds for backwards compat
    const songs =
      args.songs ??
      args.arrangementIds?.map((id) => ({ arrangementId: id })) ??
      [];

    const setlistId = await ctx.db.insert("setlists", {
      name: args.name,
      description: args.description,
      performanceDate: args.performanceDate,
      songs,
      userId,
      privacyLevel: "private",
      favorites: 0,
      showAttribution: false,
      createdAt: Date.now(),
    });

    return setlistId;
  },
});

/**
 * Update a setlist
 * Access: Owner or shared with edit permission
 */
export const update = mutation({
  args: {
    id: v.id("setlists"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    performanceDate: v.optional(v.string()),
    // Legacy field - prefer songs
    arrangementIds: v.optional(v.array(v.id("arrangements"))),
    // New field with per-song metadata
    songs: v.optional(
      v.array(
        v.object({
          arrangementId: v.id("arrangements"),
          customKey: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const setlist = await ctx.db.get(args.id);
    if (!setlist) {
      throw new Error("Setlist not found");
    }

    // Check edit permission
    const canEdit = await canEditSetlist(ctx, args.id, userId);
    if (!canEdit) {
      throw new Error("You don't have permission to edit this setlist");
    }

    const { id: _id, arrangementIds, ...updates } = args;

    // If arrangementIds provided (legacy), convert to songs format
    const songsUpdate = args.songs ?? (arrangementIds
      ? arrangementIds.map((id) => ({ arrangementId: id }))
      : undefined);

    // Filter out undefined values and add timestamp
    const cleanUpdates = {
      ...filterUndefined(updates),
      ...(songsUpdate !== undefined && { songs: songsUpdate }),
      updatedAt: Date.now(),
    };

    await ctx.db.patch(args.id, cleanUpdates);

    return args.id;
  },
});

/**
 * Delete a setlist
 * Access: Owner only
 */
export const remove = mutation({
  args: { id: v.id("setlists") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const setlist = await ctx.db.get(args.id);
    if (!setlist) {
      throw new Error("Setlist not found");
    }

    // Check ownership
    if (setlist.userId !== userId) {
      throw new Error("You can only delete your own setlists");
    }

    await ctx.db.delete(args.id);
  },
});

/**
 * Add an arrangement to a setlist
 * Access: Owner or shared with edit permission
 */
export const addArrangement = mutation({
  args: {
    setlistId: v.id("setlists"),
    arrangementId: v.id("arrangements"),
    customKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const setlist = await ctx.db.get(args.setlistId);
    if (!setlist) {
      throw new Error("Setlist not found");
    }

    // Check edit permission
    const canEdit = await canEditSetlist(ctx, args.setlistId, userId);
    if (!canEdit) {
      throw new Error("You don't have permission to edit this setlist");
    }

    // Check if arrangement exists
    const arrangement = await ctx.db.get(args.arrangementId);
    if (!arrangement) {
      throw new Error("Arrangement not found");
    }

    // Get current songs (prefer new format, fallback to legacy)
    const currentSongs =
      setlist.songs ??
      setlist.arrangementIds?.map((id) => ({ arrangementId: id })) ??
      [];

    // If already in setlist, just return (idempotent operation)
    if (currentSongs.some((s) => s.arrangementId === args.arrangementId)) {
      return args.setlistId;
    }

    // Add to end of setlist with optional customKey
    const newSong: { arrangementId: typeof args.arrangementId; customKey?: string } = {
      arrangementId: args.arrangementId,
    };
    if (args.customKey) {
      newSong.customKey = args.customKey;
    }

    await ctx.db.patch(args.setlistId, {
      songs: [...currentSongs, newSong],
      updatedAt: Date.now(),
    });

    return args.setlistId;
  },
});

/**
 * Update the custom key for a song in a setlist
 * Access: Owner or shared with edit permission
 */
export const updateSongKey = mutation({
  args: {
    setlistId: v.id("setlists"),
    arrangementId: v.id("arrangements"),
    customKey: v.optional(v.string()), // undefined = reset to arrangement default
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const setlist = await ctx.db.get(args.setlistId);
    if (!setlist) {
      throw new Error("Setlist not found");
    }

    // Check edit permission
    const canEdit = await canEditSetlist(ctx, args.setlistId, userId);
    if (!canEdit) {
      throw new Error("You don't have permission to edit this setlist");
    }

    // Get current songs (prefer new format, fallback to legacy)
    const currentSongs =
      setlist.songs ??
      setlist.arrangementIds?.map((id) => ({ arrangementId: id })) ??
      [];

    // Find and update the matching song's customKey
    const songIndex = currentSongs.findIndex(
      (s) => s.arrangementId === args.arrangementId
    );

    if (songIndex === -1) {
      throw new Error("Arrangement not found in setlist");
    }

    // Update the song with new customKey
    const updatedSongs = currentSongs.map((song, index) => {
      if (index === songIndex) {
        if (args.customKey) {
          return { ...song, customKey: args.customKey };
        }
        // Remove customKey if not provided (reset to default)
        const { customKey: _, ...rest } = song;
        return rest;
      }
      return song;
    });

    await ctx.db.patch(args.setlistId, {
      songs: updatedSongs,
      updatedAt: Date.now(),
    });

    return args.setlistId;
  },
});
