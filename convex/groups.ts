import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// ============ HELPER FUNCTIONS ============

/**
 * Generate a URL-friendly slug from a name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Get group membership for a user
 */
async function getMembership(
  ctx: { db: any },
  groupId: Id<"groups">,
  userId: Id<"users">
) {
  return await ctx.db
    .query("groupMembers")
    .withIndex("by_group_and_user", (q: any) =>
      q.eq("groupId", groupId).eq("userId", userId)
    )
    .unique();
}

/**
 * Check if user can manage another member (seniority check)
 */
function canManageMember(
  actor: { role: string; promotedAt?: number },
  target: { role: string; promotedAt?: number }
): boolean {
  if (actor.role === "owner") return true;
  if (actor.role !== "admin") return false;
  if (target.role === "owner") return false;
  if (target.role === "member") return true;
  // Both are admins - check seniority (earlier promotedAt = more senior)
  if (!actor.promotedAt || !target.promotedAt) return false;
  return actor.promotedAt < target.promotedAt;
}

// ============ QUERIES ============

/**
 * Get all groups with membership status for current user
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const groups = await ctx.db.query("groups").collect();

    return Promise.all(
      groups.map(async (group) => {
        let membership = null;
        if (userId) {
          membership = await getMembership(ctx, group._id, userId);
        }
        const memberCount = (
          await ctx.db
            .query("groupMembers")
            .withIndex("by_group", (q: any) => q.eq("groupId", group._id))
            .collect()
        ).length;

        return {
          ...group,
          memberCount,
          isMember: membership !== null,
          role: membership?.role ?? null,
        };
      })
    );
  },
});

/**
 * Get a single group by ID
 */
export const get = query({
  args: { id: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get a group by slug
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const group = await ctx.db
      .query("groups")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!group) return null;

    const userId = await getAuthUserId(ctx);
    let membership = null;
    if (userId) {
      membership = await getMembership(ctx, group._id, userId);
    }

    const memberCount = (
      await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", group._id))
        .collect()
    ).length;

    return {
      ...group,
      memberCount,
      isMember: membership !== null,
      role: membership?.role ?? null,
    };
  },
});

/**
 * Get the system "Public" group
 */
export const getPublicGroup = query({
  args: {},
  handler: async (ctx) => {
    const groups = await ctx.db.query("groups").collect();
    return groups.find((g) => g.isSystemGroup) ?? null;
  },
});

/**
 * Get groups the current user belongs to
 */
export const getUserGroups = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return Promise.all(
      memberships.map(async (membership) => {
        const group = await ctx.db.get(membership.groupId);
        return group ? { ...group, role: membership.role } : null;
      })
    ).then((groups) => groups.filter((g) => g !== null));
  },
});

/**
 * Get members of a group with user info
 */
export const getMembers = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    return Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          ...member,
          user: user
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
 * Get pending join requests for a group (admin/owner only)
 */
