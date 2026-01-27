# Implementation Plan: Setlist Privacy, Sharing & Discovery

## Overview
Expand setlists from private-only to support three privacy levels (private, unlisted, public) with full sharing capabilities, discoverability, user profile integration, favorites, and duplication features.

---

## User Requirements Summary

Based on exploration and clarification:

✅ **Privacy Levels**: Private (owner only) → Unlisted (link sharing) → Public (discoverable)
✅ **Revertible**: Users can change public → private anytime (with full flexibility)
✅ **Attribution**: Duplicates show "Duplicated from [Original]" (removable by user)
✅ **Broken References**: Show `[Unavailable]` placeholder for deleted/private arrangements
✅ **Shared With Me**: Dedicated section for setlists shared with the user
✅ **Browse Features**: Sort by popularity, filter by tags/themes/duration/song count, search by name/creator
✅ **Edit Permissions**: Only owner can change privacy level (shared editors cannot)
✅ **Offline Support**: Cache setlists for offline viewing (critical for worship services)
✅ **Anonymous Access**: Full public viewing + favorites (with local storage warning)
✅ **Duplicate Privacy**: Always default to private
✅ **Shared Transparency**: Only users with edit access see full collaborator list
✅ **No Limits**: No caps on setlist count or shared user count (for now)
✅ **Discovery UX**: Dedicated `/setlists/browse` page

---

## Critical Files to Modify

### Backend (Convex)
- [convex/schema.ts](convex/schema.ts) - Add privacy fields, tags, metadata
- [convex/permissions.ts](convex/permissions.ts) - Add `canViewSetlist()`, `canEditSetlist()`
- [convex/setlists.ts](convex/setlists.ts) - New queries/mutations for sharing, browse, duplicate
- [convex/favorites.ts](convex/favorites.ts) - Extend to support setlist favoriting
- [convex/users.ts](convex/users.ts) - May need `getPublicSetlistsByUser()` for profiles

### Frontend
- [src/types/Database.types.ts](src/types/Database.types.ts) - Add privacy types
- [src/features/setlists/pages/SetlistPage.tsx](src/features/setlists/pages/SetlistPage.tsx) - Privacy selector UI
- [src/features/setlists/pages/SetlistsIndexPage.tsx](src/features/setlists/pages/SetlistsIndexPage.tsx) - Add "Shared With Me" section
- [src/features/setlists/components/SetlistForm.tsx](src/features/setlists/components/SetlistForm.tsx) - Privacy level selector
- [src/features/profile/pages/UserProfilePage.tsx](src/features/profile/pages/UserProfilePage.tsx) - Show user's public setlists
- [src/features/search/](src/features/search/) - Create `/setlists/browse` page
- [src/features/favorites/](src/features/favorites/) - Add setlist favorites support
- [src/components/](src/components/) - Create sharing dialog, privacy components

---

## Implementation Steps

### **Phase 1: Schema & Permission Foundation**

#### 1.1 Update Convex Schema ([convex/schema.ts](convex/schema.ts))

Add to `setlists` table:
```typescript
privacyLevel: v.union(
  v.literal("private"),   // Default: owner only
  v.literal("unlisted"),  // Shareable via link, not in browse
  v.literal("public")     // Discoverable in browse/search
),

// Explicit sharing for unlisted/private setlists
sharedWith: v.optional(
  v.array(
    v.object({
      userId: v.id("users"),
      canEdit: v.boolean(),
      addedBy: v.id("users"),   // Who granted access
      addedAt: v.number(),
    })
  )
),

// Discoverability metadata (for public setlists)
tags: v.optional(v.array(v.string())),         // e.g., ["worship", "christmas"]
estimatedDuration: v.optional(v.number()),     // Minutes
difficulty: v.optional(v.union(
  v.literal("beginner"),
  v.literal("intermediate"),
  v.literal("advanced")
)),

// Attribution for duplicates
duplicatedFrom: v.optional(v.id("setlists")),   // Source setlist ID
duplicatedFromName: v.optional(v.string()),     // Cached name for display
showAttribution: v.boolean(),                   // User can toggle off

// Denormalized favorites counter (like songs/arrangements)
favorites: v.number(),
```

**Add indexes:**
```typescript
.index("by_user", ["userId"])
.index("by_privacy", ["privacyLevel"])  // For browse queries
.index("by_favorites", ["favorites"])   // For popularity sort
```

#### 1.2 Add Permission Functions ([convex/permissions.ts](convex/permissions.ts))

