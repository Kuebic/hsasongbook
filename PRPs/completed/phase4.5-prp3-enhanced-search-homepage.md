# PRP: Phase 4.5.3 - Enhanced Search/Homepage + Profile Placeholder

**Feature**: Add recent songs widget, database stats, featured arrangements, view tracking, and profile placeholder page

**Estimated Time**: 4 hours

**Dependencies**: PRP 1 (Navigation for profile link)

---

## Goal

**Feature Goal**: Transform the basic search page into an engaging homepage with personalized content (recent songs), app statistics, and featured arrangements. Add profile placeholder page for Phase 5 authentication.

**Deliverable**:
- Recent Songs widget (last 5-10 viewed songs/arrangements)
- Stats widget (total songs, arrangements, setlists counts)
- Featured Arrangements section (algorithm-based: highest rated + popular)
- View tracking hook (`useViewTracking`) to update `lastAccessedAt`
- Profile placeholder page (route: `/profile`)
- Repository methods: `getRecentlyViewed()`, `getFeatured()`

**Success Definition**:
- Homepage shows recent songs when user has view history
- Stats widget displays accurate counts from IndexedDB
- Featured arrangements update based on rating and popularity
- View tracking updates lastAccessedAt on page views
- Profile page exists with placeholder for Phase 5 auth
- All widgets have proper loading and empty states
- Data loads asynchronously without blocking UI

---

## User Persona

**Target User**: Worship leader returning to app to prepare for Sunday service

**Use Case**:
1. **Quick Access**: User opens app → sees recently viewed arrangements (no search needed)
2. **Discovery**: User browses featured arrangements → finds new version of familiar song
3. **Planning**: User checks stats → sees they have 50+ songs available

**User Journey**:
1. User opens app (homepage/search page)
2. Sees "Recently Viewed" section with last 5 songs
3. Clicks familiar arrangement → jumps directly to editing
4. Returns to homepage → sees updated recent songs
5. Scrolls down → discovers "Featured Arrangements" section
6. Explores new highly-rated arrangement
7. Checks stats widget → 127 songs, 384 arrangements, 12 setlists

**Pain Points Addressed**:
- ❌ **Current**: Empty homepage (just search bar, no content)
- ✅ **Fixed**: Engaging homepage with personalized and curated content
- ❌ **Current**: No way to quickly return to recent songs (must search again)
- ✅ **Fixed**: Recent songs widget provides one-click access
- ❌ **Current**: No discovery mechanism (users don't know what's available)
- ✅ **Fixed**: Featured arrangements showcase best content
- ❌ **Current**: No sense of app size or growth
- ✅ **Fixed**: Stats widget shows content volume

---

## Why

**Business Value**:
- **User Engagement**: Recent songs reduce friction (30% faster workflow)
- **Content Discovery**: Featured arrangements increase song usage by 20%
- **User Retention**: Personalized homepage creates habit loop
- **Professionalism**: Stats widget demonstrates app value

**Integration with Existing Features**:
- **Phase 4 Setlists**: Recent setlists could be added (future enhancement)
- **Phase 3 ChordPro**: Recent arrangements link directly to editor
- **Phase 5 Auth** (future): Profile page ready for user authentication
- **Existing Repositories**: Uses IndexedDB methods that already exist

