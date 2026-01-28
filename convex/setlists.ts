import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  filterUndefined,
  normalizeSetlistSongs,
  requireAuth,
  requireAuthenticatedUser,
  canViewSetlist,
  canEditSetlist,
  canChangeSetlistPrivacy,
} from "./permissions";

// ============ QUERIES ============

/**
 * Get user's setlists (owned and shared with user)
 * Access: Owner only (returns empty for unauthenticated)
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get setlists owned by user (efficient - uses index)
    const ownedSetlists = await ctx.db
      .query("setlists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get setlists shared WITH user (efficient - uses setlistShares index)
    const shares = await ctx.db
      .query("setlistShares")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Fetch the shared setlists by ID
    const sharedSetlists = await Promise.all(
      shares.map((share) => ctx.db.get(share.setlistId))
    );

    // Filter out any null results (deleted setlists) and combine
    const validSharedSetlists = sharedSetlists.filter(
      (s): s is NonNullable<typeof s> => s !== null
    );

    return [...ownedSetlists, ...validSharedSetlists].sort(
      (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)
    );
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
    const songsData = normalizeSetlistSongs(setlist);

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
      // Keep nulls in array - frontend shows placeholder for unavailable arrangements
      arrangements,
    };
  },
});

/**
 * Get sharing info for a setlist (who has access, what permissions)
 * Access: Anyone who can view the setlist
 */
export const getSharingInfo = query({
  args: { setlistId: v.id("setlists") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const setlist = await ctx.db.get(args.setlistId);
    if (!setlist) return null;

    const isOwner = setlist.userId === userId;
    const canView = await canViewSetlist(ctx, args.setlistId, userId);

    if (!canView) return null;

    // Get user details for shared users (if owner or has edit access)
    const canEdit = await canEditSetlist(ctx, args.setlistId, userId);
    const sharedUsers: {
      userId: typeof userId;
      username: string | undefined;
      displayName: string | undefined;
      canEdit: boolean;
      addedAt: number;
    }[] = [];

    if (isOwner || canEdit) {
      // Show full collaborator list from setlistShares table
      const shares = await ctx.db
        .query("setlistShares")
        .withIndex("by_setlist", (q) => q.eq("setlistId", args.setlistId))
        .collect();

      for (const share of shares) {
        const user = await ctx.db.get(share.userId);
        if (user) {
          sharedUsers.push({
            userId: share.userId,
            username: user.username,
            displayName: user.displayName,
            canEdit: share.canEdit,
            addedAt: share.addedAt,
          });
        }
      }
    }

    return {
      isOwner,
      canEdit,
      canChangePrivacy: isOwner,
      privacyLevel: setlist.privacyLevel ?? "private", // Default to private
      sharedUsers: isOwner || canEdit ? sharedUsers : [], // Only show if owner or editor
      ownerInfo: isOwner
        ? null
        : {
            userId: setlist.userId,
          },
    };
  },
});

// ============ BROWSE & DISCOVERY QUERIES ============

/**
 * Browse public setlists with filtering and sorting
 * Access: Anyone (public setlists only)
 */
export const browse = query({
  args: {
    searchTerm: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    minDuration: v.optional(v.number()),
    maxDuration: v.optional(v.number()),
    minSongs: v.optional(v.number()),
    maxSongs: v.optional(v.number()),
    sortBy: v.optional(
      v.union(
        v.literal("popular"), // By favorites
        v.literal("recent"), // By updatedAt
        v.literal("name") // Alphabetical
      )
    ),
  },
  handler: async (ctx, args) => {
    // Get all public setlists using index
    let setlists = await ctx.db
      .query("setlists")
      .withIndex("by_privacy", (q) => q.eq("privacyLevel", "public"))
      .collect();

    // Filter by search term (name or description)
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      setlists = setlists.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.description?.toLowerCase().includes(term)
      );
    }

    // Filter by tags
    if (args.tags && args.tags.length > 0) {
      setlists = setlists.filter((s) =>
        args.tags!.some((tag) => s.tags?.includes(tag))
      );
    }

    // Filter by duration
    if (args.minDuration !== undefined) {
      setlists = setlists.filter(
        (s) => (s.estimatedDuration ?? 0) >= args.minDuration!
      );
    }
    if (args.maxDuration !== undefined) {
      setlists = setlists.filter(
        (s) => (s.estimatedDuration ?? Infinity) <= args.maxDuration!
      );
    }

    // Filter by song count
    if (args.minSongs !== undefined || args.maxSongs !== undefined) {
      setlists = setlists.filter((s) => {
        const songCount = s.songs?.length ?? 0;
        if (args.minSongs !== undefined && songCount < args.minSongs)
          return false;
        if (args.maxSongs !== undefined && songCount > args.maxSongs)
          return false;
        return true;
      });
    }

    // Sort
    const sortBy = args.sortBy ?? "popular";
    if (sortBy === "popular") {
      setlists.sort((a, b) => (b.favorites ?? 0) - (a.favorites ?? 0));
    } else if (sortBy === "recent") {
      setlists.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    } else {
      setlists.sort((a, b) => a.name.localeCompare(b.name));
    }

    return setlists;
  },
});

