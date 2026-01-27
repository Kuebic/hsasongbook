# Phase 3: Browse & Discovery

## Goal
Add queries for discovering and browsing public setlists.

## Prerequisites
✅ Phase 1 completed (schema with privacyLevel exists)
✅ Phase 2 completed (privacy mutations work)

## Changes Required

### 1. Add Browse Queries to [convex/setlists.ts](convex/setlists.ts)

```typescript
/**
 * Browse public setlists with filtering and sorting
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
    // Get all public setlists
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
        const songCount = s.songs?.length ?? s.arrangementIds?.length ?? 0;
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
 */
export const getBrowseStats = query({
  args: {},
  handler: async (ctx) => {
    const publicSetlists = await ctx.db
      .query("setlists")
      .withIndex("by_privacy", (q) => q.eq("privacyLevel", "public"))
      .collect();

    const totalSongs = publicSetlists.reduce((sum, s) => {
      return sum + (s.songs?.length ?? s.arrangementIds?.length ?? 0);
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
```

---

### 2. Update Setlist Metadata Mutation

**Add mutation to update tags, duration, difficulty:**

```typescript
/**
 * Update setlist metadata (tags, duration, difficulty)
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
    const userId = await requireAuthenticatedUser(ctx);

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
```

---

## Testing Steps

1. **Create public setlist with metadata:**
   - Create setlist
   - Update privacy to "public"
   - Add tags: `["worship", "sunday-service"]`
   - Set duration: `45` (minutes)
   - Set difficulty: `"intermediate"`

2. **Test browse query:**
   - Call `browse()` with no filters → should return all public setlists
   - Filter by tags → should only show matching setlists
   - Filter by duration range → should filter correctly
   - Filter by song count → should filter correctly
   - Search by name → should find matching setlists

3. **Test sorting:**
   - Sort by "popular" → should order by favorites count (descending)
   - Sort by "recent" → should order by updatedAt (descending)
   - Sort by "name" → should order alphabetically

4. **Test getByCreator:**
   - Call with a user ID → should only return their public setlists
   - Private setlists should NOT appear

5. **Test getDistinctTags:**
   - Should return sorted array of all unique tags from public setlists

6. **Test getBrowseStats:**
   - Should return accurate counts and averages

---

## Dependencies
- Phase 1 (schema)
- Phase 2 (privacy mutations)

## Next Phase
Phase 4: Duplication & Favorites