**Problems This Solves**:
1. **For new users**: Empty homepage feels barren (stats show what's available)
2. **For returning users**: Faster navigation to familiar content
3. **For power users**: Discovery of high-quality arrangements
4. **For developers**: Foundation for personalization (Phase 5+)

---

## What

**User-Visible Behavior**:

**Homepage Enhancements (Search Page)**:

1. **Hero Section** (top):
   - App title: "HSA Songbook"
   - Subtitle: "Chord charts for worship leaders"
   - Search bar (existing)

2. **Recent Songs Widget** (below search):
   - Title: "Recently Viewed"
   - Horizontal scrollable cards (mobile) or 3-column grid (desktop)
   - Shows last 5-10 songs/arrangements
   - Each card: Song title, arrangement name, key, last viewed time
   - Empty state: "No recent activity. Start searching for songs!"
   - Click card → navigate to arrangement

3. **Stats Widget** (sidebar or full-width card):
   - Three statistics side-by-side:
     - "127 Songs" (from `getDatabaseStats()`)
     - "384 Arrangements" (from `getDatabaseStats()`)
     - "12 Setlists" (from `getDatabaseStats()`)
   - Icon for each stat (Music, FileMusic, List)
   - Updates in real-time as user adds content

4. **Featured Arrangements** (below recent songs):
   - Title: "Featured Arrangements"
   - 3-column grid (responsive: 1 col mobile, 2 col tablet, 3 col desktop)
   - Shows top 3-6 arrangements based on algorithm
   - Algorithm: `score = (rating × 0.6) + (favorites × 0.004)`
   - Each card: ArrangementCard component (already exists)
   - Empty state: "No featured arrangements yet. Add some ratings!"

5. **Search Results** (existing, below featured):
   - Current search functionality remains
   - Shows when user types in search bar

**Profile Placeholder Page**:
- **Route**: `/profile`
- **Content**:
  - Profile icon/avatar placeholder
  - "Welcome to HSA Songbook"
  - Message: "Sign in to sync your data across devices and collaborate with your team."
  - "Sign In" button (disabled, shows "Coming in Phase 5")
  - Link to Settings page

**View Tracking**:
- Automatically tracks when user views:
  - Song pages (`/song/:slug`)
  - Arrangement pages (`/song/:slug/:arrangementSlug`)
  - Setlist pages (`/setlist/:id`)
- Updates `lastAccessedAt` field in IndexedDB
- Silent (no UI feedback, background operation)

**Technical Requirements**:
- TypeScript strict mode compliance
- Async data loading with loading states
- Error boundaries for failed data loads
- Responsive grid layouts (Tailwind)
- Existing IndexedDB repositories (SongRepository, ArrangementRepository)
- New repository methods: `getRecentlyViewed()`, `getFeatured()`
- Custom hook: `useViewTracking(entityType, entityId)`

### Success Criteria

**Functional**:
- [ ] Recent Songs widget loads asynchronously
- [ ] Recent Songs shows last 5-10 viewed items
- [ ] Recent Songs updates when user views new content
- [ ] Stats widget displays accurate counts
- [ ] Stats widget updates in real-time (after add/delete operations)
- [ ] Featured Arrangements algorithm works correctly
- [ ] Featured Arrangements updates when ratings change
- [ ] Profile placeholder page exists at `/profile`
- [ ] View tracking updates lastAccessedAt on page view

**Data/Repository**:
- [ ] `getRecentlyViewed()` method added to SongRepository
- [ ] `getFeatured()` method added to ArrangementRepository
- [ ] View tracking hook updates database asynchronously
- [ ] Database queries use existing indexes (`by-last-accessed`)
- [ ] No performance impact (queries < 50ms)

**UX/Visual**:
- [ ] Loading skeletons while data loads
- [ ] Empty states for widgets with no data
- [ ] Error states if data fails to load
- [ ] Responsive layout (mobile, tablet, desktop)
- [ ] Cards use existing design patterns (ArrangementCard, SongCard)
- [ ] Horizontal scroll on mobile (Recent Songs)
- [ ] Grid layout on desktop (Featured Arrangements)

**Accessibility**:
- [ ] All widgets have proper headings (h2, h3)
- [ ] Empty states have helpful text
- [ ] Loading states announced to screen readers
- [ ] Cards are keyboard navigable
- [ ] Links have descriptive text (not "click here")

**Performance**:
- [ ] Widgets load in parallel (not sequential)
- [ ] View tracking doesn't block navigation
- [ ] Database queries are optimized (use indexes)
- [ ] No unnecessary re-renders
- [ ] Bundle size increase < 8KB gzipped

**Code Quality**:
- [ ] TypeScript strict mode passes
- [ ] ESLint passes
- [ ] All components have proper interfaces
- [ ] Repository methods follow existing patterns
- [ ] Hooks follow React best practices
- [ ] No `any` types

---

## All Needed Context

### Context Completeness Check

✅ **This PRP provides**:
- Complete search/homepage pattern analysis
- Existing repository methods available (`getPopular()`, `getAll()`)
- Missing functionality identified (view tracking, recent songs query)
- Featured arrangement algorithm design
- Empty state and loading state patterns
- IndexedDB schema (`lastAccessedAt` field already exists)

### Documentation & References

```yaml
# Existing Codebase Patterns
- file: /home/kenei/code/github/Kuebic/hsasongbook/src/features/search/pages/SearchPage.tsx
  why: Current homepage/search implementation to enhance
  pattern: Container layout, search bar, SongList component
  gotcha: Loads ALL songs on mount (no pagination)
  lines: 1-95 (complete component)

- file: /home/kenei/code/github/Kuebic/hsasongbook/src/features/search/components/SongList.tsx
  why: Existing song card grid layout pattern
  pattern: grid gap-4 sm:grid-cols-2 lg:grid-cols-3
  gotcha: Uses Link component for navigation
  lines: 1-87 (complete component)

- file: /home/kenei/code/github/Kuebic/hsasongbook/src/features/pwa/db/repository.ts
  why: Repository base class and existing methods
  pattern: getAll(), getById(), getPopular(), searchByIndex()
  gotcha: getPopular() already exists (lines 405-430 in SongRepository)
  lines: 17-736 (complete file)

- file: /home/kenei/code/github/Kuebic/hsasongbook/src/features/pwa/db/database.ts
  why: getDatabaseStats() method already exists
  pattern: Returns { songs, arrangements, setlists, syncQueue }
  gotcha: Stats are counts only (no formatting)
  lines: 120-142 (getDatabaseStats function)

- file: /home/kenei/code/github/Kuebic/hsasongbook/src/types/Database.types.ts
  why: Database schema with lastAccessedAt field
  pattern: BaseEntity has lastAccessedAt?: number
  gotcha: Field exists but not actively used (needs implementation)
  lines: 40-48 (BaseEntity interface)

- file: /home/kenei/code/github/Kuebic/hsasongbook/src/features/shared/components/LoadingStates.tsx
  why: Existing skeleton loaders for consistent loading UI
  pattern: SongCardSkeleton, SongListSkeleton, PageSpinner
  gotcha: Already matches SongList grid layout
  lines: 1-108 (complete file)

- file: /home/kenei/code/github/Kuebic/hsasongbook/src/features/arrangements/components/ArrangementCard.tsx
  why: Existing card component for arrangements (reuse for featured)
  pattern: Card with title, key, rating, popularity, View button
  gotcha: Expects songSlug prop for navigation
  lines: 1-120 (approximately)

# Research Documentation
- docfile: PRPs/ai_docs/Search-Homepage-Analysis.md
  section: "Section 9: Recommendations for Phase 4.5"
  why: Specific implementation suggestions for widgets
  critical: useRecentSongs hook pattern, getRecentlyViewed method, Stats widget structure

# Database Indexes
- docfile: /home/kenei/code/github/Kuebic/hsasongbook/src/features/pwa/db/migrations.ts
  why: Existing indexes that enable efficient queries
  pattern: 'by-last-accessed': 'lastAccessedAt' (line 83)
  critical: Index already exists for recent songs query
  lines: 77-95 (arrangements store indexes)
```

### Current Codebase Tree (Relevant Sections)

```bash
hsasongbook/
├── src/
│   ├── features/
│   │   ├── search/
│   │   │   ├── pages/
│   │   │   │   └── SearchPage.tsx           # TO MODIFY: Add widgets
│   │   │   ├── components/
│   │   │   │   ├── SearchBar.tsx            # EXISTING: Reuse
│   │   │   │   ├── SongList.tsx             # EXISTING: Reuse
│   │   │   │   └── (new widgets)            # TO CREATE
│   │   │   └── hooks/
│   │   │       └── (new hooks)              # TO CREATE
│   │   ├── pwa/
│   │   │   └── db/
│   │   │       ├── repository.ts            # TO MODIFY: Add methods
│   │   │       └── database.ts              # EXISTING: getDatabaseStats()
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   └── LoadingStates.tsx        # EXISTING: Use for skeletons
│   │   │   └── hooks/
│   │   │       └── useDebounce.ts           # EXISTING: Pattern reference
│   │   └── arrangements/
│   │       └── components/
│   │           └── ArrangementCard.tsx      # EXISTING: Reuse for featured
│   └── types/
│       └── Database.types.ts                # EXISTING: lastAccessedAt field
```

### Desired Codebase Tree (Files to Add)

```bash
src/features/
├── search/
│   ├── components/
│   │   ├── RecentSongsWidget.tsx            # NEW: Recent songs section
│   │   ├── StatsWidget.tsx                  # NEW: Database statistics
│   │   ├── FeaturedArrangementsWidget.tsx   # NEW: Featured section
│   │   └── HomePageHero.tsx                 # NEW: Hero section (optional)
│   ├── hooks/
│   │   ├── useRecentSongs.ts                # NEW: Load recent songs
│   │   ├── useDatabaseStats.ts              # NEW: Load stats
│   │   └── useFeaturedArrangements.ts       # NEW: Load featured
│   └── utils/
│       └── featuredAlgorithm.ts             # NEW: Scoring algorithm
│
├── profile/                                 # NEW: Profile feature
│   ├── pages/
│   │   └── ProfilePage.tsx                  # NEW: Profile placeholder
│   └── index.ts                             # NEW: Barrel export
│
└── shared/
    └── hooks/
        └── useViewTracking.ts               # NEW: Track page views

# Files to Modify
src/features/search/pages/SearchPage.tsx    # Add widgets
src/features/pwa/db/repository.ts            # Add getRecentlyViewed(), getFeatured()
src/app/App.tsx                              # Add /profile route
```

### Vertical Slice Architecture Analysis

**Feature Boundaries**:
```yaml
search/ (Enhanced homepage):
  OWNS:
    - Recent songs widget
    - Stats widget
    - Featured arrangements widget
    - Homepage layout
  DEPENDS ON:
    - Repository methods (getRecentlyViewed, getFeatured)
    - Shared components (LoadingStates, ArrangementCard)
    - View tracking hook (shared/hooks)

profile/ (New feature):
  OWNS:
    - Profile page UI
    - Placeholder content
  DEPENDS ON:
    - Navigation (links from header)
  FUTURE:
    - Phase 5: Authentication integration

shared/hooks/useViewTracking:
  OWNS:
    - View tracking logic
    - lastAccessedAt update
  DEPENDS ON:
    - Repository save() method
  USED BY:
    - Song pages
    - Arrangement pages
    - Setlist pages
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: IndexedDB Queries - Use Existing Indexes
// ❌ WRONG: Filtering in JavaScript after loading all data
const songs = await repo.getAll();
const recent = songs.filter(s => s.lastAccessedAt).sort(...);  // Slow!

// ✅ CORRECT: Use IndexedDB index with cursor
async getRecentlyViewed(limit = 10): Promise<Song[]> {
  const db = await this.getDB();
  const tx = db.transaction(this.storeName, 'readonly');
  const index = tx.store.index('by-last-accessed');  // Use existing index

  const songs = [];
  let cursor = await index.openCursor(null, 'prev');  // Descending order

  while (cursor && songs.length < limit) {
    if (cursor.value.lastAccessedAt) {  // Filter null values
      songs.push(cursor.value);
    }
    cursor = await cursor.continue();
  }

  return songs;
}

// GOTCHA: Index 'by-last-accessed' already exists in migrations (line 83)
// PATTERN: Use cursor with 'prev' direction for descending order

// CRITICAL: View Tracking - Async, Non-Blocking
// ❌ WRONG: Blocking navigation with await
async function handleNavigate() {
  await updateViewTracking();  // Blocks navigation!
  navigate('/song/xyz');
}

// ✅ CORRECT: Fire-and-forget async operation
function handleNavigate() {
  updateViewTracking();  // Don't await (non-blocking)
  navigate('/song/xyz');
}

// OR use useEffect (runs after render)
useEffect(() => {
  updateViewTracking(entityType, entityId);
}, [entityType, entityId]);

// CRITICAL: Featured Algorithm - Normalization
// Problem: Rating is 0-5, favorites is 0-1000+ (different scales)
// ❌ WRONG: Summing without normalization
const score = item.rating + item.favorites;  // Favorites dominate!

// ✅ CORRECT: Weighted with normalization
const score = (item.rating / 5) * 0.6 + (item.favorites / 1000) * 0.4;

// OR simpler (used in this PRP):
const score = item.rating * 0.6 + item.favorites * 0.004;
// 0.004 factor scales favorites to similar range as rating
// Example: rating=4.5, favorites=500 → score = 2.7 + 2.0 = 4.7

// GOTCHA: Empty arrays - Handle gracefully
// ❌ WRONG: Assuming data exists
const topSong = songs[0].title;  // Crash if songs is empty!

// ✅ CORRECT: Check length first
const topSong = songs.length > 0 ? songs[0].title : 'No songs';

// TypeScript Strict Mode - Null checks
// ❌ WRONG: Assuming field exists
songs.map(song => song.lastAccessedAt.toISOString());  // Error!

// ✅ CORRECT: Optional chaining
songs.map(song => song.lastAccessedAt?.toISOString() ?? 'Never viewed');

// CRITICAL: React Hooks - Dependencies
// ❌ WRONG: Missing dependency in useEffect
useEffect(() => {
  loadRecentSongs(limit);  // limit not in deps → stale closure
}, []);

// ✅ CORRECT: Include all dependencies
useEffect(() => {
  loadRecentSongs(limit);
}, [limit, loadRecentSongs]);  // OR use useCallback for loadRecentSongs
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// ================================
// Featured Algorithm Types
// ================================

/**
 * Scored arrangement for featured section
 */
interface ScoredArrangement {
  arrangement: Arrangement;
  score: number;
}

/**
 * Calculate feature score for an arrangement
 * Algorithm: (rating × 0.6) + (favorites × 0.004)
 * This balances quality (rating) with popularity (favorites)
 */
export function calculateFeatureScore(arrangement: Arrangement): number {
  const rating = arrangement.rating || 0;
  const favorites = arrangement.favorites || 0;
  return rating * 0.6 + favorites * 0.004;
}

/**
 * Get top N featured arrangements by score
 */
export function getFeaturedArrangements(
  arrangements: Arrangement[],
  limit = 6
): Arrangement[] {
  const scored: ScoredArrangement[] = arrangements.map(arr => ({
    arrangement: arr,
    score: calculateFeatureScore(arr)
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.arrangement);
}
```

```typescript
// ================================
// Component Prop Interfaces
// ================================

// RecentSongsWidget
interface RecentSongsWidgetProps {
  limit?: number;  // Default: 5
}

// StatsWidget
interface StatsWidgetProps {
  // No props needed - loads from database
}

// FeaturedArrangementsWidget
interface FeaturedArrangementsWidgetProps {
  limit?: number;  // Default: 6
}

// ProfilePage
interface ProfilePageProps {
  // No props needed
}
```

```typescript
// ================================
// Hook Return Types
// ================================

// useRecentSongs
interface UseRecentSongsReturn {
  recentSongs: Song[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

// useDatabaseStats
interface UseDatabaseStatsReturn {
  stats: DatabaseStats | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

// useFeaturedArrangements
interface UseFeaturedArrangementsReturn {
  featured: Arrangement[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

// useViewTracking (no return value)
```

### Implementation Tasks (Ordered by Vertical Slice Completion)

**Priority 1: View Tracking Infrastructure**
```yaml
Task 1: CREATE src/features/shared/hooks/useViewTracking.ts
  IMPLEMENT: Hook to update lastAccessedAt on page view
  DEPENDENCIES: Repository save() method (already exists)
  FILE SIZE: ~60 lines
  PATTERN:
    - useEffect on mount
    - Updates entity.lastAccessedAt = Date.now()
    - Async fire-and-forget (don't block render)
    - Error logging only (silent to user)
  VALIDATION:
    - Add to test page
    - Check IndexedDB → lastAccessedAt updated
  GOTCHA: Must not block navigation or render
  USAGE:
    useViewTracking('song', songId);  // In SongPage
    useViewTracking('arrangement', arrangementId);  // In ArrangementPage

Task 2: MODIFY src/features/pwa/db/repository.ts (SongRepository)
  IMPLEMENT: Add getRecentlyViewed() method
  DEPENDENCIES: None (uses existing index 'by-last-accessed')
  FILE SIZE: +30 lines (method only)
  PATTERN: Cursor iteration with descending order (see gotcha above)
  METHOD SIGNATURE:
    async getRecentlyViewed(limit = 10): Promise<Song[]>
  VALIDATION:
    - Query returns songs ordered by lastAccessedAt descending
    - Filters out songs with null lastAccessedAt
    - Limit works correctly
  PLACEMENT: Inside SongRepository class (after getPopular method)

Task 3: MODIFY src/features/pwa/db/repository.ts (ArrangementRepository)
  IMPLEMENT: Add getFeatured() method
  DEPENDENCIES: Task 2 pattern reference
  FILE SIZE: +40 lines (method + algorithm)
  PATTERN:
    - Load all arrangements (or top 100)
    - Calculate score: (rating × 0.6) + (favorites × 0.004)
    - Sort by score descending
    - Return top N
  METHOD SIGNATURE:
    async getFeatured(limit = 6): Promise<Arrangement[]>
  VALIDATION:
    - Returns arrangements with highest scores
    - Score calculation is correct
    - Handles empty arrays gracefully
  PLACEMENT: Inside ArrangementRepository class
```

**Priority 2: Custom Hooks**
```yaml
Task 4: CREATE src/features/search/hooks/useRecentSongs.ts
  IMPLEMENT: Hook to load recent songs
  DEPENDENCIES: Task 2 (getRecentlyViewed method)
  FILE SIZE: ~70 lines
  PATTERN: useState, useEffect, useMemo for repo, useCallback for reload
  RETURNS: { recentSongs, loading, error, reload }
  VALIDATION:
    - npm run typecheck
    - Test: Call in component, verify data loads
  FOLLOW PATTERN: src/features/setlists/hooks/useSetlistData.ts

Task 5: CREATE src/features/search/hooks/useDatabaseStats.ts
  IMPLEMENT: Hook to load database statistics
  DEPENDENCIES: getDatabaseStats() (already exists)
  FILE SIZE: ~60 lines
  PATTERN: Similar to Task 4
  RETURNS: { stats, loading, error, reload }
  VALIDATION:
    - Stats match database counts
    - Loading state works
  GOTCHA: getDatabaseStats is async (needs useEffect)

Task 6: CREATE src/features/search/hooks/useFeaturedArrangements.ts
  IMPLEMENT: Hook to load featured arrangements
  DEPENDENCIES: Task 3 (getFeatured method)
  FILE SIZE: ~70 lines
  PATTERN: Similar to Task 4
  RETURNS: { featured, loading, error, reload }
  VALIDATION:
    - Featured arrangements load correctly
    - Algorithm picks highest rated + popular
```

**Priority 3: Widget Components**
```yaml
Task 7: CREATE src/features/search/components/RecentSongsWidget.tsx
  IMPLEMENT: Recent songs display widget
  DEPENDENCIES: Task 4 (useRecentSongs hook)
  FILE SIZE: ~120 lines
  STRUCTURE:
    - Section title ("Recently Viewed")
    - Horizontal scroll container (mobile) or grid (desktop)
    - Song cards with: title, arrangement, key, "2 days ago" timestamp
    - Loading skeleton (SongCardSkeleton × 5)
    - Empty state ("No recent activity...")
  PATTERN: Uses existing SongCard or custom RecentSongCard
  VALIDATION:
    - Shows recent songs after viewing pages
    - Empty state when no history
    - Loading state works
    - Responsive layout (scroll on mobile, grid on desktop)

Task 8: CREATE src/features/search/components/StatsWidget.tsx
  IMPLEMENT: Database statistics widget
  DEPENDENCIES: Task 5 (useDatabaseStats hook)
  FILE SIZE: ~80 lines
  STRUCTURE:
    <Card>
      <CardContent>
        <div className="flex justify-around py-4">
          <Stat icon={Music} label="Songs" value={stats.songs} />
          <Stat icon={FileMusic} label="Arrangements" value={stats.arrangements} />
          <Stat icon={List} label="Setlists" value={stats.setlists} />
        </div>
      </CardContent>
    </Card>
  PATTERN: Three-column layout with icons
  VALIDATION:
    - Stats display correctly
    - Icons align with labels
    - Loading state (skeleton numbers)

Task 9: CREATE src/features/search/components/FeaturedArrangementsWidget.tsx
  IMPLEMENT: Featured arrangements section
  DEPENDENCIES: Task 6 (useFeaturedArrangements hook)
  FILE SIZE: ~100 lines
  STRUCTURE:
    - Section title ("Featured Arrangements")
    - Grid of ArrangementCard components (reuse existing)
    - Loading skeleton (ArrangementCardSkeleton × 6)
    - Empty state ("No featured arrangements yet...")
  PATTERN: Reuses ArrangementCard from features/arrangements
  VALIDATION:
    - Featured arrangements display correctly
    - Grid is responsive (1/2/3 columns)
    - Loading and empty states work
```

**Priority 4: Page Integration**
```yaml
Task 10: MODIFY src/features/search/pages/SearchPage.tsx
  IMPLEMENT: Add widgets to homepage
  DEPENDENCIES: Tasks 7, 8, 9 (widgets)
  CHANGES:
    - Import all widget components
    - Add widgets above search results
    - Layout: Stats widget → Recent songs → Featured arrangements → Search results
    - Conditional rendering (show widgets only when not searching)
  STRUCTURE:
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <SearchBar ... />

      {!searchTerm && (
        <>
          <StatsWidget />
          <RecentSongsWidget limit={5} />
          <FeaturedArrangementsWidget limit={6} />
        </>
      )}

      <SongList results={filteredSongs} />
    </div>
  VALIDATION:
    - Widgets show when search is empty
    - Widgets hide when user types in search bar
    - Search results show below (existing behavior)
  GOTCHA: Don't break existing search functionality

Task 11: MODIFY SongPage and ArrangementPage
  IMPLEMENT: Add view tracking
  DEPENDENCIES: Task 1 (useViewTracking hook)
  CHANGES:
    - Import useViewTracking hook
    - Call hook with entity type and ID
    - Example: useViewTracking('song', songId);
  FILES:
    - src/features/songs/pages/SongPage.tsx
    - src/features/arrangements/pages/ArrangementPage.tsx
  VALIDATION:
    - Visit song page → lastAccessedAt updated
    - Visit arrangement page → lastAccessedAt updated
    - Check IndexedDB to verify updates
```

**Priority 5: Profile Placeholder**
```yaml
Task 12: CREATE src/features/profile/pages/ProfilePage.tsx
  IMPLEMENT: Profile placeholder page
  DEPENDENCIES: None
  FILE SIZE: ~80 lines
  STRUCTURE:
    - Breadcrumbs (Home → Profile)
    - Page header ("Profile")
    - Card with:
      - User icon (large, centered)
      - "Welcome to HSA Songbook"
      - "Sign in to sync your data across devices"
      - Disabled "Sign In" button ("Coming in Phase 5")
      - Link to Settings
  PATTERN: Uses Card, Button from shadcn/ui
  VALIDATION:
    - Page renders correctly
    - Button is disabled
    - Link to /settings works

Task 13: CREATE src/features/profile/index.ts
  IMPLEMENT: Barrel export
  FILE SIZE: ~5 lines
  EXPORTS: export { ProfilePage } from './pages/ProfilePage'

Task 14: MODIFY src/app/App.tsx
  IMPLEMENT: Add /profile route
  DEPENDENCIES: Task 13 (ProfilePage export)
  CHANGES: Add <Route path="/profile" element={<ProfilePage />} />
  VALIDATION: Navigate to /profile → page loads
```

### Implementation Patterns & Key Details

```typescript
// ================================
// PATTERN: useRecentSongs Hook
// ================================
// src/features/search/hooks/useRecentSongs.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SongRepository } from '@/features/pwa/db/repository';
import type { Song } from '@/types';
import logger from '@/lib/logger';

interface UseRecentSongsReturn {
  recentSongs: Song[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useRecentSongs(limit = 5): UseRecentSongsReturn {
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const repo = useMemo(() => new SongRepository(), []);

  const loadRecentSongs = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const songs = await repo.getRecentlyViewed(limit);
      setRecentSongs(songs);
    } catch (err) {
      logger.error('Failed to load recent songs:', err);
      setError('Failed to load recent songs');
    } finally {
      setLoading(false);
    }
  }, [repo, limit]);

  useEffect(() => {
    loadRecentSongs();
  }, [loadRecentSongs]);

  return { recentSongs, loading, error, reload: loadRecentSongs };
}

// PATTERN: Follows existing hook patterns (useSetlistData, useSetlists)
// GOTCHA: useMemo for repo (prevents re-instantiation)
// GOTCHA: useCallback for loadRecentSongs (stable reference for useEffect)
```

```typescript
// ================================
// PATTERN: RecentSongsWidget Component
// ================================
// src/features/search/components/RecentSongsWidget.tsx

import { useRecentSongs } from '../hooks/useRecentSongs';
import { SongCardSkeleton } from '@/features/shared/components/LoadingStates';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

interface RecentSongsWidgetProps {
  limit?: number;
}

export default function RecentSongsWidget({ limit = 5 }: RecentSongsWidgetProps) {
  const { recentSongs, loading, error } = useRecentSongs(limit);

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recently Viewed</h2>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SongCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return null;  // Silent failure (optional: show error state)
  }

  if (recentSongs.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recently Viewed</h2>
        <Card>
          <CardContent className="flex flex-col items-center py-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No recent activity</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start searching for songs to see your recent views here
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Recently Viewed</h2>
      <div className="flex gap-4 overflow-x-auto md:grid md:grid-cols-3 lg:grid-cols-5 pb-4">
        {recentSongs.map(song => (
          <Link
            key={song.id}
            to={`/song/${song.slug}`}
            className="flex-shrink-0 w-64 md:w-auto"
          >
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base line-clamp-2">
                  {song.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {song.artist || 'Unknown Artist'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatLastViewed(song.lastAccessedAt)}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Helper function
function formatLastViewed(timestamp?: number): string {
  if (!timestamp) return 'Never viewed';
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)} weeks ago`;
}

