import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Centralized permission helpers for arrangements
 * Phase 1: Collaborators - Owner-only editing with collaborator support
 */

/**
 * Check if a user is the owner of an arrangement
 */
export async function isArrangementOwner(
  ctx: QueryCtx | MutationCtx,
  arrangementId: Id<"arrangements">,
  userId: Id<"users">
): Promise<boolean> {
  const arrangement = await ctx.db.get(arrangementId);
  if (!arrangement) return false;
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
 * Check if a user can edit an arrangement (is owner OR collaborator)
 */
export async function canEditArrangement(
  ctx: QueryCtx | MutationCtx,
  arrangementId: Id<"arrangements">,
  userId: Id<"users">
): Promise<boolean> {
  // Check ownership first (most common case)
  const isOwner = await isArrangementOwner(ctx, arrangementId, userId);
  if (isOwner) return true;

  // Check collaborator status
  return await isArrangementCollaborator(ctx, arrangementId, userId);
}
