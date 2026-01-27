# Phase 2: Core Sharing Mutations

## Goal
Add mutations for managing setlist sharing and privacy changes.

## Prerequisites
✅ Phase 1 completed (schema and permissions exist)

## Changes Required

### 1. Add Sharing Mutations to [convex/setlists.ts](convex/setlists.ts)

**Add these imports at the top:**
```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireAuthenticatedUser } from "./permissions";
```

**Add these mutations for managing the `setlistShares` table:**

```typescript
/**
 * Add a user to a setlist's shared access list
 */
export const addSharedUser = mutation({
  args: {
    setlistId: v.id("setlists"),
    userIdToAdd: v.id("users"),
    canEdit: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);
    const setlist = await ctx.db.get(args.setlistId);

    if (!setlist) throw new Error("Setlist not found");
    if (setlist.userId !== userId) {
      throw new Error("Only owner can share setlists");
    }

    // Check if already shared (using setlistShares table)
    const existingShare = await ctx.db
      .query("setlistShares")
      .withIndex("by_user_setlist", q =>
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
 */
export const removeSharedUser = mutation({
  args: {
    setlistId: v.id("setlists"),
    userIdToRemove: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);
    const setlist = await ctx.db.get(args.setlistId);

    if (!setlist) throw new Error("Setlist not found");
    if (setlist.userId !== userId) {
      throw new Error("Only owner can manage sharing");
    }

    // Find and delete the share record
    const share = await ctx.db
      .query("setlistShares")
      .withIndex("by_user_setlist", q =>
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
    const userId = await requireAuthenticatedUser(ctx);

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
 */
export const updateSharedUserPermission = mutation({
  args: {
    setlistId: v.id("setlists"),
    targetUserId: v.id("users"),
    canEdit: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);
    const setlist = await ctx.db.get(args.setlistId);

    if (!setlist) throw new Error("Setlist not found");
    if (setlist.userId !== userId) {
      throw new Error("Only owner can manage permissions");
    }

    // Find the share record
    const share = await ctx.db
      .query("setlistShares")
      .withIndex("by_user_setlist", q =>
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
```

---

### 2. Update `list()` Query in [convex/setlists.ts](convex/setlists.ts)

**Replace the existing `list()` query handler with this EFFICIENT version using setlistShares table:**

```typescript
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
      shares.map(share => ctx.db.get(share.setlistId))
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
```

**Note:** This is O(1) for the index lookups + O(k) for fetching shared setlists where k = number of setlists shared with user. Much better than the O(n) approach of scanning all setlists.

---

### 3. Add Helper Query for Shared Status

**Add this query to help frontend determine ownership/sharing status:**

```typescript
/**
 * Get sharing info for a setlist (who has access, what permissions)
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
    const sharedUsers = [];

    if (isOwner || canEdit) {
      // Show full collaborator list from setlistShares table
      const shares = await ctx.db
        .query("setlistShares")
        .withIndex("by_setlist", q => q.eq("setlistId", args.setlistId))
        .collect();

      for (const share of shares) {
        const user = await ctx.db.get(share.userId);
        if (user) {
          sharedUsers.push({
            oderId: share.userId,
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
      privacyLevel: setlist.privacyLevel ?? "private",  // Default to private
      sharedUsers: isOwner || canEdit ? sharedUsers : [], // Only show if owner or editor
      ownerInfo: isOwner ? null : {
        userId: setlist.userId,
      },
    };
  },
});
```

---

## Testing Steps

1. **Create a setlist:**
   - Should have `privacyLevel: "private"` by default

2. **Share with another user (view-only):**
   - Call `addSharedUser` with `canEdit: false`
   - Other user should see setlist in their `list()` query
   - Other user should NOT be able to edit

3. **Upgrade to edit access:**
   - Call `updateSharedUserPermission` with `canEdit: true`
   - Other user should now be able to edit the setlist

4. **Change privacy to unlisted:**
   - Call `updatePrivacy` with `privacyLevel: "unlisted"`
   - Setlist should be accessible via link (tested in later phases)

5. **Change privacy to public:**
   - Call `updatePrivacy` with `privacyLevel: "public"`
   - Setlist should be publicly visible (tested in Phase 3)

6. **Remove shared user:**
   - Call `removeSharedUser`
   - User should no longer see setlist in their list

7. **Permission checks:**
   - Non-owner tries to change privacy → should fail
   - Shared editor tries to change privacy → should fail
   - Non-owner tries to add shared user → should fail

---

## Dependencies
- Phase 1 (schema and permissions)

## Next Phase
Phase 3: Browse & Discovery (public setlist queries)