```typescript
export async function canViewSetlist(
  ctx: QueryCtx | MutationCtx,
  setlistId: Id<"setlists">,
  userId: Id<"users"> | null
): Promise<boolean> {
  const setlist = await ctx.db.get(setlistId);
  if (!setlist) return false;

  // Public: anyone can view (including anonymous)
  if (setlist.privacyLevel === "public") return true;

  // Owner always has access
  if (userId && setlist.userId === userId) return true;

  // Check explicit sharing (unlisted or private)
  if (userId && setlist.sharedWith) {
    return setlist.sharedWith.some(share => share.userId === userId);
  }

  return false;
}

export async function canEditSetlist(
  ctx: QueryCtx | MutationCtx,
  setlistId: Id<"setlists">,
  userId: Id<"users">
): Promise<boolean> {
  const setlist = await ctx.db.get(setlistId);
  if (!setlist) return false;

  // Owner can always edit
  if (setlist.userId === userId) return true;

  // Check if shared with edit permission
  if (setlist.sharedWith) {
    const share = setlist.sharedWith.find(s => s.userId === userId);
    return share?.canEdit ?? false;
  }

  return false;
}

export async function canChangeSetlistPrivacy(
  ctx: QueryCtx | MutationCtx,
  setlistId: Id<"setlists">,
  userId: Id<"users">
): Promise<boolean> {
  const setlist = await ctx.db.get(setlistId);
  if (!setlist) return false;

  // ONLY owner can change privacy level
  return setlist.userId === userId;
}
```

---

### **Phase 2: Core Sharing Mutations**

#### 2.1 Update Existing Queries ([convex/setlists.ts](convex/setlists.ts))

**Update `list()` query:**
```typescript
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get setlists owned by user
    const ownedSetlists = await ctx.db
      .query("setlists")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();

    // Get setlists shared WITH user
    const allSetlists = await ctx.db.query("setlists").collect();
    const sharedSetlists = allSetlists.filter(setlist =>
      setlist.sharedWith?.some(share => share.userId === userId)
    );

    return [...ownedSetlists, ...sharedSetlists]
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  },
});
```

**Update `get()` query:**
```typescript
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
```

#### 2.2 New Sharing Mutations

```typescript
// Add user to setlist sharing
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
    const existing = currentShared.find(s => s.userIdToAdd === args.userIdToAdd);
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

// Remove shared user
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

// Update privacy level
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
```

---

### **Phase 3: Browse & Discovery**

#### 3.1 Browse Query

```typescript
export const browse = query({
  args: {
    searchTerm: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    minDuration: v.optional(v.number()),
    maxDuration: v.optional(v.number()),
    minSongs: v.optional(v.number()),
    maxSongs: v.optional(v.number()),
    sortBy: v.optional(v.union(
      v.literal("popular"),      // By favorites
      v.literal("recent"),       // By updatedAt
      v.literal("name")          // Alphabetical
    )),
  },
  handler: async (ctx, args) => {
    // Get all public setlists
    let setlists = await ctx.db
      .query("setlists")
      .withIndex("by_privacy", q => q.eq("privacyLevel", "public"))
      .collect();

    // Filter by search term (name or description)
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      setlists = setlists.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term)
      );
    }

    // Filter by tags
    if (args.tags && args.tags.length > 0) {
      setlists = setlists.filter(s =>
        args.tags!.some(tag => s.tags?.includes(tag))
      );
    }

    // Filter by duration
    if (args.minDuration !== undefined) {
      setlists = setlists.filter(s =>
        (s.estimatedDuration ?? 0) >= args.minDuration!
      );
    }
    if (args.maxDuration !== undefined) {
      setlists = setlists.filter(s =>
        (s.estimatedDuration ?? Infinity) <= args.maxDuration!
      );
    }

    // Filter by song count
    if (args.minSongs !== undefined || args.maxSongs !== undefined) {
      setlists = setlists.filter(s => {
        const songCount = s.songs?.length ?? s.arrangementIds?.length ?? 0;
        if (args.minSongs !== undefined && songCount < args.minSongs) return false;
        if (args.maxSongs !== undefined && songCount > args.maxSongs) return false;
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

// Get public setlists by creator (for user profiles)
export const getByCreator = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const setlists = await ctx.db
      .query("setlists")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .collect();

    // Only return public setlists
    return setlists
      .filter(s => s.privacyLevel === "public")
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  },
});

// Get distinct tags for filter UI
export const getDistinctTags = query({
  args: {},
  handler: async (ctx) => {
    const setlists = await ctx.db
      .query("setlists")
      .withIndex("by_privacy", q => q.eq("privacyLevel", "public"))
      .collect();

    const tagSet = new Set<string>();
    setlists.forEach(s => {
      s.tags?.forEach(tag => tagSet.add(tag));
    });

    return Array.from(tagSet).sort();
  },
});
```

