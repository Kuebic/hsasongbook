import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Centralized permission helpers for songs and arrangements
 * Phase 1: Collaborators - Owner-only editing with collaborator support
 * Phase 2: Groups - Group ownership with role-based access
 */

// ============ HELPER TYPES ============

type ContentOwnership = {
  ownerType?: "user" | "group";
  ownerId?: string;
  createdBy: Id<"users">;
};

// ============ AUTHENTICATION HELPERS ============

/**
 * Require an authenticated user and return their ID.
 * Throws if not authenticated.
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Must be authenticated");
  }
  return userId;
}

/**
 * Require an authenticated non-anonymous user.
 * Returns both userId and user document.
 * Throws if not authenticated or if user is anonymous (no email).
 */
export async function requireAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
): Promise<{ userId: Id<"users">; user: Doc<"users"> }> {
  const userId = await requireAuth(ctx);
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("User not found");
  }
  if (!user.email) {
    throw new Error(
      "Anonymous users cannot perform this action. Please sign in."
    );
  }
  return { userId, user };
}

// ============ UTILITY HELPERS ============

/**
 * Generate a URL-friendly slug from text.
 * Converts to lowercase, replaces non-alphanumeric chars with hyphens,
 * trims leading/trailing hyphens, and optionally limits length.
 *
 * Note: This is for simple slugification (e.g., group names).
 * For songs/arrangements with nanoid suffixes, use slugGenerator.ts in frontend.
 */
export function slugify(text: string, maxLength = 50): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, maxLength);
}

/**
 * Filter out undefined values from an object.
 * Useful for building partial update objects for database patches.
 */
export function filterUndefined<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key as keyof T] = value as T[keyof T];
    }
  }
  return result;
}

// ============ USER INFO FORMATTING ============

/**
 * Format user info for API responses.
 * Extracts only the fields needed for display.
 */
export function formatUserInfo(user: Doc<"users"> | null) {
  if (!user) return null;
  return {
    _id: user._id,
    username: user.username,
    displayName: user.displayName,
    showRealName: user.showRealName,
    avatarKey: user.avatarKey,
  };
}

// ============ GROUP HELPERS ============

/**
 * Get the system Community group
 */
export async function getCommunityGroup(ctx: QueryCtx | MutationCtx) {
  const groups = await ctx.db.query("groups").collect();
  return groups.find((g) => g.isSystemGroup) ?? null;
}

/**
 * Check if a group is the Community system group
 */
export async function isCommunityGroup(
  ctx: QueryCtx | MutationCtx,
  groupId: string
): Promise<boolean> {
  const communityGroup = await getCommunityGroup(ctx);
  return communityGroup?._id.toString() === groupId;
}

/**
 * Get user's membership in a group
 */
export async function getGroupMembership(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<"groups">,
  userId: Id<"users">
) {
  return await ctx.db
    .query("groupMembers")
    .withIndex("by_group_and_user", (q) =>
      q.eq("groupId", groupId).eq("userId", userId)
    )
    .unique();
}

/**
 * Check if user is a member of a group
 */
export async function isGroupMember(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<"groups">,
  userId: Id<"users">
): Promise<boolean> {
  const membership = await getGroupMembership(ctx, groupId, userId);
  return membership !== null;
}

/**
 * Check if user is admin or owner of a group
 */
export async function isGroupAdminOrOwner(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<"groups">,
  userId: Id<"users">
): Promise<boolean> {
  const membership = await getGroupMembership(ctx, groupId, userId);
  return (
    membership !== null &&
    (membership.role === "admin" || membership.role === "owner")
  );
}

// ============ ARRANGEMENT PERMISSIONS (Phase 1 + Phase 2) ============

/**
 * Check if a user is the owner of an arrangement (user ownership)
 */
export async function isArrangementOwner(
  ctx: QueryCtx | MutationCtx,
  arrangementId: Id<"arrangements">,
  userId: Id<"users">
): Promise<boolean> {
  const arrangement = await ctx.db.get(arrangementId);
  if (!arrangement) return false;

  // If group-owned, the "owner" concept is different
  if (arrangement.ownerType === "group") {
    // Check if user is group owner
    const groupId = arrangement.ownerId as Id<"groups">;
    const membership = await getGroupMembership(ctx, groupId, userId);
    return membership?.role === "owner";
  }

  // Default: user ownership via createdBy
  return arrangement.createdBy === userId;
}

/**
 * Check if a user is a collaborator on an arrangement
 */
export async function isArrangementCollaborator(
  ctx: QueryCtx | MutationCtx,
  arrangementId: Id<"arrangements">,
  userId: Id<"users">
): Promise<boolean> {
  const collaborator = await ctx.db
    .query("arrangementCollaborators")
    .withIndex("by_arrangement_and_user", (q) =>
      q.eq("arrangementId", arrangementId).eq("userId", userId)
    )
    .unique();
  return collaborator !== null;
}

/**
 * Check if a user is a co-author on an arrangement
 */
export async function isArrangementCoAuthor(
  ctx: QueryCtx | MutationCtx,
  arrangementId: Id<"arrangements">,
  userId: Id<"users">
): Promise<boolean> {
  const author = await ctx.db
    .query("arrangementAuthors")
    .withIndex("by_arrangement", (q) => q.eq("arrangementId", arrangementId))
    .collect()
    .then((authors) => authors.find((a) => a.userId === userId));
  return author !== undefined;
}