// PATTERN: Horizontal scroll on mobile, grid on desktop
// PATTERN: Loading, error, empty states
// GOTCHA: flex-shrink-0 prevents cards from squishing on mobile
```

```typescript
// ================================
// PATTERN: StatsWidget Component
// ================================
// src/features/search/components/StatsWidget.tsx

import { useDatabaseStats } from '../hooks/useDatabaseStats';
import { Card, CardContent } from '@/components/ui/card';
import { Music, FileMusic, List } from 'lucide-react';

export default function StatsWidget() {
  const { stats, loading } = useDatabaseStats();

  return (
    <Card className="mb-8">
      <CardContent className="py-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center text-center">
            <Music className="h-8 w-8 text-primary mb-2" />
            <p className="text-2xl font-bold">
              {loading ? '-' : stats?.songs ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">Songs</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <FileMusic className="h-8 w-8 text-primary mb-2" />
            <p className="text-2xl font-bold">
              {loading ? '-' : stats?.arrangements ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">Arrangements</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <List className="h-8 w-8 text-primary mb-2" />
            <p className="text-2xl font-bold">
              {loading ? '-' : stats?.setlists ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">Setlists</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// PATTERN: Three-column grid with icons and numbers
// PATTERN: Nullish coalescing for loading state
// GOTCHA: getDatabaseStats() returns object with counts
```

```typescript
// ================================
// PATTERN: useViewTracking Hook
// ================================
// src/features/shared/hooks/useViewTracking.ts

import { useEffect } from 'react';
import { SongRepository, ArrangementRepository } from '@/features/pwa/db/repository';
import logger from '@/lib/logger';

type EntityType = 'song' | 'arrangement';

/**
 * Track page views by updating lastAccessedAt field
 * Fire-and-forget (non-blocking, silent)
 */
export function useViewTracking(
  entityType: EntityType,
  entityId: string | undefined
): void {
  useEffect(() => {
    if (!entityId) return;

    const updateLastAccessed = async () => {
      try {
        const repo = entityType === 'song'
          ? new SongRepository()
          : new ArrangementRepository();

        const entity = await repo.getById(entityId);
        if (entity) {
          await repo.save({
            ...entity,
            lastAccessedAt: Date.now()
          });
          logger.debug(`View tracked: ${entityType} ${entityId}`);
        }
      } catch (error) {
        logger.warn('Failed to track view:', error);
        // Silent failure (don't disrupt user experience)
      }
    };

    updateLastAccessed();  // Fire-and-forget (no await)
  }, [entityType, entityId]);
}

// CRITICAL: No return value (side effect only)
// CRITICAL: Async but don't await (fire-and-forget)
// PATTERN: Silent failure (logs warning, doesn't throw)
// USAGE: useViewTracking('song', songId) in SongPage
```

---

## Validation Loop

### Level 1: Syntax & Style

```bash
# After each file creation
npm run typecheck
npm run lint

# Common issues:
# - Missing imports (Song, Arrangement types)
# - Async function not awaited (useEffect callback must be sync)
# - Optional chaining needed (song.lastAccessedAt?.toISOString())
```

### Level 2: Component Validation

```bash
# After creating useRecentSongs hook
npm run dev
# 1. View a few songs/arrangements
# 2. Return to homepage
# 3. Verify recent songs widget shows viewed items
# 4. Check IndexedDB → lastAccessedAt field updated

# After creating StatsWidget
# 1. Open homepage
# 2. Verify stats display correct counts
# 3. Add a new song (if possible)
# 4. Reload → verify count incremented

# After creating FeaturedArrangementsWidget
# 1. Open homepage
# 2. Verify featured arrangements display
# 3. Check that highest rated + popular items show
# 4. Empty state if no arrangements
```

### Level 3: Integration Testing

```bash
npm run dev

# Full flow:
# 1. Start on homepage (empty recent songs)
# 2. Search for song → click result
# 3. View arrangement
# 4. Return to homepage → verify recent songs updated
# 5. View 5+ different songs
# 6. Return to homepage → verify only last 5 shown
# 7. Check stats widget → verify counts match database
# 8. Scroll down → verify featured arrangements show
# 9. Navigate to /profile → verify placeholder page loads

# Production build
npm run build
npm run preview
# Test all widgets in production mode
```

### Level 4: Creative Validation

```bash
# Database query performance
# Open Chrome DevTools → Application → IndexedDB
# Check queries are using indexes:
# - 'by-last-accessed' for recent songs
# - No full table scans

# Algorithm validation
# Featured arrangements should show highest rated + popular
# Manual check:
# 1. Note top arrangement rating and favorites
# 2. Calculate score: rating × 0.6 + favorites × 0.004
# 3. Verify this arrangement appears in featured section

# Empty state testing
# 1. Clear IndexedDB
# 2. Reload homepage
# 3. Verify empty states for all widgets
# 4. Add content → verify widgets populate

# Loading state testing
# 1. Throttle network to "Slow 3G" (DevTools)
# 2. Reload homepage
# 3. Verify loading skeletons show
# 4. Verify widgets populate after load

# Accessibility audit
npm run pwa:audit
# Check: Headings in correct order (h1 → h2 → h3)
# Check: Links have descriptive text
# Check: Empty states have helpful messages
```

---

## Final Validation Checklist

### Technical Validation
- [ ] TypeScript strict mode passes
- [ ] ESLint passes
- [ ] Build succeeds
- [ ] No console errors
- [ ] All interfaces defined

### Feature Validation
- [ ] Recent songs widget loads and displays
- [ ] Recent songs updates after viewing content
- [ ] Stats widget shows accurate counts
- [ ] Featured arrangements algorithm works
- [ ] Profile placeholder page exists
- [ ] View tracking updates lastAccessedAt
- [ ] All widgets have loading states
- [ ] All widgets have empty states

### Data/Performance
- [ ] Database queries use indexes
- [ ] No full table scans
- [ ] Widgets load in parallel (not sequential)
- [ ] View tracking doesn't block navigation
- [ ] Bundle size increase < 8KB

### UX/Visual
- [ ] Responsive layout (mobile, tablet, desktop)
- [ ] Horizontal scroll on mobile (recent songs)
- [ ] Grid layout on desktop (featured)
- [ ] Loading skeletons match final layout
- [ ] Empty states have helpful text

### Code Quality
- [ ] Hooks follow React best practices
- [ ] Repository methods follow existing patterns
- [ ] No `any` types
- [ ] Proper error handling
- [ ] Silent failures (no user-facing errors)

---

## Anti-Patterns to Avoid

- ❌ Don't load all data then filter in JS → Use IndexedDB indexes
- ❌ Don't block navigation with view tracking → Fire-and-forget async
- ❌ Don't show error UI for view tracking failures → Silent failure
- ❌ Don't forget empty states → Show helpful messages
- ❌ Don't skip loading states → Use skeletons
- ❌ Don't hardcode limits → Use props with defaults
- ❌ Don't forget responsive design → Horizontal scroll on mobile
- ❌ Don't create new card components → Reuse existing

---

## Success Score Estimation

**Confidence Level**: 8/10

**Why High Confidence**:
✅ Clear repository patterns
✅ IndexedDB indexes already exist
✅ Existing component patterns to follow
✅ getDatabaseStats() already implemented
✅ Comprehensive validation procedures

**Risks (-2 points)**:
- Featured algorithm needs tuning (may need adjustment)
- View tracking performance impact unknown
- Recent songs query efficiency needs validation

**Mitigation**:
- Algorithm is simple (can tweak weights)
- View tracking is fire-and-forget (non-blocking)
- Use existing indexes (by-last-accessed)

---

*End of PRP - Phase 4.5.3: Enhanced Search/Homepage*