export const getPendingRequests = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Check if user is admin or owner
    const membership = await getMembership(ctx, args.groupId, userId);
    if (!membership || membership.role === "member") {
      return [];
    }

    const requests = await ctx.db
      .query("groupJoinRequests")
      .withIndex("by_group_and_status", (q) =>
        q.eq("groupId", args.groupId).eq("status", "pending")
      )
      .collect();

    return Promise.all(
      requests.map(async (request) => {
        const user = await ctx.db.get(request.userId);
        return {
          ...request,
          user: user
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
 * Get user's pending request for a group (if any)
 */
export const getUserPendingRequest = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const requests = await ctx.db
      .query("groupJoinRequests")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return (
      requests.find(
        (r) => r.groupId === args.groupId && r.status === "pending"
      ) ?? null
    );
  },
});

// ============ MUTATIONS ============

/**
 * Create a new group
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    joinPolicy: v.union(v.literal("open"), v.literal("approval")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to create a group");
    }

    const user = await ctx.db.get(userId);
    if (!user?.email) {
      throw new Error("Anonymous users cannot create groups");
    }

    // Generate slug and ensure uniqueness
    let slug = generateSlug(args.name);
    let existing = await ctx.db
      .query("groups")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    let counter = 1;
    while (existing) {
      slug = `${generateSlug(args.name)}-${counter}`;
      existing = await ctx.db
        .query("groups")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      counter++;
    }

    // Create the group
    const groupId = await ctx.db.insert("groups", {
      name: args.name,
      slug,
      description: args.description,
      createdBy: userId,
      joinPolicy: args.joinPolicy,
    });

    // Add creator as owner
    await ctx.db.insert("groupMembers", {
      groupId,
      userId,
      role: "owner",
      joinedAt: Date.now(),
    });

    return groupId;
  },
});

/**
 * Update a group (owner only)
 */
export const update = mutation({
  args: {
    id: v.id("groups"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    joinPolicy: v.optional(v.union(v.literal("open"), v.literal("approval"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    const membership = await getMembership(ctx, args.id, userId);
    if (!membership || membership.role !== "owner") {
      throw new Error("Only the owner can update the group");
    }

    const group = await ctx.db.get(args.id);
    if (!group) {
      throw new Error("Group not found");
    }

    if (group.isSystemGroup) {
      throw new Error("Cannot modify system groups");
    }

    const { id, ...updates } = args;
    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(args.id, cleanUpdates);
    return args.id;
  },
});

/**
 * Delete a group (owner only)
 */
export const deleteGroup = mutation({
  args: { id: v.id("groups") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    const membership = await getMembership(ctx, args.id, userId);
    if (!membership || membership.role !== "owner") {
      throw new Error("Only the owner can delete the group");
    }

    const group = await ctx.db.get(args.id);
    if (!group) {
      throw new Error("Group not found");
    }

    if (group.isSystemGroup) {
      throw new Error("Cannot delete system groups");
    }

    // Delete all members
    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.id))
      .collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete all join requests
    const requests = await ctx.db
      .query("groupJoinRequests")
      .withIndex("by_group", (q) => q.eq("groupId", args.id))
      .collect();
    for (const request of requests) {
      await ctx.db.delete(request._id);
    }

    // Delete the group
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Request to join a group
 */
export const requestJoin = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user?.email) {
      throw new Error("Anonymous users cannot join groups");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    // Check if already a member
    const existingMembership = await getMembership(ctx, args.groupId, userId);
    if (existingMembership) {
      throw new Error("Already a member of this group");
    }

    // Check for existing pending request
    const existingRequest = await ctx.db
      .query("groupJoinRequests")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()
      .then((requests) =>
        requests.find(
          (r) => r.groupId === args.groupId && r.status === "pending"
        )
      );

    if (existingRequest) {
      throw new Error("You already have a pending request");
    }

    if (group.joinPolicy === "open") {
      // Direct join for open groups
      await ctx.db.insert("groupMembers", {
        groupId: args.groupId,
        userId,
        role: "member",
        joinedAt: Date.now(),
      });
      return { joined: true };
    } else {
      // Create join request for approval groups
      await ctx.db.insert("groupJoinRequests", {
        groupId: args.groupId,
        userId,
        status: "pending",
        requestedAt: Date.now(),
      });
      return { requested: true };
    }
  },
});

/**
 * Cancel a pending join request
 */
export const cancelRequest = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    const requests = await ctx.db
      .query("groupJoinRequests")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const pendingRequest = requests.find(
      (r) => r.groupId === args.groupId && r.status === "pending"
    );

    if (!pendingRequest) {
      throw new Error("No pending request found");
    }

    await ctx.db.delete(pendingRequest._id);
    return { success: true };
  },
});

/**
 * Approve a join request (admin/owner only)
 */
export const approveJoin = mutation({
  args: { requestId: v.id("groupJoinRequests") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request || request.status !== "pending") {
      throw new Error("Request not found or already resolved");
    }

    const membership = await getMembership(ctx, request.groupId, userId);
    if (!membership || membership.role === "member") {
      throw new Error("Only admins and owners can approve requests");
    }

    // Update request status
    await ctx.db.patch(args.requestId, {
      status: "approved",
      resolvedBy: userId,
      resolvedAt: Date.now(),
    });

    // Add as member
    await ctx.db.insert("groupMembers", {
      groupId: request.groupId,
      userId: request.userId,
      role: "member",
      joinedAt: Date.now(),
      invitedBy: userId,
    });

    return { success: true };
  },
});

/**
 * Reject a join request (admin/owner only)
 */