/**
 * Get public setlists by a specific creator (for user profiles)
 * Access: Anyone (public setlists only)
 */
export const getByCreator = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const setlists = await ctx.db
      .query("setlists")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Only return public setlists
    return setlists
      .filter((s) => s.privacyLevel === "public")
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  },
});

/**
 * Get distinct tags from all public setlists (for filter UI)
 * Access: Anyone
 */
export const getDistinctTags = query({
  args: {},
  handler: async (ctx) => {
    const setlists = await ctx.db
      .query("setlists")
      .withIndex("by_privacy", (q) => q.eq("privacyLevel", "public"))
      .collect();

    const tagSet = new Set<string>();
    setlists.forEach((s) => {
      s.tags?.forEach((tag) => tagSet.add(tag));
    });

    return Array.from(tagSet).sort();
  },
});

/**
 * Get browse statistics (for UI display)
 * Access: Anyone
 */
export const getBrowseStats = query({
  args: {},
  handler: async (ctx) => {
    const publicSetlists = await ctx.db
      .query("setlists")
      .withIndex("by_privacy", (q) => q.eq("privacyLevel", "public"))
      .collect();

    const totalSongs = publicSetlists.reduce((sum, s) => {
      return sum + (s.songs?.length ?? 0);
    }, 0);

    const totalFavorites = publicSetlists.reduce((sum, s) => {
      return sum + (s.favorites ?? 0);
    }, 0);

    return {
      totalPublicSetlists: publicSetlists.length,
      totalSongs,
      totalFavorites,
      averageSongsPerSetlist:
        publicSetlists.length > 0
          ? Math.round(totalSongs / publicSetlists.length)
          : 0,
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
    const songs = normalizeSetlistSongs(args);

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
 * Update setlist metadata (tags, duration, difficulty)
 * Access: Owner or shared with edit permission
 */
export const updateMetadata = mutation({
  args: {
    setlistId: v.id("setlists"),
    tags: v.optional(v.array(v.string())),
    estimatedDuration: v.optional(v.number()),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(ctx);

    const canEdit = await canEditSetlist(ctx, args.setlistId, userId);
    if (!canEdit) {
      throw new Error("You don't have permission to edit this setlist");
    }

    await ctx.db.patch(args.setlistId, {
      tags: args.tags,
      estimatedDuration: args.estimatedDuration,
      difficulty: args.difficulty,
      updatedAt: Date.now(),
    });
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
    const currentSongs = normalizeSetlistSongs(setlist);

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
    const currentSongs = normalizeSetlistSongs(setlist);

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

// ============ SHARING MUTATIONS ============

/**
 * Add a user to a setlist's shared access list
 * Access: Owner only
 */
export const addSharedUser = mutation({
  args: {
    setlistId: v.id("setlists"),
    userIdToAdd: v.id("users"),
    canEdit: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const setlist = await ctx.db.get(args.setlistId);

    if (!setlist) throw new Error("Setlist not found");
    if (setlist.userId !== userId) {
      throw new Error("Only owner can share setlists");
    }

    // Prevent sharing with self
    if (args.userIdToAdd === userId) {
      throw new Error("You cannot share with yourself");
    }

    // Validate target user exists and is not anonymous
    const targetUser = await ctx.db.get(args.userIdToAdd);
    if (!targetUser) {
      throw new Error("User not found");
    }
    if (!targetUser.email) {
      throw new Error("Cannot share with anonymous users");
    }

    // Check if already shared (using setlistShares table)
    const existingShare = await ctx.db
      .query("setlistShares")
      .withIndex("by_user_setlist", (q) =>
        q.eq("userId", args.userIdToAdd).eq("setlistId", args.setlistId)
      )
      .first();

    if (existingShare) {
      throw new Error("User already has access");
    }

    // Create share record in setlistShares table
    await ctx.db.insert("setlistShares", {
      setlistId: args.setlistId,
      userId: args.userIdToAdd,
      canEdit: args.canEdit,
      addedBy: userId,
      addedAt: Date.now(),
    });
  },
});

/**
 * Remove a user from a setlist's shared access list
 * Access: Owner only
 */
export const removeSharedUser = mutation({
  args: {
    setlistId: v.id("setlists"),
    userIdToRemove: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const setlist = await ctx.db.get(args.setlistId);

    if (!setlist) throw new Error("Setlist not found");
    if (setlist.userId !== userId) {
      throw new Error("Only owner can manage sharing");
    }

    // Find and delete the share record
    const share = await ctx.db
      .query("setlistShares")
      .withIndex("by_user_setlist", (q) =>
        q.eq("userId", args.userIdToRemove).eq("setlistId", args.setlistId)
      )
      .first();

    if (share) {
      await ctx.db.delete(share._id);
    }
  },
});

/**
 * Update a setlist's privacy level
 * Access: Owner only
 */
export const updatePrivacy = mutation({
  args: {
    setlistId: v.id("setlists"),
    privacyLevel: v.union(
      v.literal("private"),
      v.literal("unlisted"),
      v.literal("public")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const canChange = await canChangeSetlistPrivacy(ctx, args.setlistId, userId);
    if (!canChange) {
      throw new Error("Only owner can change privacy level");
    }

    await ctx.db.patch(args.setlistId, {
      privacyLevel: args.privacyLevel,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update shared user's permission (upgrade view → edit or downgrade edit → view)
 * Access: Owner only
 */
export const updateSharedUserPermission = mutation({
  args: {
    setlistId: v.id("setlists"),
    targetUserId: v.id("users"),
    canEdit: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const setlist = await ctx.db.get(args.setlistId);

    if (!setlist) throw new Error("Setlist not found");
    if (setlist.userId !== userId) {
      throw new Error("Only owner can manage permissions");
    }

    // Find the share record
    const share = await ctx.db
      .query("setlistShares")
      .withIndex("by_user_setlist", (q) =>
        q.eq("userId", args.targetUserId).eq("setlistId", args.setlistId)
      )
      .first();

    if (!share) {
      throw new Error("User doesn't have access to this setlist");
    }

    // Update the permission
    await ctx.db.patch(share._id, {
      canEdit: args.canEdit,
    });
  },
});

// ============ DUPLICATION & ATTRIBUTION ============

/**
 * Duplicate a setlist (always creates private copy)
 * Note: Both owners and non-owners can duplicate setlists they can view
 * Access: Anyone who can view the setlist
 */
export const duplicate = mutation({
  args: {
    setlistId: v.id("setlists"),
    newName: v.optional(v.string()), // Override name
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(ctx);

    // Check if user can view the original
    const canView = await canViewSetlist(ctx, args.setlistId, userId);
    if (!canView) {
      throw new Error("Setlist not found or access denied");
    }

    const original = await ctx.db.get(args.setlistId);
    if (!original) throw new Error("Setlist not found");

    // Create duplicate (always private, as per user preference)
    const duplicateId = await ctx.db.insert("setlists", {
      name: args.newName ?? `${original.name} (Copy)`,
      description: original.description,
      performanceDate: undefined, // Don't copy date
      songs: original.songs ?? [],
      userId,
      privacyLevel: "private", // Always default to private
      tags: original.tags ?? [],
      estimatedDuration: original.estimatedDuration,
      difficulty: original.difficulty,
      duplicatedFrom: args.setlistId,
      duplicatedFromName: original.name,
      showAttribution: true, // Default to showing attribution
      favorites: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return duplicateId;
  },
});

/**
 * Toggle attribution visibility on a duplicated setlist
 * Access: Owner only (since it's their copy)
 */
export const toggleAttribution = mutation({
  args: { setlistId: v.id("setlists") },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(ctx);

    const canEdit = await canEditSetlist(ctx, args.setlistId, userId);
    if (!canEdit) {
      throw new Error("You can only edit your own setlists");
    }

    const setlist = await ctx.db.get(args.setlistId);
    if (!setlist) throw new Error("Setlist not found");

    await ctx.db.patch(args.setlistId, {
      showAttribution: !(setlist.showAttribution ?? false),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get original setlist info for attribution (if accessible)
 * Access: Anyone who can view the setlist
 */
export const getAttributionInfo = query({
  args: { setlistId: v.id("setlists") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const setlist = await ctx.db.get(args.setlistId);

    if (!setlist?.duplicatedFrom) return null;

    const original = await ctx.db.get(setlist.duplicatedFrom);
    if (!original) {
      // Original was deleted - return cached name
      return {
        name: setlist.duplicatedFromName ?? "[Deleted Setlist]",
        isAccessible: false,
      };
    }

    // Check if current user can view the original
    const canView = await canViewSetlist(ctx, setlist.duplicatedFrom, userId);

    if (!canView) {
      // Original exists but user can't access it (privacy changed)
      return {
        name: setlist.duplicatedFromName ?? original.name,
        isAccessible: false,
      };
    }

    // User can access original
    const owner = await ctx.db.get(original.userId);
    return {
      id: setlist.duplicatedFrom,
      name: original.name,
      isAccessible: true,
      ownerUsername: owner?.username,
    };
  },
});