---

### **Phase 4: Duplication Feature**

```typescript
export const duplicate = mutation({
  args: {
    setlistId: v.id("setlists"),
    newName: v.optional(v.string()),  // Override name
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
      performanceDate: undefined,  // Don't copy date
      songs: original.songs ?? [],
      arrangementIds: original.arrangementIds ?? [],
      userId,
      privacyLevel: "private",  // Always default to private
      tags: original.tags ?? [],
      estimatedDuration: original.estimatedDuration,
      difficulty: original.difficulty,
      duplicatedFrom: args.setlistId,
      duplicatedFromName: original.name,
      showAttribution: true,  // Default to showing attribution
      favorites: 0,
      updatedAt: Date.now(),
    });

    return duplicateId;
  },
});

// Toggle attribution visibility
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
      showAttribution: !setlist.showAttribution,
    });
  },
});
```

---

### **Phase 5: Favorites Integration**

#### 5.1 Update Favorites Schema ([convex/favorites.ts](convex/favorites.ts))

Extend `targetType` union:
```typescript
targetType: v.union(
  v.literal("song"),
  v.literal("arrangement"),
  v.literal("setlist")  // Add this
),
```

#### 5.2 Add Setlist Favorite Functions

```typescript
export const getUserFavoriteSetlists = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const favorites = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_type", q =>
        q.eq("userId", userId).eq("targetType", "setlist")
      )
      .collect();

    const setlistIds = favorites.map(f => f.targetId as Id<"setlists">);

    // Fetch setlists and filter out ones user can no longer access
    const setlists = await Promise.all(
      setlistIds.map(id => ctx.db.get(id))
    );

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

#### 5.3 Update Toggle Mutation

Update existing `toggle()` to support denormalized counter for setlists:
```typescript
// When toggling setlist favorite, update setlist.favorites count
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

---

### **Phase 6: Anonymous User Favorites (Consistency)**

Since anonymous users can favorite songs/arrangements, ensure they can favorite public setlists too.

#### 6.1 Create Anonymous Favorites Hook ([src/features/favorites/hooks/useAnonymousFavorites.ts](src/features/favorites/hooks/useAnonymousFavorites.ts))

If this doesn't exist, create it:
```typescript
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface AnonymousFavorite {
  targetId: string;
  targetType: 'song' | 'arrangement' | 'setlist';
  timestamp: number;
}

export function useAnonymousFavorites() {
  const [favorites, setFavorites] = useLocalStorage<AnonymousFavorite[]>(
    'anonymous-favorites',
    []
  );

  const toggleFavorite = (targetId: string, targetType: 'song' | 'arrangement' | 'setlist') => {
    setFavorites(prev => {
      const exists = prev.some(f => f.targetId === targetId && f.targetType === targetType);
      if (exists) {
        return prev.filter(f => !(f.targetId === targetId && f.targetType === targetType));
      } else {
        return [...prev, { targetId, targetType, timestamp: Date.now() }];
      }
    });
  };

  const isFavorited = (targetId: string, targetType: 'song' | 'arrangement' | 'setlist') => {
    return favorites.some(f => f.targetId === targetId && f.targetType === targetType);
  };

  return { favorites, toggleFavorite, isFavorited };
}
```

#### 6.2 Add Warning Banner Component ([src/features/favorites/components/AnonymousFavoritesWarning.tsx](src/features/favorites/components/AnonymousFavoritesWarning.tsx))

```tsx
export function AnonymousFavoritesWarning() {
  const { user } = useAuth();
  const { favorites } = useAnonymousFavorites();

  if (!user?.isAnonymous || favorites.length === 0) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-yellow-400" />
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            Your favorites are stored locally. They won't sync across devices or persist if you clear your browser cache.
            <Link to="/sign-in" className="font-medium underline ml-1">
              Sign up to save them permanently.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

Show this in:
- `/favorites` page
- `/setlists/browse` page (if anonymous user favorites something)

---

### **Phase 7: Frontend Components**

#### 7.1 Privacy Selector Component ([src/features/setlists/components/SetlistPrivacySelector.tsx](src/features/setlists/components/SetlistPrivacySelector.tsx))

```tsx
interface Props {
  value: 'private' | 'unlisted' | 'public';
  onChange: (value: 'private' | 'unlisted' | 'public') => void;
  disabled?: boolean;
}