export const rejectJoin = mutation({
  args: { requestId: v.id("groupJoinRequests") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request || request.status !== "pending") {
      throw new Error("Request not found or already resolved");
    }

    const membership = await getMembership(ctx, request.groupId, userId);
    if (!membership || membership.role === "member") {
      throw new Error("Only admins and owners can reject requests");
    }

    await ctx.db.patch(args.requestId, {
      status: "rejected",
      resolvedBy: userId,
      resolvedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Remove a member from a group (requires seniority)
 */
export const removeMember = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Must be authenticated");
    }

    const actorMembership = await getMembership(ctx, args.groupId, currentUserId);
    if (!actorMembership) {
      throw new Error("You are not a member of this group");
    }

    const targetMembership = await getMembership(ctx, args.groupId, args.userId);
    if (!targetMembership) {
      throw new Error("User is not a member of this group");
    }

    if (!canManageMember(actorMembership, targetMembership)) {
      throw new Error("You cannot remove this member");
    }

    await ctx.db.delete(targetMembership._id);
    return { success: true };
  },
});

/**
 * Promote a member to admin (any admin can do this)
 */
export const promoteToAdmin = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Must be authenticated");
    }

    const actorMembership = await getMembership(ctx, args.groupId, currentUserId);
    if (
      !actorMembership ||
      (actorMembership.role !== "owner" && actorMembership.role !== "admin")
    ) {
      throw new Error("Only admins and owners can promote members");
    }

    const targetMembership = await getMembership(ctx, args.groupId, args.userId);
    if (!targetMembership) {
      throw new Error("User is not a member of this group");
    }

    if (targetMembership.role !== "member") {
      throw new Error("User is already an admin or owner");
    }

    // Promote with current timestamp (makes them junior to existing admins)
    await ctx.db.patch(targetMembership._id, {
      role: "admin",
      promotedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Demote an admin to member (requires seniority)
 */
export const demoteAdmin = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Must be authenticated");
    }

    const actorMembership = await getMembership(ctx, args.groupId, currentUserId);
    if (!actorMembership) {
      throw new Error("You are not a member of this group");
    }

    const targetMembership = await getMembership(ctx, args.groupId, args.userId);
    if (!targetMembership) {
      throw new Error("User is not a member of this group");
    }

    if (targetMembership.role !== "admin") {
      throw new Error("User is not an admin");
    }

    if (!canManageMember(actorMembership, targetMembership)) {
      throw new Error("You cannot demote this admin (they are more senior)");
    }

    await ctx.db.patch(targetMembership._id, {
      role: "member",
      promotedAt: undefined,
    });

    return { success: true };
  },
});

/**
 * Leave a group (with owner succession)
 */
export const leaveGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    const membership = await getMembership(ctx, args.groupId, userId);
    if (!membership) {
      throw new Error("You are not a member of this group");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    // If owner is leaving, handle succession
    if (membership.role === "owner") {
      const allMembers = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
        .collect();

      const otherMembers = allMembers.filter((m) => m.userId !== userId);

      if (otherMembers.length === 0) {
        // No other members - delete the group (unless system group)
        if (group.isSystemGroup) {
          throw new Error("Cannot leave system group as the only owner");
        }

        // Delete join requests
        const requests = await ctx.db
          .query("groupJoinRequests")
          .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
          .collect();
        for (const request of requests) {
          await ctx.db.delete(request._id);
        }

        await ctx.db.delete(membership._id);
        await ctx.db.delete(args.groupId);
        return { success: true, groupDeleted: true };
      }

      // Find successor: oldest admin (by promotedAt), or oldest member (by joinedAt)
      const admins = otherMembers
        .filter((m) => m.role === "admin")
        .sort((a, b) => (a.promotedAt ?? 0) - (b.promotedAt ?? 0));

      const successor =
        admins[0] ?? otherMembers.sort((a, b) => a.joinedAt - b.joinedAt)[0];

      // Promote successor to owner
      await ctx.db.patch(successor._id, {
        role: "owner",
        promotedAt: undefined,
      });
    }

    // Remove the leaving member
    await ctx.db.delete(membership._id);

    return { success: true };
  },
});

/**
 * Transfer ownership to another member (owner only)
 */
export const transferOwnership = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Must be authenticated");
    }

    const actorMembership = await getMembership(ctx, args.groupId, currentUserId);
    if (!actorMembership || actorMembership.role !== "owner") {
      throw new Error("Only the owner can transfer ownership");
    }

    const targetMembership = await getMembership(ctx, args.groupId, args.userId);
    if (!targetMembership) {
      throw new Error("User is not a member of this group");
    }

    // Transfer ownership
    await ctx.db.patch(targetMembership._id, {
      role: "owner",
      promotedAt: undefined,
    });

    // Demote current owner to admin (with current timestamp as seniority)
    await ctx.db.patch(actorMembership._id, {
      role: "admin",
      promotedAt: Date.now(),
    });

    return { success: true };
  },
});
