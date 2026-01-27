# Phase 2: Core Sharing Mutations

## Goal
Add mutations for managing setlist sharing and privacy changes.

## Prerequisites
✅ Phase 1 completed (schema and permissions exist)

## Changes Required

### 1. Add Sharing Mutations to [convex/setlists.ts](convex/setlists.ts)

**Add these three new mutations:**

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

    const currentShared = setlist.sharedWith ?? [];

    // Check if already shared
    const existing = currentShared.find(s => s.userId === args.userIdToAdd);
    if (existing) {
      throw new Error("User already has access");
    }

    await ctx.db.patch(args.setlistId, {
      sharedWith: [
        ...currentShared,
        {
          userId: args.userIdToAdd,
          canEdit: args.canEdit,
          addedBy: userId,
          addedAt: Date.now(),
        },
      ],
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

    await ctx.db.patch(args.setlistId, {
      sharedWith: (setlist.sharedWith ?? []).filter(
        s => s.userId !== args.userIdToRemove
      ),
    });
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

    const currentShared = setlist.sharedWith ?? [];
    const userIndex = currentShared.findIndex(s => s.userId === args.targetUserId);

    if (userIndex === -1) {
      throw new Error("User doesn't have access to this setlist");
    }

    const updated = [...currentShared];
    updated[userIndex] = { ...updated[userIndex], canEdit: args.canEdit };

    await ctx.db.patch(args.setlistId, {
      sharedWith: updated,
    });
  },
});
```

---

### 2. Update `list()` Query in [convex/setlists.ts](convex/setlists.ts)

**Replace the existing `list()` query handler with:**

```typescript
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get setlists owned by user
    const ownedSetlists = await ctx.db
      .query("setlists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get setlists shared WITH user
    const allSetlists = await ctx.db.query("setlists").collect();
    const sharedSetlists = allSetlists.filter((setlist) =>
      setlist.sharedWith?.some((share) => share.userId === userId)
    );

    return [...ownedSetlists, ...sharedSetlists].sort(
      (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)
    );
  },
});
```

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
      // Show full collaborator list
      if (setlist.sharedWith) {
        for (const share of setlist.sharedWith) {
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
    }

    return {
      isOwner,
      canEdit,
      canChangePrivacy: isOwner,
      privacyLevel: setlist.privacyLevel,
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