export function SetlistPrivacySelector({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-2">
      <Label>Privacy</Label>
      <RadioGroup value={value} onValueChange={onChange} disabled={disabled}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="private" id="private" />
          <Label htmlFor="private" className="font-normal">
            <div className="font-medium">Private</div>
            <div className="text-sm text-muted-foreground">Only you can see this setlist</div>
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="unlisted" id="unlisted" />
          <Label htmlFor="unlisted" className="font-normal">
            <div className="font-medium">Unlisted</div>
            <div className="text-sm text-muted-foreground">Anyone with the link can view</div>
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="public" id="public" />
          <Label htmlFor="public" className="font-normal">
            <div className="font-medium">Public</div>
            <div className="text-sm text-muted-foreground">Discoverable in browse and search</div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
```

#### 7.2 Share Dialog Component ([src/features/setlists/components/SetlistShareDialog.tsx](src/features/setlists/components/SetlistShareDialog.tsx))

Features:
- Show current privacy level with change button (owner only)
- Copy shareable link (for unlisted/public)
- List of shared users (owner can add/remove, editors see read-only if `canEdit === true`)
- Search users to add (email or username)
- Toggle edit/view permission per user

Pattern similar to [CollaboratorsList.tsx](src/features/collaborators/components/CollaboratorsList.tsx) but for setlists.

#### 7.3 Setlist Card Enhancements ([src/features/setlists/components/SetlistCard.tsx](src/features/setlists/components/SetlistCard.tsx))

Add:
- Privacy badge (lock icon for private, link icon for unlisted, globe for public)
- Favorite button with count
- Tags display
- "Shared with you" badge if not owner
- Attribution line if duplicated: "Duplicated from [Original]" (small, muted text)

#### 7.4 Browse Page ([src/features/setlists/pages/SetlistsBrowsePage.tsx](src/features/setlists/pages/SetlistsBrowsePage.tsx))

New route: `/setlists/browse`

Features:
- Search bar (filter by name/description/creator)
- Tag filter chips (multi-select)
- Duration slider filter
- Song count slider filter
- Sort dropdown (Popular, Recent, A-Z)
- Grid of public setlist cards
- Empty state if no results

#### 7.5 Shared With Me Section ([src/features/setlists/pages/SetlistsIndexPage.tsx](src/features/setlists/pages/SetlistsIndexPage.tsx))

Update existing page to show:
1. **My Setlists** (owned setlists)
2. **Shared With Me** (setlists others shared with user)

Use tabs or separate sections with headers.

#### 7.6 User Profile Setlists Section ([src/features/profile/pages/UserProfilePage.tsx](src/features/profile/pages/UserProfilePage.tsx))

Add section to show user's public setlists (using `api.setlists.getByCreator`).

Pattern similar to arrangements section:
- Grid of setlist cards
- Sorted by recent or popular
- Link to full setlist view

---

### **Phase 8: Offline Caching (PWA)**

#### 8.1 Service Worker Strategy

Update [vite-pwa config](vite.config.ts):
```typescript
workbox: {
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.convex\.cloud\/api\/.*\/setlists/,
      handler: 'NetworkFirst',  // Try network, fallback to cache
      options: {
        cacheName: 'setlists-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60,  // 1 day
        },
      },
    },
  ],
}
```

#### 8.2 Offline Indicator

Add indicator in [SetlistPerformancePage.tsx](src/features/setlists/pages/SetlistPerformancePage.tsx) if offline:
```tsx
{!navigator.onLine && (
  <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-sm">
    Offline mode - viewing cached version
  </div>
)}
```

---

### **Phase 9: Handle Broken References**

#### 9.1 Update `getWithArrangements` Query ([convex/setlists.ts](convex/setlists.ts))

When fetching arrangements for a setlist, check if arrangement exists and user has access:
```typescript
const arrangements = await Promise.all(
  (setlist.songs ?? []).map(async (song) => {
    const arrangement = await ctx.db.get(song.arrangementId);

    // If arrangement doesn't exist or user can't access it
    if (!arrangement) {
      return {
        arrangementId: song.arrangementId,
        customKey: song.customKey,
        unavailable: true,  // Flag as unavailable
        songTitle: "[Unavailable]",  // Placeholder
      };
    }

    // Fetch full arrangement data
    const songData = await ctx.db.get(arrangement.songId);
    return {
      arrangement,
      song: songData,
      customKey: song.customKey,
    };
  })
);
```

#### 9.2 Frontend Handling ([src/features/setlists/components/SetlistSongItem.tsx](src/features/setlists/components/SetlistSongItem.tsx))

Show placeholder UI for unavailable arrangements:
```tsx
{song.unavailable ? (
  <div className="text-muted-foreground italic">
    [Unavailable] - This arrangement has been removed or is no longer accessible
  </div>
) : (
  <Link to={`/arrangements/${song.arrangementId}`}>
    {song.songTitle}
  </Link>
)}
```

---

### **Phase 10: Type Updates**

#### 10.1 Update Frontend Types ([src/types/Database.types.ts](src/types/Database.types.ts))

```typescript
export interface Setlist {
  id: string;
  name: string;
  description?: string;
  performanceDate?: string;
  songs: SetlistSong[];
  createdAt: string;
  updatedAt: string;
  userId?: string;