/**
 * Check if a user can edit an arrangement
 *
 * Phase 2 Logic:
 * 1. Original creator (createdBy) can ALWAYS edit their arrangement
 * 2. If ownerType='user': check owner or collaborator/co-author
 * 3. If ownerType='group':
 *    - For Public group: any member can edit
 *    - For other groups: owner/admin can edit, members if co-author
 */
export async function canEditArrangement(
  ctx: QueryCtx | MutationCtx,
  arrangementId: Id<"arrangements">,
  userId: Id<"users">
): Promise<boolean> {
  const arrangement = await ctx.db.get(arrangementId);
  if (!arrangement) return false;

  // Original creator can always edit (even after transferring to Public)
  if (arrangement.createdBy === userId) return true;

  // Group ownership (Phase 2)
  if (arrangement.ownerType === "group" && arrangement.ownerId) {
    const groupId = arrangement.ownerId as Id<"groups">;

    // Check if this is the Community group
    const communityGroup = await getCommunityGroup(ctx);
    if (communityGroup && communityGroup._id.toString() === arrangement.ownerId) {
      // Community group: any member can edit
      return await isGroupMember(ctx, groupId, userId);
    }

    // Other groups: admin/owner can always edit
    if (await isGroupAdminOrOwner(ctx, groupId, userId)) {
      return true;
    }

    // Members can edit if they are a co-author
    if (await isGroupMember(ctx, groupId, userId)) {
      return await isArrangementCoAuthor(ctx, arrangementId, userId);
    }

    return false;
  }

  // User ownership (Phase 1 logic)
  // Check collaborator status
  if (await isArrangementCollaborator(ctx, arrangementId, userId)) return true;

  // Check co-author status
  if (await isArrangementCoAuthor(ctx, arrangementId, userId)) return true;

  return false;
}

// ============ SONG PERMISSIONS (Phase 2) ============

/**
 * Check if a user is the owner of a song
 */
export async function isSongOwner(
  ctx: QueryCtx | MutationCtx,
  songId: Id<"songs">,
  userId: Id<"users">
): Promise<boolean> {
  const song = await ctx.db.get(songId);
  if (!song) return false;

  // If group-owned, check if user is group owner
  if (song.ownerType === "group" && song.ownerId) {
    const groupId = song.ownerId as Id<"groups">;
    const membership = await getGroupMembership(ctx, groupId, userId);
    return membership?.role === "owner";
  }

  // Default: user ownership via createdBy
  return song.createdBy === userId;
}

/**
 * Check if a user can edit a song
 *
 * Phase 2 Logic:
 * 1. Original creator (createdBy) can ALWAYS edit their song
 * 2. If ownerType='user': only creator can edit (covered by #1)
 * 3. If ownerType='group':
 *    - For Public group: any member can edit
 *    - For other groups: owner/admin can edit
 */
export async function canEditSong(
  ctx: QueryCtx | MutationCtx,
  songId: Id<"songs">,
  userId: Id<"users">
): Promise<boolean> {
  const song = await ctx.db.get(songId);
  if (!song) return false;

  // Original creator can always edit (even after transferring to Public)
  if (song.createdBy === userId) return true;

  // Group ownership (Phase 2)
  if (song.ownerType === "group" && song.ownerId) {
    const groupId = song.ownerId as Id<"groups">;

    // Check if this is the Community group
    const communityGroup = await getCommunityGroup(ctx);
    if (communityGroup && communityGroup._id.toString() === song.ownerId) {
      // Community group: any member can edit
      return await isGroupMember(ctx, groupId, userId);
    }

    // Other groups: only admin/owner can edit
    return await isGroupAdminOrOwner(ctx, groupId, userId);
  }

  return false;
}

// ============ UNIFIED CONTENT PERMISSION CHECK ============

/**
 * Unified permission check for songs and arrangements
 */
export async function canEditContent(
  ctx: QueryCtx | MutationCtx,
  contentType: "song" | "arrangement",
  contentId: string,
  userId: Id<"users">
): Promise<boolean> {
  if (contentType === "song") {
    return await canEditSong(ctx, contentId as Id<"songs">, userId);
  } else {
    return await canEditArrangement(
      ctx,
      contentId as Id<"arrangements">,
      userId
    );
  }
}

// ============ OWNERSHIP HELPERS ============

/**
 * Get the owner display info for content
 * Returns either user info or group info based on ownerType
 */
export async function getContentOwnerInfo(
  ctx: QueryCtx | MutationCtx,
  content: ContentOwnership
): Promise<{
  type: "user" | "group";
  id: string;
  name: string;
  slug?: string;
  avatarKey?: string;
  isSystemGroup?: boolean;
}> {
  if (content.ownerType === "group" && content.ownerId) {
    const group = await ctx.db.get(content.ownerId as Id<"groups">);
    if (group) {
      return {
        type: "group",
        id: group._id.toString(),
        name: group.name,
        slug: group.slug,
        avatarKey: group.avatarKey,
        isSystemGroup: group.isSystemGroup,
      };
    }
  }

  // Default to user ownership
  const user = await ctx.db.get(content.createdBy);
  if (user) {
    const displayName =
      user.showRealName && user.displayName
        ? user.displayName
        : user.username ?? "Unknown";
    return {
      type: "user",
      id: user._id.toString(),
      name: displayName,
      slug: user.username,
      avatarKey: user.avatarKey,
    };
  }

  return {
    type: "user",
    id: content.createdBy.toString(),
    name: "Unknown",
  };
}
