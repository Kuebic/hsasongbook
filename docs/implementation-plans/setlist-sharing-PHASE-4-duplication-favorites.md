# Phase 4: Duplication & Favorites

## Goal
Add setlist duplication feature and integrate favorites system.

## Prerequisites
✅ Phase 1 completed (schema with attribution fields)
✅ Phase 2 completed (sharing works)
✅ Phase 3 completed (browse works)

## Changes Required

### 1. Add Duplication Mutations to [convex/setlists.ts](convex/setlists.ts)

```typescript
/**
 * Duplicate a setlist (always creates private copy)
 */
export const duplicate = mutation({
  args: {
    setlistId: v.id("setlists"),
    newName: v.optional(v.string()), // Override name
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);

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
      arrangementIds: original.arrangementIds ?? [],
      userId,
      privacyLevel: "private", // Always default to private
      tags: original.tags ?? [],
      estimatedDuration: original.estimatedDuration,
      difficulty: original.difficulty,
      duplicatedFrom: args.setlistId,
      duplicatedFromName: original.name,
      showAttribution: true, // Default to showing attribution
      favorites: 0,
      updatedAt: Date.now(),
    });

    return duplicateId;
  },
});

/**
 * Toggle attribution visibility on a duplicated setlist
 */
export const toggleAttribution = mutation({
  args: { setlistId: v.id("setlists") },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);

    const canEdit = await canEditSetlist(ctx, args.setlistId, userId);
    if (!canEdit) {
      throw new Error("You can only edit your own setlists");
    }

    const setlist = await ctx.db.get(args.setlistId);
    if (!setlist) throw new Error("Setlist not found");

    await ctx.db.patch(args.setlistId, {
      showAttribution: !(setlist.showAttribution ?? false),
    });
  },
});

/**
 * Get original setlist info for attribution (if accessible)
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
```

---

### 2. Update Favorites Schema in [convex/schema.ts](convex/schema.ts)

**Find the `userFavorites` table (line ~228) and update `targetType`:**

```typescript
targetType: v.union(
  v.literal("song"),
  v.literal("arrangement"),
  v.literal("setlist")  // Add this
),
```

---

### 3. Extend Favorites Functions in [convex/favorites.ts](convex/favorites.ts)

**Add query to get user's favorite setlists:**

```typescript
/**
 * Get all setlists favorited by the current user
 */
export const getUserFavoriteSetlists = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const favorites = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", userId).eq("targetType", "setlist")
      )
      .collect();

    const setlistIds = favorites.map((f) => f.targetId as Id<"setlists">);

    // Fetch setlists and filter out ones user can no longer access
    const setlists = await Promise.all(setlistIds.map((id) => ctx.db.get(id)));

    const accessible = [];
    for (let i = 0; i < setlists.length; i++) {
      const setlist = setlists[i];
      if (!setlist) continue;

      const canView = await canViewSetlist(ctx, setlistIds[i], userId);
      if (canView) accessible.push(setlist);
    }

    return accessible;
  },
});
```

**Update the existing `toggle()` mutation to handle setlist favorites:**

Find the `toggle()` mutation and add this logic after toggling the favorite:

```typescript
// Update denormalized counter for setlists
if (args.targetType === "setlist") {
  const setlist = await ctx.db.get(args.targetId as Id<"setlists">);
  if (setlist) {
    const newCount = isFavorited
      ? Math.max(0, (setlist.favorites ?? 0) - 1)
      : (setlist.favorites ?? 0) + 1;

    await ctx.db.patch(args.targetId as Id<"setlists">, {
      favorites: newCount,
    });
  }
}
```

**Update the `isFavorited()` query to support setlists** (should already work if using generic targetType/targetId).

---

## Testing Steps

### Duplication Tests

1. **Duplicate a public setlist:**
   - Find a public setlist
   - Call `duplicate()` mutation
   - Verify new setlist is created with `privacyLevel: "private"`
   - Verify `duplicatedFrom` points to original
   - Verify `showAttribution: true`

2. **Duplicate with custom name:**
   - Call `duplicate()` with `newName: "My Custom Name"`
   - Verify setlist has the custom name

3. **Toggle attribution:**
   - Call `toggleAttribution()`
   - Verify `showAttribution` flips to `false`
   - Call again, verify it flips back to `true`

4. **Get attribution info:**
   - For accessible original → should return full info with link
   - For deleted original → should return cached name, `isAccessible: false`
   - For private original (after privacy change) → should return name but `isAccessible: false`

### Favorites Tests

1. **Favorite a public setlist:**
   - Call `favorites.toggle()` with `targetType: "setlist"`
   - Verify `favorites` count increments on setlist
   - Verify appears in `getUserFavoriteSetlists()`

2. **Unfavorite a setlist:**
   - Call `toggle()` again
   - Verify `favorites` count decrements
   - Verify removed from `getUserFavoriteSetlists()`

3. **Favorite setlist then owner changes privacy:**
   - Favorite a public setlist
   - Owner changes to private
   - Call `getUserFavoriteSetlists()` → should NOT appear (filtered out by `canView` check)

4. **Check isFavorited:**
   - Should return `true` for favorited setlists
   - Should return `false` for non-favorited setlists

---

## Dependencies
- Phase 1 (schema with favorites counter)
- Phase 2 (sharing/privacy)
- Phase 3 (browse queries)

## Next Phase
Phase 5: Frontend Types & Core Components