  // NEW FIELDS
  privacyLevel: 'private' | 'unlisted' | 'public';
  sharedWith?: Array<{
    userId: string;
    canEdit: boolean;
    addedBy: string;
    addedAt: number;
  }>;
  tags?: string[];
  estimatedDuration?: number;  // minutes
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duplicatedFrom?: string;
  duplicatedFromName?: string;
  showAttribution: boolean;
  favorites: number;
}
```

---

## Verification & Testing

### End-to-End Test Scenarios

1. **Privacy Flow**:
   - Create private setlist → verify not visible to others
   - Change to unlisted → verify link sharing works
   - Change to public → verify appears in browse
   - Revert public to private → verify removed from browse and favorites

2. **Sharing**:
   - Share unlisted setlist with specific user (view-only)
   - User sees in "Shared With Me" section
   - Owner upgrades to edit access
   - User can now modify setlist
   - Owner removes access → verify user can no longer see it

3. **Browse & Discovery**:
   - Visit `/setlists/browse`
   - Filter by tags, duration, song count
   - Sort by popularity
   - Favorite a setlist → counter increments
   - Search by creator name

4. **Duplication**:
   - Duplicate public setlist
   - Verify new setlist is private
   - Check attribution shows "Duplicated from [Original]"
   - Toggle attribution off → verify hidden
   - Original owner makes original private → attribution link breaks gracefully

5. **User Profile**:
   - Visit `/user/:username`
   - See user's public setlists
   - Verify private setlists not shown

6. **Broken References**:
   - Add arrangement to public setlist
   - Delete arrangement
   - View setlist → shows `[Unavailable]` placeholder
   - Duplicate setlist → unavailable song included with placeholder

7. **Anonymous Users**:
   - Browse public setlists as anonymous
   - Favorite a setlist → stored locally
   - See warning about local storage
   - Sign up → verify favorites remain in local storage (migration not in scope)

8. **Offline**:
   - View setlist while online
   - Go offline
   - Refresh page → setlist loads from cache
   - See offline indicator

9. **Permissions**:
   - Shared editor tries to change privacy → blocked
   - Owner changes privacy → succeeds
   - View-only user tries to see collaborator list → sees owner only
   - Edit-access user sees full collaborator list

---

## Migration Strategy

### Data Migration

Update existing setlists in production:
```typescript
// Run once as a migration mutation
export const migrateSetlistsToPrivacy = internalMutation({
  handler: async (ctx) => {
    const setlists = await ctx.db.query("setlists").collect();

    for (const setlist of setlists) {
      if (!setlist.privacyLevel) {
        await ctx.db.patch(setlist._id, {
          privacyLevel: "private",  // Default to private for existing
          favorites: 0,
          showAttribution: false,
          tags: [],
        });
      }
    }
  },
});
```

Run via Convex dashboard after schema deployment.

---

## Open Questions & Future Enhancements

### Handled in This Plan:
✅ All user requirements addressed
✅ Privacy levels, sharing, discovery
✅ Favorites, duplication, user profiles
✅ Offline support, anonymous access
✅ Broken reference handling

### Future Considerations (Out of Scope):
- Collaborative editing (real-time)
- Comments on setlists
- Setlist versioning/history
- Email notifications when shared
- Suggested setlists (ML-based)
- Import/export setlists (PDF, text)
- Performance analytics (view counts, play counts)
- Setlist templates

---

## Summary

This implementation expands setlists from private-only to a full-featured sharing and discovery system while maintaining backward compatibility and following established patterns from songs/arrangements. The plan prioritizes mobile-first UX, offline support for worship services, and consistent user experience across the application.

**Estimated Complexity**: Large feature (touches 15+ files, backend + frontend, new pages/components)

**Key Architectural Decisions**:
- Privacy levels as enum (not boolean flags) for clarity
- Explicit sharing via `sharedWith` array (supports unlisted + private sharing)
- Denormalized favorites counter (performance optimization)
- Offline-first caching strategy (critical for worship use case)
- Anonymous favorites via localStorage (consistent with songs/arrangements)
- Owner-only privacy changes (security safeguard)
