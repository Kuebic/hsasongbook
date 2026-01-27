# Phase 7: Browse Page & Anonymous Favorites

## Goal
Create the public setlists browse page and implement anonymous favorites with localStorage.

## Prerequisites
✅ Phase 6 completed (main UI updated)

## Changes Required

### 1. Create Anonymous Favorites Hook

**Create [src/features/favorites/hooks/useAnonymousFavorites.ts](src/features/favorites/hooks/useAnonymousFavorites.ts):**

```typescript
import { useState, useEffect } from 'react';

interface AnonymousFavorite {
  targetId: string;
  targetType: 'song' | 'arrangement' | 'setlist';
  timestamp: number;
}

const STORAGE_KEY = 'anonymous-favorites';

export function useAnonymousFavorites() {
  const [favorites, setFavorites] = useState<AnonymousFavorite[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse anonymous favorites:', e);
      }
    }
  }, []);

  // Save to localStorage whenever favorites change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (
    targetId: string,
    targetType: 'song' | 'arrangement' | 'setlist'
  ) => {
    setFavorites((prev) => {
      const exists = prev.some(
        (f) => f.targetId === targetId && f.targetType === targetType
      );

      if (exists) {
        return prev.filter(
          (f) => !(f.targetId === targetId && f.targetType === targetType)
        );
      } else {
        return [...prev, { targetId, targetType, timestamp: Date.now() }];
      }
    });
  };

  const isFavorited = (
    targetId: string,
    targetType: 'song' | 'arrangement' | 'setlist'
  ): boolean => {
    return favorites.some(
      (f) => f.targetId === targetId && f.targetType === targetType
    );
  };

  const getFavoritesByType = (targetType: 'song' | 'arrangement' | 'setlist') => {
    return favorites.filter((f) => f.targetType === targetType);
  };

  return {
    favorites,
    toggleFavorite,
    isFavorited,
    getFavoritesByType,
  };
}
```

---

### 2. Create Anonymous Favorites Warning Component

**Create [src/features/favorites/components/AnonymousFavoritesWarning.tsx](src/features/favorites/components/AnonymousFavoritesWarning.tsx):**

```tsx
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAnonymousFavorites } from '../hooks/useAnonymousFavorites';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function AnonymousFavoritesWarning() {
  const { user } = useAuth();
  const { favorites } = useAnonymousFavorites();

  if (!user?.isAnonymous || favorites.length === 0) return null;

  return (
    <Alert variant="warning" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Your favorites are stored locally and won't sync across devices or
        persist if you clear your browser cache.{' '}
        <Link to="/sign-in" className="font-medium underline">
          Sign up to save them permanently.
        </Link>
      </AlertDescription>
    </Alert>
  );
}
```

---

### 3. Update SetlistFavoriteButton to Support Anonymous Users

**Update [src/features/setlists/components/SetlistFavoriteButton.tsx](src/features/setlists/components/SetlistFavoriteButton.tsx):**

```tsx
import { useAnonymousFavorites } from '@/features/favorites/hooks/useAnonymousFavorites';

export function SetlistFavoriteButton({ ... }: Props) {
  const { user } = useAuth();
  const toggleFavorite = useMutation(api.favorites.toggle);
  const { toggleFavorite: toggleAnonymousFavorite, isFavorited: isAnonymousFavorited } =
    useAnonymousFavorites();

  // For authenticated users
  const isFavoritedAuth = useQuery(
    api.favorites.isFavorited,
    user && !user.isAnonymous
      ? { targetType: "setlist", targetId: setlistId }
      : "skip"
  );

  // Determine favorite status
  const isFavorited = user?.isAnonymous
    ? isAnonymousFavorited(setlistId, 'setlist')
    : isFavoritedAuth;

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;

    if (user.isAnonymous) {
      // Handle anonymous favorites
      toggleAnonymousFavorite(setlistId, 'setlist');
    } else {
      // Handle authenticated favorites
      await toggleFavorite({
        targetType: "setlist",
        targetId: setlistId as Id<"setlists">,
      });
    }
  };

  return (
    <Button ... >
      <Heart
        className={cn(
          "h-4 w-4",
          isFavorited && "fill-current text-red-500"
        )}
      />
      {showCount && <span>{favoriteCount}</span>}
    </Button>
  );
}
```

---

### 4. Create Browse Page

**Create [src/features/setlists/pages/SetlistsBrowsePage.tsx](src/features/setlists/pages/SetlistsBrowsePage.tsx):**

```tsx
import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SetlistCard } from '@/features/setlists/components/SetlistCard';
import { AnonymousFavoritesWarning } from '@/features/favorites/components/AnonymousFavoritesWarning';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function SetlistsBrowsePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'name'>('popular');
  const [showFilters, setShowFilters] = useState(false);

  const setlists = useQuery(api.setlists.browse, {
    searchTerm: searchTerm || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    sortBy,
  });

  const availableTags = useQuery(api.setlists.getDistinctTags);
  const stats = useQuery(api.setlists.getBrowseStats);

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Browse Setlists</h1>
        {stats && (
          <p className="text-muted-foreground">
            {stats.totalPublicSetlists} public setlists •{' '}
            {stats.totalSongs} total songs •{' '}
            {stats.totalFavorites} favorites
          </p>
        )}
      </div>

      {/* Anonymous warning */}
      <AnonymousFavoritesWarning />

      {/* Search & Sort */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search setlists by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="name">A-Z</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Tags</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags?.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleToggleTag(tag)}
                  >
                    {tag}
                    {selectedTags.includes(tag) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* TODO: Add duration and song count sliders in future */}
          </div>
        </div>
      )}

      {/* Active Filters */}
      {selectedTags.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button onClick={() => handleToggleTag(tag)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTags([])}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Results */}
      {setlists === undefined ? (
        <div>Loading...</div>
      ) : setlists.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No setlists found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {setlists.map((setlist) => (
            <SetlistCard key={setlist._id} setlist={setlist} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 5. Add Browse Route

**Update [src/App.tsx](src/App.tsx) or routing file:**

```tsx
import { SetlistsBrowsePage } from '@/features/setlists/pages/SetlistsBrowsePage';

// Add route:
<Route path="/setlists/browse" element={<SetlistsBrowsePage />} />
```

---

### 6. Add Navigation Link

**Update navigation (e.g., header or sidebar):**

```tsx
<NavLink to="/setlists/browse">Browse Setlists</NavLink>
```

---

## Testing Steps

1. **Anonymous Favorites:**
   - Browse setlists as anonymous user
   - Favorite a setlist → stored in localStorage
   - See warning banner
   - Refresh page → favorites persist
   - Clear localStorage → favorites disappear

2. **Browse Page:**
   - Search by name → filters correctly
   - Select tags → filters by tags
   - Change sort order → reorders results
   - Clear filters → shows all results

3. **Public Setlists:**
   - Create public setlist with tags
   - Verify appears in browse
   - Change to private → disappears from browse

4. **Favorite Counts:**
   - Favorite setlist → count increments on card
   - Unfavorite → count decrements

---

## Dependencies
- Phase 6 (main UI components)

## Next Phase
Phase 8: Share Dialog & User Profiles
