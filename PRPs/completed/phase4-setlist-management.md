# Phase 4: Setlist Management - BASE PRP

---

## Goal

**Feature Goal**: Enable worship leaders and musicians to create, edit, and perform with organized setlists that group arrangements in a specific order with custom keys per song, accessible offline via IndexedDB with fullscreen performance mode and drag-and-drop reordering.

**Deliverable**: Complete setlist management feature including:
- CRUD operations for setlists (create, read, update, delete)
- Drag-and-drop song reordering using @dnd-kit
- Fullscreen performance mode with keyboard navigation
- Shareable setlist URLs with unique IDs
- Local-only storage in IndexedDB (no cloud sync - Phase 5)

**Success Definition**:
- Users can create setlists and add arrangements via search
- Songs can be reordered via drag-and-drop
- Performance mode allows fullscreen viewing with arrow key navigation
- Setlists persist in IndexedDB and work offline
- All validation gates pass (typecheck, lint, build)

## User Persona

**Target User**: Worship leader or musician preparing for a live performance

**Use Case**: Planning Sunday morning worship service with 5-7 songs

**User Journey**:
1. **Create Setlist**: Click "New Setlist" → Enter name "Sunday Worship - Jan 15, 2025"
2. **Add Songs**: Click "Add Song" → Search "Amazing Grace" → Select arrangement (key: G, rating: 4.5)
3. **Reorder Songs**: Drag "How Great Thou Art" from position 3 to position 1
4. **Customize Key**: Set custom key to "D" for final song (vocalist preference)
5. **Perform**: Click "Performance Mode" → Fullscreen view → Navigate with arrow keys during live worship
6. **Share** (Phase 4.4): Click "Share" → Copy link `https://hsasongbook.app/share/3k4s7m9x2q1v`

**Pain Points Addressed**:
- ❌ **Before**: Printed chord charts scattered, hard to organize order
- ✅ **After**: Digital setlist on iPad, easy reordering, fullscreen viewing
- ❌ **Before**: Difficult to transpose songs for different vocalists
- ✅ **After**: Custom keys per song stored in setlist
- ❌ **Before**: Can't practice setlist at home without internet
- ✅ **After**: Offline-first with IndexedDB (PWA)

## Why

- **Business Value**: Core feature for worship leader workflow - organizes performance sets
- **Integration**: Builds on Phase 3 (ChordPro viewer) and Phase 2 (PWA/IndexedDB)
- **User Impact**: Enables live performance scenarios (primary use case for app)
- **Foundation for Phase 5**: Prepares data model for cloud sync and collaboration

**Problems Solved**:
- **For Worship Leaders**: Organize worship service flow, share setlists with team
- **For Musicians**: Quick access to chord charts in performance order, fullscreen viewing
- **For Teams**: Coordination on song order and keys before rehearsal

## What

**User-Visible Behavior**:
1. **Setlist CRUD**:
   - View list of all setlists (sorted by recent, date, name)
   - Create new setlist with name, description, performance date
   - Edit setlist metadata and song list
   - Delete setlist with confirmation dialog

2. **Song Management**:
   - Add songs via search modal (filters as user types)
   - Select arrangement with rating/popularity info displayed
   - Reorder songs via drag-and-drop (visual feedback during drag)
   - Remove songs from setlist
   - Set custom key per song (overrides arrangement key)

3. **Performance Mode**:
   - Fullscreen button enters presentation mode
   - Arrow keys navigate (Right/Space = next, Left/Backspace = previous)
   - ESC exits fullscreen
   - Progress bar shows position (e.g., "3 of 7")
   - ChordPro viewer displays current arrangement

4. **Sharing** (Phase 4.4):
   - Generate unique share URL on setlist creation
   - Copy link button
   - Public/private toggle

**Technical Requirements**:
- IndexedDB storage for setlists (offline-capable)
- Drag-and-drop using @dnd-kit library
- Fullscreen API with keyboard navigation
- Unique ID generation with nanoid
- Type-safe with TypeScript strict mode
- Mobile-responsive (60% of users)

### Success Criteria

**Phase 4.1 - Basic CRUD** (MVP):
- [ ] User can create setlist with name, description, performance date
- [ ] User can view list of all setlists
- [ ] User can delete setlist with confirmation
- [ ] Setlists persist in IndexedDB across sessions
- [ ] Works offline (PWA)

**Phase 4.2 - Drag-and-Drop Reordering**:
- [ ] User can reorder songs by dragging
- [ ] Visual feedback during drag (opacity, scale)
- [ ] Touch support on mobile/tablet
- [ ] Keyboard navigation for accessibility (Space to grab, arrows to move)
- [ ] Order persists to IndexedDB immediately

**Phase 4.3 - Performance Mode**:
- [ ] Fullscreen button enters performance mode
- [ ] Arrow keys navigate between arrangements
- [ ] ESC exits fullscreen
- [ ] Progress indicator shows current position
- [ ] ChordPro viewer displays with chords visible
- [ ] Works on desktop and tablet (not iPhone - fullscreen API limitation)

**Phase 4.4 - Sharing** (Optional for MVP):
- [ ] Generate unique shareId on setlist creation (nanoid, 12 chars)
- [ ] Share URL route `/share/:shareId`
- [ ] Public/private toggle on setlist
- [ ] Copy link button with toast notification

## All Needed Context

### Context Completeness Check

✅ **Vertical Slice Architecture**: Complete analysis of existing patterns in songs, arrangements, chordpro features
✅ **IndexedDB Patterns**: SetlistRepository already implemented, schema complete
✅ **@dnd-kit Integration**: Comprehensive research with TypeScript patterns
✅ **Fullscreen API**: React hook patterns and keyboard navigation strategies
✅ **Unique IDs**: nanoid library research and collision analysis

### Documentation & References

```yaml
# Library Documentation (MUST READ)
- url: https://docs.dndkit.com/presets/sortable
  why: Complete guide to sortable lists with @dnd-kit
  critical: |
    - Items array must use string IDs (not numbers)
    - Must spread {...attributes} and {...listeners} on draggable elements
    - SortableContext requires items array matching item keys exactly

- url: https://docs.dndkit.com/api-documentation/sensors
  why: Configure PointerSensor and KeyboardSensor for touch + accessibility
  critical: |
    - activationConstraint: { distance: 8 } prevents accidental drags
    - KeyboardSensor requires sortableKeyboardCoordinates function
    - Touch devices need activationConstraint: { delay: 250 }

- url: https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
  why: Fullscreen API methods, events, and browser support
  critical: |
    - Must be triggered by user gesture (cannot auto-start)
    - Listen to fullscreenchange event for state sync
    - document.fullscreenElement returns current fullscreen element or null

- url: https://github.com/ai/nanoid
  why: Generate unique, URL-safe share IDs
  critical: |
    - Use 12-character IDs with lowercase + numbers alphabet
    - customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12)
    - 1% collision probability over 35 years at 1K IDs/hour

# Codebase Patterns (MUST REFERENCE)
- file: src/features/arrangements/hooks/useArrangementData.ts
  why: Data fetching hook pattern with loading/error states
  pattern: |
    - useState<T | null>(null) for data
    - useState<boolean>(true) for loading
    - useState<string | null>(null) for error
    - useMemo for repository instances
    - useCallback for async operations
    - useEffect triggers load on mount
  gotcha: Repository must be memoized to prevent infinite re-renders

- file: src/features/pwa/db/repository.ts
  why: BaseRepository<T> pattern for IndexedDB CRUD
  pattern: |
    - Extend BaseRepository<Setlist>
    - Constructor calls super('setlists')
    - Custom methods: searchByIndex, compound index queries
    - Automatic metadata: createdAt, updatedAt, syncStatus, version
    - Quota checking before writes
  gotcha: |
    - SetlistRepository already exists and is fully implemented
    - Do NOT recreate - import from @/features/pwa/db/repository

- file: src/features/arrangements/components/ArrangementList.tsx
  why: List component pattern with sorting and loading states
  pattern: |
    - useMemo for sorted data
    - Three render states: loading skeleton, empty state, success
    - Performance timing with logger.debug
    - React.memo on child components (ArrangementCard)
  gotcha: Empty state check must handle both null and empty array

- file: src/features/chordpro/components/ChordProSplitView.tsx (lines 164-186)
  why: Existing fullscreen implementation (needs improvement)
  pattern: Basic fullscreen toggle with ESC handler
  gotcha: |
    - Current implementation doesn't listen to fullscreenchange events
    - Manually tracked isFullscreen state goes out of sync
    - User pressing ESC or F11 doesn't update state
    - DO NOT copy this pattern - use improved useFullscreen hook

- file: src/features/shared/hooks/useKeyboardShortcuts.ts
  why: Global keyboard shortcuts pattern
  pattern: |
    - window.addEventListener('keydown', handler)
    - Filter events from <input> and <textarea>
    - Cleanup with removeEventListener in return
  gotcha: |
    - Performance mode needs SEPARATE hook (different navigation paradigm)
    - Disable global shortcuts when performance mode active

# Custom Documentation
- docfile: PRPs/ai_docs/indexeddb-schema-migrations.md
  why: Schema migration patterns for IndexedDB (if adding new indexes)
  section: "Migration Handlers v3 and v4"
  critical: |
    - Setlist store already exists from v1 migration
    - Indexes: by-name, by-performance-date, by-updated, by-sync-status
    - DO NOT create new migration unless adding shareId index (Phase 4.4)

- docfile: claude_md_files/typescript-migration-guide.md
  why: TypeScript strict mode patterns and zero-any enforcement
  section: "Strict Mode Patterns"
  critical: |
    - All new code must pass strict mode (strictNullChecks enabled)
    - Zero `any` types - use `unknown` with type guards
    - Explicit return types for all functions
    - Optional chaining (?.) and nullish coalescing (??)
```

### Current Codebase Tree

```bash
hsasongbook/
├── src/
│   ├── app/
│   │   ├── App.tsx              # Main routing (add /setlist routes here)
│   │   └── main.tsx
│   ├── components/ui/           # shadcn/ui components
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── dialog.jsx
│   │   ├── dropdown-menu.jsx
│   │   └── input.jsx
│   ├── features/
│   │   ├── arrangements/        # Arrangement viewing/editing
│   │   │   ├── components/
│   │   │   │   ├── ArrangementCard.tsx
│   │   │   │   ├── ArrangementList.tsx
│   │   │   │   └── ArrangementMetadataForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useArrangementData.ts
│   │   │   ├── pages/
│   │   │   │   └── ArrangementPage.tsx
│   │   │   └── index.ts
│   │   ├── chordpro/            # ChordPro editor/viewer
│   │   │   ├── components/
│   │   │   │   ├── ChordProViewer.tsx
│   │   │   │   ├── ChordProEditor.tsx
│   │   │   │   └── ChordProSplitView.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useChordSheet.ts
│   │   │   │   └── useTransposition.ts
│   │   │   └── index.ts
│   │   ├── pwa/                 # PWA/IndexedDB infrastructure
│   │   │   ├── db/
│   │   │   │   ├── database.ts
│   │   │   │   ├── repository.ts    # BaseRepository + SetlistRepository
│   │   │   │   └── migrations.ts
│   │   │   └── hooks/
│   │   │       └── usePWA.ts
│   │   ├── search/              # Song search
│   │   │   ├── components/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   └── SongList.tsx
│   │   │   └── pages/
│   │   │       └── SearchPage.tsx
│   │   ├── shared/              # Cross-cutting components
│   │   │   ├── components/
│   │   │   │   ├── Breadcrumbs.tsx
│   │   │   │   ├── MobileNav.tsx
│   │   │   │   └── LoadingStates.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useKeyboardShortcuts.ts
│   │   │   │   └── useNavigation.ts
│   │   │   └── utils/
│   │   │       └── dataHelpers.ts
│   │   ├── songs/               # Song metadata viewing
│   │   │   ├── components/
│   │   │   │   └── SongMetadata.tsx
│   │   │   └── pages/
│   │   │       └── SongPage.tsx
│   │   └── setlists/            # **NEW FEATURE - TO BE CREATED**
│   ├── lib/
│   │   ├── logger.ts            # Production-safe logging
│   │   ├── utils.ts
│   │   └── config/
│   │       ├── index.ts
│   │       └── pwa.ts
│   ├── types/                   # Global type definitions
│   │   ├── Arrangement.types.ts
│   │   ├── Database.types.ts
│   │   ├── Setlist.types.ts     # Setlist types already defined
│   │   ├── Song.types.ts
│   │   └── index.ts
│   └── index.css
├── package.json
├── tsconfig.app.json            # Strict mode enabled
└── vite.config.ts
```

### Vertical Slice Architecture Analysis

**Existing Feature Slices** (analyzed patterns):

```yaml
src/features/songs/:              # Simple slice (minimal logic)
  components/SongMetadata.tsx     # Presentational component
  pages/SongPage.tsx              # Container with useParams, useState
  index.ts                        # Public API exports

  Pattern: Uses global types from @/types, no feature-specific types folder

src/features/arrangements/:       # Medium complexity slice
  components/                     # 8 components (Card, List, Header, Form, etc.)
    ArrangementCard.tsx           # Memoized with React.memo
    ArrangementList.tsx           # Sorting, loading states, useMemo
  hooks/
    useArrangementData.ts         # Repository + data fetching pattern
  pages/
    ArrangementPage.tsx           # Composition of components + hooks
  types/
    ArrangementMetadata.types.ts  # Feature-specific types
    index.ts                      # Re-exports + barrel
  utils/
    arrangementSorter.ts          # Business logic
    metadataValidation.ts
  index.ts

  Pattern: Comprehensive slice with custom hooks, utilities, and types

src/features/chordpro/:           # Highly complex slice
  components/ (13 components)
  hooks/ (10 hooks)               # useChordSheet, useTransposition, useAutoSave, etc.
  services/
    PersistenceService.ts         # Singleton service pattern
  db/
    DraftRepository.ts
  types/
    ChordSheet.types.ts           # 71 exported types
  utils/
    metadataInjector.ts
    contentSanitizer.ts
  index.ts

  Pattern: Service layer, database layer, extensive type coverage

src/features/pwa/:                # Infrastructure slice
  db/
    database.ts                   # IndexedDB setup with idb
    repository.ts                 # BaseRepository<T> + SetlistRepository
    migrations.ts
  hooks/
    usePWA.ts
    useOnlineStatus.ts
  components/
    UpdateNotification.tsx
    OfflineIndicator.tsx
  index.ts

  Pattern: Repository pattern with generic base class
```

**Feature Boundary Definition for Setlists**:

**This Slice Owns**:
- Setlist CRUD operations (create, read, update, delete)
- Setlist song management (add, remove, reorder)
- Performance mode UI and keyboard navigation
- Drag-and-drop reordering logic
- Share URL generation and validation
- Setlist-specific UI components

**Dependencies On Other Slices**:
- `arrangements/` → Import ArrangementCard for display in song picker (via index.ts)
- `chordpro/` → Import ChordProViewer for performance mode (via index.ts)
- `search/` → Import SearchBar for song search modal (via index.ts)
- `pwa/db/` → Import SetlistRepository (already implemented)
- `shared/` → Import Breadcrumbs, LoadingStates, PageTransition

**Shared/Common Code**:
- `@/components/ui/` → shadcn components (Button, Card, Dialog, Input)
- `@/types` → Global Setlist, SetlistSong types
- `@/lib/logger` → Production-safe logging
- `@/lib/utils` → Tailwind merge utility

**Slice Isolation**:
- All setlist-specific logic stays within `features/setlists/`
- Only imports from other slices' public APIs (index.ts)
- No circular dependencies
- Can be tested in isolation with mocked dependencies

### Desired Codebase Tree (Files to Create)

```bash
src/features/setlists/
├── types/
│   ├── Setlist.types.ts         # Re-export global types + feature-specific types
│   │                            # - SetlistSortOption, SetlistValidationErrors
│   │                            # - DragDropResult, PerformanceModeSettings
│   └── index.ts                 # Barrel export for types
├── components/
│   ├── SetlistCard.tsx          # Presentational card (like ArrangementCard)
│   │                            # Props: { setlist: Setlist }
│   │                            # Display: name, song count, performance date, badges
│   ├── SetlistList.tsx          # Container with sorting (like ArrangementList)
│   │                            # Props: { setlists: Setlist[], isLoading?: boolean }
│   │                            # Features: sort dropdown, grid layout, empty state
│   ├── SetlistHeader.tsx        # Header with title, date, description
│   │                            # Props: { setlist: Setlist, onEdit, onDelete }
│   ├── SetlistSongItem.tsx      # Individual song item with drag handle
│   │                            # Props: { song: SetlistSong, arrangement?: Arrangement, index: number }
│   │                            # Features: useSortable hook, drag handle, remove button
│   ├── SetlistForm.tsx          # Create/edit form (name, description, date)
│   │                            # Props: { initialData?: Partial<Setlist>, onSubmit, onCancel }
│   │                            # Uses: React Hook Form or controlled inputs
│   ├── SongSearchModal.tsx      # Search and add songs to setlist
│   │                            # Props: { onSelectArrangement: (arr: Arrangement) => void }
│   │                            # Features: SearchBar, ArrangementList with "Add" buttons
│   ├── PerformanceControls.tsx  # Fullscreen controls toolbar
│   │                            # Props: { isFullscreen, onToggle, onExit, onNext, onPrevious }
│   │                            # Buttons: Previous, Next, Fullscreen toggle, Exit
│   ├── PerformanceProgressBar.tsx # Progress indicator
│   │                            # Props: { currentIndex, total, onNavigate }
│   │                            # Display: "3 of 7" with click-to-jump
│   └── ShareButton.tsx          # Copy share link button
│                                # Props: { shareId: string }
│                                # Features: copy to clipboard, toast notification
├── hooks/
│   ├── useSetlistData.ts        # CRUD hook (like useArrangementData)
│   │                            # Return: { setlist, loading, error, updateSetlist, reload }
│   │                            # Pattern: SetlistRepository, useState, useEffect, useCallback
│   ├── useSetlists.ts           # List all setlists hook
│   │                            # Return: { setlists, loading, error, createSetlist, deleteSetlist }
│   ├── useSetlistSongs.ts       # Manage songs within setlist
│   │                            # Return: { addSong, removeSong, reorderSongs }
│   │                            # Uses: SetlistRepository, arrangements map
│   ├── useFullscreen.ts         # Fullscreen API wrapper
│   │                            # Params: (elementRef, { onOpen, onClose, onError })
│   │                            # Return: { isFullscreen, enterFullscreen, exitFullscreen, toggleFullscreen }
│   │                            # Events: fullscreenchange, fullscreenerror listeners
│   ├── useArrowKeyNavigation.ts # Arrow key navigation hook
│   │                            # Params: (currentIndex, totalItems, onNavigate, { enabled })
│   │                            # Keys: ArrowRight, ArrowLeft, Home, End, Space, Escape
│   │                            # Filters: Don't trigger on input/textarea focus
│   └── usePerformanceMode.ts    # Composite performance mode hook
│                                # Combines: useFullscreen + useArrowKeyNavigation + state
│                                # Return: Complete performance mode interface
├── pages/
│   ├── SetlistsIndexPage.tsx    # List all setlists (route: /setlists)
│   │                            # Features: SetlistList, create button, sort selector
│   ├── SetlistPage.tsx          # View/edit single setlist (route: /setlist/:setlistId)
│   │                            # Features: SetlistHeader, song list, drag-and-drop, add song
│   ├── SetlistPerformancePage.tsx # Fullscreen performance mode (route: /setlist/:setlistId/performance/:index?)
│   │                            # Features: Fullscreen, ChordProViewer, keyboard nav, progress bar
│   └── SharedSetlistPage.tsx    # View shared setlist (route: /share/:shareId)
│                                # Features: Read-only view, public check, not found handling
├── utils/
│   ├── setlistSorter.ts         # Sort setlists (by name, date, recent)
│   │                            # Pattern: Immutable sort (create copy), switch statement
│   ├── setlistValidation.ts     # Validate setlist form data
│   │                            # Return: { errors: SetlistValidationErrors | null }
│   └── shareIdGenerator.ts      # Generate/validate share IDs
│                                # Uses: nanoid with custom alphabet
│                                # Functions: generateShareId, isValidShareId
└── index.ts                     # Public API exports
                                 # Export: pages, components, hooks (selective)
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: @dnd-kit GOTCHAS

// 1. ID Type Must Be String
// ❌ BAD - Numeric IDs cause issues
const items = [0, 1, 2, 3];

// ✅ GOOD - Use string IDs
const items = songs.map(song => song.id); // Assuming song.id is string

// 2. Must Spread Attributes and Listeners
// ❌ BAD - Drag won't work
<div ref={setNodeRef} style={style}>
  Content
</div>

// ✅ GOOD - Always spread both
<div ref={setNodeRef} style={style} {...attributes} {...listeners}>
  Content
</div>

// 3. SortableContext Items Must Match Keys
// ❌ BAD - Mismatch between items and map keys
<SortableContext items={songs}>
  {songs.map(song => <SortableItem key={song.arrangementId} id={song.id} />)}
</SortableContext>

// ✅ GOOD - Consistent IDs
<SortableContext items={songs.map(s => s.id)}>
  {songs.map(song => <SortableItem key={song.id} id={song.id} />)}
</SortableContext>

// 4. Over Can Be Null
// ❌ BAD - Doesn't check if over exists
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  const newIndex = items.indexOf(over.id); // Error if over is null!
}

// ✅ GOOD - Always null-check over
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (over && active.id !== over.id) {
    // Safe to use over.id
  }
}

// CRITICAL: Fullscreen API GOTCHAS

// 1. Must Be User-Initiated
// ❌ BAD - Cannot auto-start fullscreen
useEffect(() => {
  containerRef.current?.requestFullscreen(); // Will fail!
}, []);

// ✅ GOOD - Triggered by user action
<Button onClick={enterFullscreen}>Go Fullscreen</Button>

// 2. Listen to fullscreenchange Events
// ❌ BAD - Manual state tracking goes out of sync
const [isFullscreen, setIsFullscreen] = useState(false);
const toggle = () => {
  if (!isFullscreen) {
    containerRef.current?.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
  setIsFullscreen(!isFullscreen); // Wrong! User can press ESC
};

// ✅ GOOD - Listen to browser events
useEffect(() => {
  const handleChange = () => {
    setIsFullscreen(document.fullscreenElement === containerRef.current);
  };
  document.addEventListener('fullscreenchange', handleChange);
  return () => document.removeEventListener('fullscreenchange', handleChange);
}, []);

// CRITICAL: TypeScript Strict Mode GOTCHAS

// 1. Optional Chaining Required
// ❌ BAD - Crashes if setlist is null
const songCount = setlist.songs.length;

// ✅ GOOD - Use optional chaining
const songCount = setlist?.songs.length ?? 0;

// 2. Explicit Return Types
// ❌ BAD - Implicit return type
async function loadSetlist(id: string) {
  const repo = new SetlistRepository();
  return await repo.getById(id); // Inferred type
}

// ✅ GOOD - Explicit return type
async function loadSetlist(id: string): Promise<Setlist | undefined> {
  const repo = new SetlistRepository();
  return await repo.getById(id);
}

// 3. Zero ANY Types (ESLint enforces)
// ❌ BAD - Will fail lint
function processDragEvent(event: any) { }

// ✅ GOOD - Use proper type
import { DragEndEvent } from '@dnd-kit/core';
function processDragEvent(event: DragEndEvent) { }

// CRITICAL: Repository Pattern GOTCHAS

// 1. Repository Must Be Memoized
// ❌ BAD - Creates new instance on every render
const repo = new SetlistRepository();

// ✅ GOOD - Memoize repository
const repo = useMemo(() => new SetlistRepository(), []);

// 2. SetlistRepository Already Exists
// ❌ BAD - Don't recreate SetlistRepository class
export class SetlistRepository extends BaseRepository<Setlist> {
  constructor() { super('setlists'); }
}

// ✅ GOOD - Import existing implementation
import { SetlistRepository } from '@/features/pwa/db/repository';
const setlistRepo = useMemo(() => new SetlistRepository(), []);

// CRITICAL: React 19 Patterns

// 1. Default Export for Components
// Pattern: Components use default export
export default function SetlistCard({ setlist }: Props) { }

// Pattern: Pages use named export
export function SetlistPage() { }

// 2. Memo for Performance
// Use React.memo for list items to prevent unnecessary re-renders
import { memo } from 'react';
function SetlistCard({ setlist }: Props) { }
export default memo(SetlistCard);
```

## Implementation Blueprint

### Data Models and Structure

**Global Types** (already defined in `/src/types/Setlist.types.ts`):

```typescript
// From existing codebase
export interface Setlist {
  id: string;                    // Internal IndexedDB ID
  name: string;
  description?: string;
  performanceDate?: string;      // ISO date string
  songs: SetlistSong[];
  createdAt: string;
  updatedAt: string;
  // Sync support (Phase 5)
  syncStatus?: 'pending' | 'synced' | 'conflict';
  version?: number;
  lastAccessedAt?: number;
}

export interface SetlistSong {
  id: string;                    // Unique ID for this setlist entry
  songId: string;                // Reference to song
  arrangementId: string;         // Reference to arrangement
  order: number;                 // Position in setlist
  customKey?: string;            // Override arrangement key
  notes?: string;                // Performance notes
}
```

**Feature-Specific Types** (create in `/src/features/setlists/types/Setlist.types.ts`):

```typescript
import type { Setlist, SetlistSong } from '@/types';

// Re-export global types
export type { Setlist, SetlistSong };

// Feature-specific types
export interface SetlistSortOption {
  value: 'name' | 'date' | 'recent';
  label: string;
}

export const SETLIST_SORT_OPTIONS: Record<string, SetlistSortOption> = {
  NAME: { value: 'name', label: 'Name (A-Z)' },
  DATE: { value: 'date', label: 'Performance Date' },
  RECENT: { value: 'recent', label: 'Recently Updated' }
} as const;

export interface SetlistValidationErrors {
  name?: string;
  performanceDate?: string;
  songs?: string;
}

export interface SetlistFormData {
  name: string;
  description?: string;
  performanceDate?: string;
}

export interface DragDropResult {
  sourceIndex: number;
  destinationIndex: number;
  setlistId: string;
}

export interface PerformanceModeSettings {
  showProgressBar: boolean;
  showControls: boolean;
  showChords: boolean;
  transposition: number;
}

export interface ShareId {
  // Branded type for type safety
  readonly _brand: unique symbol;
}

export interface SetlistWithArrangements extends Setlist {
  arrangements: Map<string, Arrangement>; // arrangementId -> Arrangement
}
```

**IndexedDB Schema** (already exists - no changes needed):

```typescript
// From src/features/pwa/db/database.ts
// Schema already includes setlists store from v1 migration

export interface HSASongbookDB extends DBSchema {
  setlists: {
    key: string;
    value: Setlist;
    indexes: {
      'by-name': string;
      'by-performance-date': string;
      'by-updated': string;
      'by-sync-status': string;
      // Phase 4.4: Add 'by-share-id' index if implementing sharing
    };
  };
  // ... other stores
}
```

**Repository** (already implemented - `/src/features/pwa/db/repository.ts`):

```typescript
// DO NOT recreate - this already exists!
export class SetlistRepository extends BaseRepository<Setlist> {
  constructor() {
    super('setlists');
  }

  async searchByName(query: string): Promise<Setlist[]> { /* implemented */ }
  async getByDateRange(start: Date, end: Date): Promise<Setlist[]> { /* implemented */ }
  async getRecent(limit = 10): Promise<Setlist[]> { /* implemented */ }
  async addSong(setlistId: string, songEntry: Partial<SetlistSong>): Promise<Setlist> { /* implemented */ }
  async removeSong(setlistId: string, songId: string): Promise<Setlist> { /* implemented */ }
  async reorderSongs(setlistId: string, songOrder: string[]): Promise<Setlist> { /* implemented */ }
}
```

### Implementation Tasks (Ordered by Vertical Slice Completion)

**CRITICAL: Implement complete vertical slice from UI to data layer within feature boundary**

#### Phase 4.1: Basic CRUD (Foundation)

```yaml
Task 1: CREATE src/features/setlists/types/Setlist.types.ts
  IMPLEMENT: Feature-specific TypeScript types and interfaces
  FOLLOW pattern: src/features/arrangements/types/ArrangementMetadata.types.ts
  CONTENT: |
    - Re-export global Setlist, SetlistSong types from @/types
    - Define SetlistSortOption with const assertion
    - Define SetlistValidationErrors interface
    - Define SetlistFormData interface
    - Export all types via barrel export
  PLACEMENT: src/features/setlists/types/
  SLICE BOUNDARY: All types needed for setlist CRUD operations
  VALIDATION: npm run typecheck (zero errors)

Task 2: CREATE src/features/setlists/types/index.ts
  IMPLEMENT: Barrel export for types
  CONTENT: export * from './Setlist.types';
  VALIDATION: Verify imports work: import { SetlistSortOption } from '@/features/setlists/types'

Task 3: CREATE src/features/setlists/utils/setlistSorter.ts
  IMPLEMENT: Sort setlists by name, date, or recent update
  FOLLOW pattern: src/features/arrangements/utils/arrangementSorter.ts
  DEPENDENCIES: Import Setlist from @/types, SetlistSortOption from ../types
  CONTENT: |
    export function sortSetlists(
      setlists: Setlist[],
      sortBy: SetlistSortOption['value']
    ): Setlist[] {
      const sorted = [...setlists]; // Immutability
      switch (sortBy) {
        case 'name':
          return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'date':
          return sorted.sort((a, b) =>
            new Date(b.performanceDate || 0).getTime() -
            new Date(a.performanceDate || 0).getTime()
          );
        case 'recent':
          return sorted.sort((a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        default:
          return sorted;
      }
    }
  VALIDATION: Create unit test verifying sort order

Task 4: CREATE src/features/setlists/utils/setlistValidation.ts
  IMPLEMENT: Validate setlist form data
  DEPENDENCIES: Import SetlistFormData, SetlistValidationErrors from ../types
  CONTENT: |
    export function validateSetlist(
      data: SetlistFormData
    ): SetlistValidationErrors | null {
      const errors: SetlistValidationErrors = {};

      if (!data.name || data.name.trim().length === 0) {
        errors.name = 'Setlist name is required';
      }

      if (data.name && data.name.length > 100) {
        errors.name = 'Name must be less than 100 characters';
      }

      if (data.performanceDate) {
        const date = new Date(data.performanceDate);
        if (isNaN(date.getTime())) {
          errors.performanceDate = 'Invalid date format';
        }
      }

      return Object.keys(errors).length > 0 ? errors : null;
    }
  VALIDATION: Unit test with valid/invalid data

Task 5: CREATE src/features/setlists/hooks/useSetlists.ts
  IMPLEMENT: Hook to list all setlists with CRUD operations
  FOLLOW pattern: src/features/arrangements/hooks/useArrangementData.ts
  DEPENDENCIES: |
    - Import SetlistRepository from @/features/pwa/db/repository
    - Import Setlist from @/types
    - Import logger from @/lib/logger
  CONTENT: |
    export interface UseSetlistsReturn {
      setlists: Setlist[];
      loading: boolean;
      error: string | null;
      createSetlist: (data: Partial<Setlist>) => Promise<Setlist>;
      deleteSetlist: (id: string) => Promise<void>;
      reload: () => void;
    }

    export function useSetlists(): UseSetlistsReturn {
      const [setlists, setSetlists] = useState<Setlist[]>([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);

      const repo = useMemo(() => new SetlistRepository(), []);

      const loadSetlists = useCallback(async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await repo.getAll();
          setSetlists(data);
        } catch (err) {
          logger.error('Failed to load setlists:', err);
          setError('Failed to load setlists');
        } finally {
          setLoading(false);
        }
      }, [repo]);

      const createSetlist = useCallback(async (data: Partial<Setlist>) => {
        const newSetlist = await repo.save({
          ...data,
          songs: data.songs || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as Setlist);
        setSetlists(prev => [...prev, newSetlist]);
        return newSetlist;
      }, [repo]);

      const deleteSetlist = useCallback(async (id: string) => {
        await repo.delete(id);
        setSetlists(prev => prev.filter(s => s.id !== id));
      }, [repo]);

      useEffect(() => {
        loadSetlists();
      }, [loadSetlists]);

      return {
        setlists,
        loading,
        error,
        createSetlist,
        deleteSetlist,
        reload: loadSetlists
      };
    }
  PLACEMENT: src/features/setlists/hooks/
  VALIDATION: |
    - TypeScript compiles (npm run typecheck)
    - Create test component that calls hook
    - Verify IndexedDB operations work

Task 6: CREATE src/features/setlists/hooks/useSetlistData.ts
  IMPLEMENT: Hook for single setlist with song management
  FOLLOW pattern: src/features/arrangements/hooks/useArrangementData.ts
  DEPENDENCIES: |
    - Import SetlistRepository, ArrangementRepository from @/features/pwa/db/repository
    - Import Setlist, Arrangement from @/types
  CONTENT: |
    export interface UseSetlistDataReturn {
      setlist: Setlist | null;
      arrangements: Map<string, Arrangement>;
      loading: boolean;
      error: string | null;
      updateSetlist: (data: Partial<Setlist>) => Promise<void>;
      reload: () => void;
    }

    export function useSetlistData(
      setlistId: string | undefined
    ): UseSetlistDataReturn {
      const [setlist, setSetlist] = useState<Setlist | null>(null);
      const [arrangements, setArrangements] = useState<Map<string, Arrangement>>(new Map());
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);

      const setlistRepo = useMemo(() => new SetlistRepository(), []);
      const arrangementRepo = useMemo(() => new ArrangementRepository(), []);

      const loadSetlist = useCallback(async () => {
        if (!setlistId) {
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          setError(null);

          // Load setlist
          const setlistData = await setlistRepo.getById(setlistId);
          if (!setlistData) {
            setError('Setlist not found');
            return;
          }

          // Load all arrangements for songs in setlist
          const arrangementIds = setlistData.songs.map(s => s.arrangementId);
          const arrangementData = await Promise.all(
            arrangementIds.map(id => arrangementRepo.getById(id))
          );

          // Build map
          const arrangementsMap = new Map<string, Arrangement>();
          arrangementData.forEach(arr => {
            if (arr) arrangementsMap.set(arr.id, arr);
          });

          setSetlist(setlistData);
          setArrangements(arrangementsMap);

          logger.debug('Setlist loaded:', {
            setlistId: setlistData.id,
            songCount: setlistData.songs.length
          });
        } catch (err) {
          logger.error('Failed to load setlist:', err);
          setError('Failed to load setlist');
        } finally {
          setLoading(false);
        }
      }, [setlistId, setlistRepo, arrangementRepo]);

      const updateSetlist = useCallback(async (data: Partial<Setlist>) => {
        if (!setlist) return;
        const updated = { ...setlist, ...data };
        await setlistRepo.save(updated);
        setSetlist(updated);
      }, [setlist, setlistRepo]);

      useEffect(() => {
        loadSetlist();
      }, [loadSetlist]);

      return {
        setlist,
        arrangements,
        loading,
        error,
        updateSetlist,
        reload: loadSetlist
      };
    }
  VALIDATION: Test loading setlist with arrangements

Task 7: CREATE src/features/setlists/components/SetlistCard.tsx
  IMPLEMENT: Presentational card component for setlist
  FOLLOW pattern: src/features/arrangements/components/ArrangementCard.tsx
  DEPENDENCIES: |
    - Import Setlist from @/types
    - Import Card, CardHeader, CardTitle, CardContent from @/components/ui/card
    - Import Badge from @/components/ui/badge
    - Import Button from @/components/ui/button
    - Import Calendar, Music, ListMusic from lucide-react
    - Import useNavigate from react-router-dom
  CONTENT: |
    import { memo } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
    import { Badge } from '@/components/ui/badge';
    import { Button } from '@/components/ui/button';
    import { Calendar, Music, ListMusic } from 'lucide-react';
    import type { Setlist } from '@/types';

    interface SetlistCardProps {
      setlist: Setlist;
    }

    function SetlistCard({ setlist }: SetlistCardProps) {
      const navigate = useNavigate();

      const handleView = (): void => {
        navigate(`/setlist/${setlist.id}`);
      };

      return (
        <Card className="h-full flex flex-col hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ListMusic className="h-5 w-5" />
              {setlist.name}
            </CardTitle>
            {setlist.performanceDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(setlist.performanceDate).toLocaleDateString()}
              </div>
            )}
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <Badge variant="secondary">
                <Music className="h-3 w-3 mr-1" />
                {setlist.songs.length} songs
              </Badge>

              {setlist.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {setlist.description}
                </p>
              )}
            </div>

            <Button
              onClick={handleView}
              className="w-full mt-4"
              variant="outline"
            >
              View Setlist
            </Button>
          </CardContent>
        </Card>
      );
    }

    export default memo(SetlistCard);
  PLACEMENT: src/features/setlists/components/
  VALIDATION: |
    - Renders correctly with mock data
    - Navigation works on click
    - No TypeScript errors

Task 8: CREATE src/features/setlists/components/SetlistList.tsx
  IMPLEMENT: Container component with sorting and loading states
  FOLLOW pattern: src/features/arrangements/components/ArrangementList.tsx
  DEPENDENCIES: |
    - Import Setlist from @/types
    - Import SetlistSortOption from ../types
    - Import sortSetlists from ../utils/setlistSorter
    - Import SetlistCard from './SetlistCard'
    - Import SortSelector from @/features/shared/components/SortSelector
    - Import Card, CardContent from @/components/ui/card
    - Import ListMusic from lucide-react
  CONTENT: |
    import { useState, useMemo } from 'react';
    import SetlistCard from './SetlistCard';
    import SortSelector from '@/features/shared/components/SortSelector';
    import { Card, CardContent } from '@/components/ui/card';
    import { ListMusic } from 'lucide-react';
    import { sortSetlists } from '../utils/setlistSorter';
    import { SETLIST_SORT_OPTIONS } from '../types';
    import type { Setlist, SetlistSortOption } from '../types';

    interface SetlistListProps {
      setlists: Setlist[];
      isLoading?: boolean;
    }

    export default function SetlistList({
      setlists,
      isLoading = false
    }: SetlistListProps) {
      const [sortBy, setSortBy] = useState<SetlistSortOption['value']>('recent');

      const sortedSetlists = useMemo(() => {
        if (!setlists || setlists.length === 0) return [];
        return sortSetlists(setlists, sortBy);
      }, [setlists, sortBy]);

      if (isLoading) {
        return <div>Loading...</div>; // TODO: Add skeleton
      }

      if (!setlists || setlists.length === 0) {
        return (
          <Card>
            <CardContent className="py-12 text-center">
              <ListMusic className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Setlists Yet</h3>
              <p className="text-muted-foreground text-sm">
                Create your first setlist to get started
              </p>
            </CardContent>
          </Card>
        );
      }

      return (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">
              Your Setlists ({setlists.length})
            </h3>
            <SortSelector
              value={sortBy}
              onChange={setSortBy}
              options={Object.values(SETLIST_SORT_OPTIONS)}
            />
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {sortedSetlists.map(setlist => (
              <SetlistCard key={setlist.id} setlist={setlist} />
            ))}
          </div>
        </div>
      );
    }
  PLACEMENT: src/features/setlists/components/
  VALIDATION: |
    - Renders empty state, loading state, and success state
    - Sort selector changes order
    - Grid layout responsive

Task 9: CREATE src/features/setlists/components/SetlistForm.tsx
  IMPLEMENT: Form for creating/editing setlist metadata
  DEPENDENCIES: |
    - Import SetlistFormData, SetlistValidationErrors from ../types
    - Import validateSetlist from ../utils/setlistValidation
    - Import Button from @/components/ui/button
    - Import Input from @/components/ui/input
    - Import Label from @/components/ui/label
  CONTENT: |
    import { useState } from 'react';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { validateSetlist } from '../utils/setlistValidation';
    import type { SetlistFormData, SetlistValidationErrors } from '../types';

    interface SetlistFormProps {
      initialData?: Partial<SetlistFormData>;
      onSubmit: (data: SetlistFormData) => void;
      onCancel: () => void;
    }

    export default function SetlistForm({
      initialData,
      onSubmit,
      onCancel
    }: SetlistFormProps) {
      const [formData, setFormData] = useState<SetlistFormData>({
        name: initialData?.name || '',
        description: initialData?.description || '',
        performanceDate: initialData?.performanceDate || ''
      });

      const [errors, setErrors] = useState<SetlistValidationErrors | null>(null);

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = validateSetlist(formData);
        if (validationErrors) {
          setErrors(validationErrors);
          return;
        }

        onSubmit(formData);
      };

      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Setlist Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Sunday Worship - Jan 15, 2025"
            />
            {errors?.name && (
              <p className="text-sm text-destructive mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Morning service setlist"
            />
          </div>

          <div>
            <Label htmlFor="performanceDate">Performance Date</Label>
            <Input
              id="performanceDate"
              type="date"
              value={formData.performanceDate}
              onChange={(e) => setFormData({ ...formData, performanceDate: e.target.value })}
            />
            {errors?.performanceDate && (
              <p className="text-sm text-destructive mt-1">{errors.performanceDate}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit">Save</Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      );
    }
  PLACEMENT: src/features/setlists/components/
  VALIDATION: |
    - Form submits with valid data
    - Validation errors display correctly
    - Cancel button works

Task 10: CREATE src/features/setlists/pages/SetlistsIndexPage.tsx
  IMPLEMENT: Page to list all setlists with create button
  FOLLOW pattern: src/features/search/pages/SearchPage.tsx
  DEPENDENCIES: |
    - Import useSetlists from ../hooks/useSetlists
    - Import SetlistList from ../components/SetlistList
    - Import SetlistForm from ../components/SetlistForm
    - Import Breadcrumbs from @/features/shared/components/Breadcrumbs
    - Import PageSpinner from @/features/shared/components/LoadingStates
    - Import SimplePageTransition from @/features/shared/components/PageTransition
    - Import Button from @/components/ui/button
    - Import Dialog from @/components/ui/dialog
    - Import Plus from lucide-react
  CONTENT: |
    import { useState } from 'react';
    import { useSetlists } from '../hooks/useSetlists';
    import SetlistList from '../components/SetlistList';
    import SetlistForm from '../components/SetlistForm';
    import Breadcrumbs from '@/features/shared/components/Breadcrumbs';
    import { PageSpinner } from '@/features/shared/components/LoadingStates';
    import { SimplePageTransition } from '@/features/shared/components/PageTransition';
    import { Button } from '@/components/ui/button';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Plus } from 'lucide-react';
    import type { SetlistFormData } from '../types';

    export function SetlistsIndexPage() {
      const { setlists, loading, error, createSetlist } = useSetlists();
      const [showCreateDialog, setShowCreateDialog] = useState(false);

      const handleCreateSetlist = async (data: SetlistFormData) => {
        await createSetlist(data);
        setShowCreateDialog(false);
      };

      if (loading) return <PageSpinner message="Loading setlists..." />;

      if (error) {
        return (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <p className="text-destructive">{error}</p>
          </div>
        );
      }

      return (
        <SimplePageTransition>
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
              <div className="mb-6">
                <Breadcrumbs items={[{ label: 'Setlists', path: '/setlists' }]} />
              </div>

              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Setlists</h1>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Setlist
                </Button>
              </div>

              <SetlistList setlists={setlists} isLoading={loading} />

              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Setlist</DialogTitle>
                  </DialogHeader>
                  <SetlistForm
                    onSubmit={handleCreateSetlist}
                    onCancel={() => setShowCreateDialog(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </SimplePageTransition>
      );
    }
  PLACEMENT: src/features/setlists/pages/
  VALIDATION: |
    - Page loads and displays setlists
    - Create dialog opens
    - Form submission creates setlist
    - Dialog closes on success

Task 11: UPDATE src/app/App.tsx (Add Routes)
  IMPLEMENT: Add setlist routes to main app routing
  LOCATION: src/app/App.tsx
  CONTENT: |
    // Add import
    import { SetlistsIndexPage } from '../features/setlists/pages/SetlistsIndexPage';

    // Add route in Routes component
    <Route path="/setlists" element={<SetlistsIndexPage />} />
  VALIDATION: |
    - Navigate to /setlists
    - Page loads correctly
    - No console errors

Task 12: CREATE src/features/setlists/index.ts (Public API)
  IMPLEMENT: Barrel export for public API
  CONTENT: |
    // Pages
    export { SetlistsIndexPage } from './pages/SetlistsIndexPage';

    // Components
    export { default as SetlistCard } from './components/SetlistCard';
    export { default as SetlistList } from './components/SetlistList';
    export { default as SetlistForm } from './components/SetlistForm';

    // Hooks
    export { useSetlists } from './hooks/useSetlists';
    export { useSetlistData } from './hooks/useSetlistData';

    // Types
    export type {
      SetlistSortOption,
      SetlistValidationErrors,
      SetlistFormData
    } from './types';
  PLACEMENT: src/features/setlists/
  VALIDATION: Import from feature works: import { SetlistsIndexPage } from '@/features/setlists'
```

#### Phase 4.2: Drag-and-Drop Reordering

```yaml
Task 13: INSTALL @dnd-kit packages
  COMMAND: npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
  VALIDATION: |
    - package.json includes dependencies
    - npm run build succeeds

Task 14: CREATE src/features/setlists/hooks/useSetlistSongs.ts
  IMPLEMENT: Hook for adding/removing/reordering songs in setlist
  DEPENDENCIES: |
    - Import SetlistRepository from @/features/pwa/db/repository
    - Import Setlist, SetlistSong from @/types
    - Import logger from @/lib/logger
  CONTENT: |
    import { useCallback } from 'react';
    import { SetlistRepository } from '@/features/pwa/db/repository';
    import logger from '@/lib/logger';
    import type { Setlist, SetlistSong } from '@/types';

    export interface UseSetlistSongsReturn {
      addSong: (arrangementId: string, customKey?: string) => Promise<void>;
      removeSong: (songId: string) => Promise<void>;
      reorderSongs: (sourceIndex: number, destinationIndex: number) => Promise<void>;
    }

    export function useSetlistSongs(
      setlist: Setlist | null,
      onUpdate: (updatedSetlist: Setlist) => void
    ): UseSetlistSongsReturn {
      const repo = useMemo(() => new SetlistRepository(), []);

      const addSong = useCallback(async (
        arrangementId: string,
        customKey?: string
      ) => {
        if (!setlist) return;

        const newSong: SetlistSong = {
          id: `setlist-song-${Date.now()}`,
          songId: '', // Will be populated from arrangement
          arrangementId,
          order: setlist.songs.length,
          customKey,
          notes: ''
        };

        const updated = {
          ...setlist,
          songs: [...setlist.songs, newSong]
        };

        const saved = await repo.save(updated);
        onUpdate(saved);
        logger.debug('Song added to setlist:', newSong);
      }, [setlist, repo, onUpdate]);

      const removeSong = useCallback(async (songId: string) => {
        if (!setlist) return;

        const updated = {
          ...setlist,
          songs: setlist.songs.filter(s => s.id !== songId)
        };

        const saved = await repo.save(updated);
        onUpdate(saved);
        logger.debug('Song removed from setlist:', songId);
      }, [setlist, repo, onUpdate]);

      const reorderSongs = useCallback(async (
        sourceIndex: number,
        destinationIndex: number
      ) => {
        if (!setlist) return;

        const reordered = [...setlist.songs];
        const [removed] = reordered.splice(sourceIndex, 1);
        reordered.splice(destinationIndex, 0, removed);

        // Update order numbers
        const updated = reordered.map((song, index) => ({
          ...song,
          order: index
        }));

        const saved = await repo.save({ ...setlist, songs: updated });
        onUpdate(saved);
        logger.debug('Songs reordered:', { sourceIndex, destinationIndex });
      }, [setlist, repo, onUpdate]);

      return { addSong, removeSong, reorderSongs };
    }
  PLACEMENT: src/features/setlists/hooks/
  VALIDATION: Test reordering logic with mock data

Task 15: CREATE src/features/setlists/components/SetlistSongItem.tsx
  IMPLEMENT: Draggable song item with useSortable hook
  FOLLOW pattern: @dnd-kit sortable examples
  DEPENDENCIES: |
    - Import useSortable from @dnd-kit/sortable
    - Import CSS from @dnd-kit/utilities
    - Import SetlistSong, Arrangement from @/types
    - Import Card from @/components/ui/card
    - Import Button from @/components/ui/button
    - Import GripVertical, X from lucide-react
  CONTENT: |
    import { useSortable } from '@dnd-kit/sortable';
    import { CSS } from '@dnd-kit/utilities';
    import { Card } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { GripVertical, X } from 'lucide-react';
    import type { SetlistSong, Arrangement } from '@/types';

    interface SetlistSongItemProps {
      song: SetlistSong;
      arrangement?: Arrangement;
      index: number;
      onRemove: (songId: string) => void;
    }

    export default function SetlistSongItem({
      song,
      arrangement,
      index,
      onRemove
    }: SetlistSongItemProps) {
      const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging
      } = useSortable({ id: song.id });

      const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
      };

      return (
        <Card
          ref={setNodeRef}
          style={style}
          className="p-4 flex items-center gap-4"
        >
          {/* Drag handle */}
          <button
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="touch-none cursor-grab active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Song info */}
          <div className="flex-1">
            <div className="font-medium">
              {index + 1}. {arrangement?.name || 'Unknown'}
            </div>
            {song.customKey && (
              <div className="text-sm text-muted-foreground">
                Key: {song.customKey}
              </div>
            )}
          </div>

          {/* Remove button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(song.id)}
            aria-label="Remove song"
          >
            <X className="h-4 w-4" />
          </Button>
        </Card>
      );
    }
  PLACEMENT: src/features/setlists/components/
  VALIDATION: |
    - Item renders with drag handle
    - Drag handle is separate from card (doesn't drag when clicking card)
    - Remove button works

Task 16: CREATE src/features/setlists/pages/SetlistPage.tsx
  IMPLEMENT: View/edit setlist with drag-and-drop
  FOLLOW pattern: @dnd-kit DndContext + SortableContext
  DEPENDENCIES: |
    - Import useParams, useNavigate from react-router-dom
    - Import useSetlistData from ../hooks/useSetlistData
    - Import useSetlistSongs from ../hooks/useSetlistSongs
    - Import DndContext, closestCenter, PointerSensor, KeyboardSensor from @dnd-kit/core
    - Import SortableContext, arrayMove, verticalListSortingStrategy from @dnd-kit/sortable
    - Import SetlistSongItem from ../components/SetlistSongItem
  CONTENT: |
    import { useParams, useNavigate } from 'react-router-dom';
    import { useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
    import { DndContext, closestCenter } from '@dnd-kit/core';
    import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
    import type { DragEndEvent } from '@dnd-kit/core';
    import { useSetlistData } from '../hooks/useSetlistData';
    import { useSetlistSongs } from '../hooks/useSetlistSongs';
    import SetlistSongItem from '../components/SetlistSongItem';
    import Breadcrumbs from '@/features/shared/components/Breadcrumbs';
    import { PageSpinner } from '@/features/shared/components/LoadingStates';
    import { SimplePageTransition } from '@/features/shared/components/PageTransition';
    import { Button } from '@/components/ui/button';
    import { Plus } from 'lucide-react';

    export function SetlistPage() {
      const { setlistId } = useParams<{ setlistId: string }>();
      const navigate = useNavigate();

      const {
        setlist,
        arrangements,
        loading,
        error,
        updateSetlist
      } = useSetlistData(setlistId);

      const { addSong, removeSong, reorderSongs } = useSetlistSongs(
        setlist,
        (updated) => updateSetlist(updated)
      );

      const sensors = useSensors(
        useSensor(PointerSensor, {
          activationConstraint: { distance: 8 }
        }),
        useSensor(KeyboardSensor, {
          coordinateGetter: sortableKeyboardCoordinates
        })
      );

      const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
          const oldIndex = setlist!.songs.findIndex(s => s.id === active.id);
          const newIndex = setlist!.songs.findIndex(s => s.id === over.id);
          reorderSongs(oldIndex, newIndex);
        }
      };

      if (loading) return <PageSpinner message="Loading setlist..." />;
      if (error || !setlist) {
        return <div>Error: {error || 'Setlist not found'}</div>;
      }

      return (
        <SimplePageTransition>
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
              <Breadcrumbs items={[
                { label: 'Setlists', path: '/setlists' },
                { label: setlist.name, path: `/setlist/${setlist.id}` }
              ]} />

              <h1 className="text-3xl font-bold mt-6 mb-4">{setlist.name}</h1>

              <Button onClick={() => {/* Add song modal */}} className="mb-6">
                <Plus className="mr-2 h-4 w-4" />
                Add Song
              </Button>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={setlist.songs.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {setlist.songs.map((song, index) => (
                      <SetlistSongItem
                        key={song.id}
                        song={song}
                        arrangement={arrangements.get(song.arrangementId)}
                        index={index}
                        onRemove={removeSong}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </SimplePageTransition>
      );
    }
  PLACEMENT: src/features/setlists/pages/
  VALIDATION: |
    - Drag-and-drop works (mouse + touch)
    - Keyboard navigation works (Space to grab, arrows to move)
    - Order persists to IndexedDB
    - Remove button works

Task 17: UPDATE src/app/App.tsx (Add SetlistPage route)
  IMPLEMENT: Add route for individual setlist
  CONTENT: |
    import { SetlistPage } from '../features/setlists/pages/SetlistPage';

    // Add route
    <Route path="/setlist/:setlistId" element={<SetlistPage />} />
  VALIDATION: Navigate to /setlist/123 works
```

#### Phase 4.3: Performance Mode (Fullscreen + Keyboard Nav)

```yaml
Task 18: CREATE src/features/setlists/hooks/useFullscreen.ts
  IMPLEMENT: Fullscreen API wrapper hook
  FOLLOW pattern: Research report recommendations (improved version)
  DEPENDENCIES: |
    - Import useRef, useState, useEffect, useCallback from react
    - Import logger from @/lib/logger
  CONTENT: |
    import { useState, useEffect, useCallback, RefObject } from 'react';
    import logger from '@/lib/logger';

    export interface UseFullscreenOptions {
      onOpen?: () => void;
      onClose?: () => void;
      onError?: (error: Error) => void;
    }

    export interface UseFullscreenReturn {
      isFullscreen: boolean;
      enterFullscreen: () => Promise<void>;
      exitFullscreen: () => Promise<void>;
      toggleFullscreen: () => Promise<void>;
    }

    export function useFullscreen(
      elementRef: RefObject<HTMLElement>,
      options: UseFullscreenOptions = {}
    ): UseFullscreenReturn {
      const [isFullscreen, setIsFullscreen] = useState(false);

      // Listen to fullscreenchange events for accurate state tracking
      useEffect(() => {
        const handleChange = () => {
          const isActive = document.fullscreenElement === elementRef.current;
          setIsFullscreen(isActive);

          if (isActive) {
            options.onOpen?.();
          } else {
            options.onClose?.();
          }
        };

        const handleError = () => {
          const error = new Error('Fullscreen request failed');
          options.onError?.(error);
        };

        document.addEventListener('fullscreenchange', handleChange);
        document.addEventListener('fullscreenerror', handleError);

        return () => {
          document.removeEventListener('fullscreenchange', handleChange);
          document.removeEventListener('fullscreenerror', handleError);
        };
      }, [elementRef, options]);

      const enterFullscreen = useCallback(async () => {
        if (!document.fullscreenEnabled || !elementRef.current) {
          const error = new Error('Fullscreen not supported');
          logger.error('Fullscreen not supported');
          options.onError?.(error);
          throw error;
        }

        try {
          await elementRef.current.requestFullscreen();
        } catch (error) {
          logger.error('Failed to enter fullscreen:', error);
          options.onError?.(error as Error);
          throw error;
        }
      }, [elementRef, options]);

      const exitFullscreen = useCallback(async () => {
        if (!document.fullscreenElement) return;

        try {
          await document.exitFullscreen();
        } catch (error) {
          logger.error('Failed to exit fullscreen:', error);
          options.onError?.(error as Error);
          throw error;
        }
      }, [options]);

      const toggleFullscreen = useCallback(async () => {
        if (isFullscreen) {
          await exitFullscreen();
        } else {
          await enterFullscreen();
        }
      }, [isFullscreen, enterFullscreen, exitFullscreen]);

      return {
        isFullscreen,
        enterFullscreen,
        exitFullscreen,
        toggleFullscreen
      };
    }
  PLACEMENT: src/features/setlists/hooks/
  VALIDATION: |
    - Test component can enter/exit fullscreen
    - State syncs when user presses ESC
    - Callbacks fire correctly

Task 19: CREATE src/features/setlists/hooks/useArrowKeyNavigation.ts
  IMPLEMENT: Arrow key navigation hook
  FOLLOW pattern: Research report recommendations
  DEPENDENCIES: |
    - Import useEffect from react
    - Import logger from @/lib/logger
  CONTENT: |
    import { useEffect } from 'react';

    export interface UseArrowKeyNavigationOptions {
      enabled: boolean;
    }

    export function useArrowKeyNavigation(
      currentIndex: number,
      totalItems: number,
      onNavigate: (newIndex: number) => void,
      options: UseArrowKeyNavigationOptions = { enabled: true }
    ): void {
      useEffect(() => {
        if (!options.enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
          // Don't interfere with input fields
          const target = event.target as HTMLElement;
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            return;
          }

          let newIndex = currentIndex;

          switch (event.key) {
            case 'ArrowRight':
            case ' ': // Space
            case 'n':
            case 'N':
              event.preventDefault();
              newIndex = Math.min(currentIndex + 1, totalItems - 1);
              break;

            case 'ArrowLeft':
            case 'p':
            case 'P':
            case 'Backspace':
              event.preventDefault();
              newIndex = Math.max(currentIndex - 1, 0);
              break;

            case 'Home':
              event.preventDefault();
              newIndex = 0;
              break;

            case 'End':
              event.preventDefault();
              newIndex = totalItems - 1;
              break;

            case 'Escape':
              // Handled by fullscreen hook
              break;
          }

          if (newIndex !== currentIndex) {
            onNavigate(newIndex);
          }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }, [currentIndex, totalItems, onNavigate, options.enabled]);
    }
  PLACEMENT: src/features/setlists/hooks/
  VALIDATION: Test keyboard events trigger navigation

Task 20: CREATE src/features/setlists/hooks/usePerformanceMode.ts
  IMPLEMENT: Composite hook combining fullscreen + navigation
  DEPENDENCIES: |
    - Import useFullscreen from ./useFullscreen
    - Import useArrowKeyNavigation from ./useArrowKeyNavigation
    - Import useState, useCallback, RefObject from react
    - Import Arrangement from @/types
  CONTENT: |
    import { useState, useCallback, RefObject } from 'react';
    import { useFullscreen } from './useFullscreen';
    import { useArrowKeyNavigation } from './useArrowKeyNavigation';
    import type { Arrangement } from '@/types';

    export interface UsePerformanceModeOptions {
      arrangements: Arrangement[];
      initialIndex?: number;
      onExit?: () => void;
    }

    export interface UsePerformanceModeReturn {
      currentIndex: number;
      currentArrangement: Arrangement | null;
      isFullscreen: boolean;
      nextArrangement: () => void;
      previousArrangement: () => void;
      goToArrangement: (index: number) => void;
      enterFullscreen: () => Promise<void>;
      exitFullscreen: () => Promise<void>;
      toggleFullscreen: () => Promise<void>;
    }

    export function usePerformanceMode(
      containerRef: RefObject<HTMLElement>,
      options: UsePerformanceModeOptions
    ): UsePerformanceModeReturn {
      const { arrangements, initialIndex = 0, onExit } = options;
      const [currentIndex, setCurrentIndex] = useState(initialIndex);

      const {
        isFullscreen,
        enterFullscreen,
        exitFullscreen,
        toggleFullscreen
      } = useFullscreen(containerRef, {
        onClose: onExit
      });

      useArrowKeyNavigation(
        currentIndex,
        arrangements.length,
        setCurrentIndex,
        { enabled: isFullscreen }
      );

      const nextArrangement = useCallback(() => {
        setCurrentIndex(prev => Math.min(prev + 1, arrangements.length - 1));
      }, [arrangements.length]);

      const previousArrangement = useCallback(() => {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
      }, []);

      const goToArrangement = useCallback((index: number) => {
        if (index >= 0 && index < arrangements.length) {
          setCurrentIndex(index);
        }
      }, [arrangements.length]);

      return {
        currentIndex,
        currentArrangement: arrangements[currentIndex] || null,
        isFullscreen,
        nextArrangement,
        previousArrangement,
        goToArrangement,
        enterFullscreen,
        exitFullscreen,
        toggleFullscreen
      };
    }
  PLACEMENT: src/features/setlists/hooks/
  VALIDATION: Test composite hook integrates both features

Task 21: CREATE src/features/setlists/components/PerformanceControls.tsx
  IMPLEMENT: Control toolbar for performance mode
  DEPENDENCIES: |
    - Import Button from @/components/ui/button
    - Import ChevronLeft, ChevronRight, Maximize2, Minimize2, X from lucide-react
  CONTENT: |
    import { Button } from '@/components/ui/button';
    import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from 'lucide-react';

    interface PerformanceControlsProps {
      isFullscreen: boolean;
      onToggleFullscreen: () => void;
      onExit: () => void;
      canGoNext: boolean;
      canGoPrevious: boolean;
      onNext: () => void;
      onPrevious: () => void;
    }

    export default function PerformanceControls({
      isFullscreen,
      onToggleFullscreen,
      onExit,
      canGoNext,
      canGoPrevious,
      onNext,
      onPrevious
    }: PerformanceControlsProps) {
      return (
        <div
          className="performance-controls flex items-center gap-2 p-4 bg-background border-b"
          role="toolbar"
          aria-label="Performance controls"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            aria-label="Previous arrangement"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            disabled={!canGoNext}
            aria-label="Next arrangement"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          <div className="flex-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-6 w-6" />
            ) : (
              <Maximize2 className="h-6 w-6" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onExit}
            aria-label="Exit performance mode"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      );
    }
  PLACEMENT: src/features/setlists/components/
  VALIDATION: Buttons render and trigger callbacks

Task 22: CREATE src/features/setlists/components/PerformanceProgressBar.tsx
  IMPLEMENT: Progress indicator showing position
  DEPENDENCIES: |
    - Import cn from @/lib/utils
  CONTENT: |
    import { cn } from '@/lib/utils';

    interface PerformanceProgressBarProps {
      currentIndex: number;
      total: number;
      onNavigate?: (index: number) => void;
    }

    export default function PerformanceProgressBar({
      currentIndex,
      total,
      onNavigate
    }: PerformanceProgressBarProps) {
      const percentage = (currentIndex / (total - 1)) * 100;

      return (
        <div className="performance-progress p-4 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {currentIndex + 1} of {total}
            </span>
          </div>

          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {onNavigate && (
            <div className="flex gap-1 mt-2">
              {Array.from({ length: total }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => onNavigate(index)}
                  className={cn(
                    'flex-1 h-1 rounded-full transition-colors',
                    index === currentIndex ? 'bg-primary' : 'bg-muted'
                  )}
                  aria-label={`Go to arrangement ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      );
    }
  PLACEMENT: src/features/setlists/components/
  VALIDATION: Progress updates as currentIndex changes

Task 23: CREATE src/features/setlists/pages/SetlistPerformancePage.tsx
  IMPLEMENT: Fullscreen performance mode page
  DEPENDENCIES: |
    - Import useParams, useNavigate from react-router-dom
    - Import useRef, useEffect from react
    - Import usePerformanceMode from ../hooks/usePerformanceMode
    - Import useSetlistData from ../hooks/useSetlistData
    - Import ChordProViewer from @/features/chordpro
    - Import PerformanceControls from ../components/PerformanceControls
    - Import PerformanceProgressBar from ../components/PerformanceProgressBar
    - Import PageSpinner from @/features/shared/components/LoadingStates
  CONTENT: |
    import { useParams, useNavigate } from 'react-router-dom';
    import { useRef, useEffect } from 'react';
    import { usePerformanceMode } from '../hooks/usePerformanceMode';
    import { useSetlistData } from '../hooks/useSetlistData';
    import ChordProViewer from '@/features/chordpro';
    import PerformanceControls from '../components/PerformanceControls';
    import PerformanceProgressBar from '../components/PerformanceProgressBar';
    import { PageSpinner } from '@/features/shared/components/LoadingStates';

    export function SetlistPerformancePage() {
      const { setlistId, arrangementIndex = '0' } = useParams();
      const navigate = useNavigate();
      const containerRef = useRef<HTMLDivElement>(null);

      const { setlist, arrangements, loading, error } = useSetlistData(setlistId);

      // Convert arrangements map to array
      const arrangementArray = setlist?.songs
        .map(song => arrangements.get(song.arrangementId))
        .filter((arr): arr is Arrangement => arr !== undefined) || [];

      const {
        currentIndex,
        currentArrangement,
        isFullscreen,
        nextArrangement,
        previousArrangement,
        goToArrangement,
        toggleFullscreen
      } = usePerformanceMode(containerRef, {
        arrangements: arrangementArray,
        initialIndex: parseInt(arrangementIndex, 10),
        onExit: () => navigate(`/setlist/${setlistId}`)
      });

      // Sync URL with current index
      useEffect(() => {
        navigate(`/setlist/${setlistId}/performance/${currentIndex}`, { replace: true });
      }, [currentIndex, setlistId, navigate]);

      if (loading) return <PageSpinner message="Loading performance mode..." />;
      if (error || !setlist) return <div>Error: {error || 'Setlist not found'}</div>;

      return (
        <div
          ref={containerRef}
          role="application"
          aria-label="Setlist performance mode"
          className="performance-mode-container min-h-screen bg-background"
        >
          {/* Screen reader instructions */}
          <div className="sr-only">
            Use arrow keys to navigate between arrangements.
            Press F to toggle fullscreen.
            Press Escape to exit performance mode.
          </div>

          <PerformanceControls
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            onExit={() => navigate(`/setlist/${setlistId}`)}
            canGoNext={currentIndex < arrangementArray.length - 1}
            canGoPrevious={currentIndex > 0}
            onNext={nextArrangement}
            onPrevious={previousArrangement}
          />

          <PerformanceProgressBar
            currentIndex={currentIndex}
            total={arrangementArray.length}
            onNavigate={goToArrangement}
          />

          {currentArrangement && (
            <div className="performance-content p-8">
              <ChordProViewer
                content={currentArrangement.chordProContent}
                arrangementMetadata={{
                  key: currentArrangement.key,
                  tempo: currentArrangement.tempo,
                  capo: currentArrangement.capo,
                  timeSignature: currentArrangement.timeSignature
                }}
                showChords={true}
                showToggle={false}
              />
            </div>
          )}
        </div>
      );
    }
  PLACEMENT: src/features/setlists/pages/
  VALIDATION: |
    - Fullscreen button works
    - Arrow keys navigate
    - ESC exits fullscreen
    - Progress bar updates
    - ChordPro displays correctly

Task 24: UPDATE src/app/App.tsx (Add Performance Route)
  IMPLEMENT: Add performance mode route
  CONTENT: |
    import { SetlistPerformancePage } from '../features/setlists/pages/SetlistPerformancePage';

    // Add route
    <Route path="/setlist/:setlistId/performance/:arrangementIndex?" element={<SetlistPerformancePage />} />
  VALIDATION: Navigate to /setlist/123/performance/0 works
```

#### Phase 4.4: Sharing (Optional for MVP)

```yaml
Task 25: INSTALL nanoid
  COMMAND: npm install nanoid
  VALIDATION: package.json includes nanoid

Task 26: CREATE src/features/setlists/utils/shareIdGenerator.ts
  IMPLEMENT: Generate/validate share IDs with nanoid
  FOLLOW pattern: Research report recommendations (12-char lowercase+numbers)
  DEPENDENCIES: Import customAlphabet from nanoid
  CONTENT: |
    import { customAlphabet } from 'nanoid';

    const createReadableId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);

    export function generateShareId(): string {
      return createReadableId();
    }

    export function isValidShareId(id: string): boolean {
      const readablePattern = /^[0-9a-z]+$/;
      return readablePattern.test(id) && id.length === 12;
    }
  PLACEMENT: src/features/setlists/utils/
  VALIDATION: |
    - Generate 1000 IDs, ensure all unique
    - Test isValidShareId with valid/invalid inputs

Task 27: UPDATE src/types/Database.types.ts (Add shareId field)
  IMPLEMENT: Add shareId and isPublic fields to Setlist interface
  CONTENT: |
    export interface Setlist {
      id: string;
      shareId?: string;              // ← ADD THIS
      name: string;
      description?: string;
      performanceDate?: string;
      isPublic?: boolean;            // ← ADD THIS
      songs: SetlistSong[];
      createdAt: string;
      updatedAt: string;
      syncStatus?: 'pending' | 'synced' | 'conflict';
      version?: number;
      lastAccessedAt?: number;
    }
  VALIDATION: TypeScript compiles

Task 28: CREATE Migration v5 for shareId index
  FILE: src/features/pwa/db/migrations.ts
  IMPLEMENT: Add migration for shareId index
  CONTENT: |
    // Add to MIGRATIONS record
    5: 'Add shareId index for setlist sharing'

    // Add migration handler
    function addShareIdIndex(
      db: IDBPDatabase<HSASongbookDB>,
      transaction: IDBPTransaction<HSASongbookDB, ArrayLike<keyof HSASongbookDB>, 'versionchange'>
    ): void {
      const setlistsStore = transaction.objectStore('setlists');
      if (!setlistsStore.indexNames.contains('by-share-id')) {
        setlistsStore.createIndex('by-share-id', 'shareId', { unique: true });
      }
    }

    // Add to migrationHandlers
    const migrationHandlers: Record<number, MigrationHandler> = {
      // ... existing handlers
      5: addShareIdIndex
    };
  VALIDATION: Run app, check IndexedDB has new index

Task 29: UPDATE src/features/pwa/db/repository.ts (Add findByShareId)
  IMPLEMENT: Add method to SetlistRepository
  CONTENT: |
    async findByShareId(shareId: string): Promise<Setlist | undefined> {
      const db = await this.getDB();
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const index = store.index('by-share-id');
      return await index.get(shareId);
    }
  VALIDATION: Test querying by shareId

Task 30: CREATE src/features/setlists/components/ShareButton.tsx
  IMPLEMENT: Copy share link button with toast
  DEPENDENCIES: |
    - Import Button from @/components/ui/button
    - Import Share2 from lucide-react
  CONTENT: |
    import { useState } from 'react';
    import { Button } from '@/components/ui/button';
    import { Share2, Check } from 'lucide-react';

    interface ShareButtonProps {
      shareId: string;
    }

    export default function ShareButton({ shareId }: ShareButtonProps) {
      const [copied, setCopied] = useState(false);

      const handleCopy = async () => {
        const shareUrl = `${window.location.origin}/share/${shareId}`;
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      };

      return (
        <Button
          variant="outline"
          onClick={handleCopy}
          disabled={!shareId}
        >
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Share2 className="mr-2 h-4 w-4" />
              Copy Share Link
            </>
          )}
        </Button>
      );
    }
  PLACEMENT: src/features/setlists/components/
  VALIDATION: Button copies URL to clipboard

Task 31: CREATE src/features/setlists/pages/SharedSetlistPage.tsx
  IMPLEMENT: View shared setlist (read-only)
  DEPENDENCIES: |
    - Import useParams from react-router-dom
    - Import SetlistRepository from @/features/pwa/db/repository
    - Import isValidShareId from ../utils/shareIdGenerator
  CONTENT: |
    import { useParams } from 'react-router-dom';
    import { useState, useEffect } from 'react';
    import { SetlistRepository } from '@/features/pwa/db/repository';
    import { isValidShareId } from '../utils/shareIdGenerator';
    import { PageSpinner } from '@/features/shared/components/LoadingStates';
    import type { Setlist } from '@/types';

    export function SharedSetlistPage() {
      const { shareId } = useParams<{ shareId: string }>();
      const [setlist, setSetlist] = useState<Setlist | null>(null);
      const [error, setError] = useState<string | null>(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        const loadSetlist = async () => {
          if (!shareId || !isValidShareId(shareId)) {
            setError('Invalid share link');
            setLoading(false);
            return;
          }

          const repo = new SetlistRepository();
          const found = await repo.findByShareId(shareId);

          if (!found) {
            setError('Setlist not found');
          } else if (!found.isPublic) {
            setError('This setlist is private');
          } else {
            setSetlist(found);
          }

          setLoading(false);
        };

        loadSetlist();
      }, [shareId]);

      if (loading) return <PageSpinner message="Loading shared setlist..." />;
      if (error) return <div>Error: {error}</div>;
      if (!setlist) return <div>Setlist not found</div>;

      return (
        <div className="min-h-screen bg-background p-8">
          <h1 className="text-3xl font-bold mb-4">{setlist.name}</h1>
          <p className="text-muted-foreground mb-8">{setlist.description}</p>
          {/* Render songs read-only */}
        </div>
      );
    }
  PLACEMENT: src/features/setlists/pages/
  VALIDATION: |
    - Valid shareId loads setlist
    - Invalid shareId shows error
    - Private setlist blocked

Task 32: UPDATE src/app/App.tsx (Add Share Route)
  IMPLEMENT: Add route for shared setlists
  CONTENT: |
    import { SharedSetlistPage } from '../features/setlists/pages/SharedSetlistPage';

    // Add route
    <Route path="/share/:shareId" element={<SharedSetlistPage />} />
  VALIDATION: Navigate to /share/abc123def456 works
```

### Integration Points & Cross-Slice Dependencies

**CRITICAL: Minimize cross-slice dependencies to maintain architectural boundaries**

```yaml
WITHIN SLICE (Self-contained):
  - All setlist domain logic (CRUD, sorting, validation)
  - Setlist-specific types and interfaces
  - Setlist-specific UI components
  - Performance mode hooks and components
  - Share ID generation

SHARED/COMMON DEPENDENCIES (Allowed):
  - src/components/ui/ → shadcn/ui primitives (Button, Card, Dialog, Input)
  - src/lib/logger → Production-safe logging
  - src/lib/utils → Tailwind cn() utility
  - src/features/shared/components/ → Breadcrumbs, LoadingStates, PageTransition
  - src/features/shared/hooks/ → useNavigation (breadcrumbs)

CROSS-SLICE DEPENDENCIES (Minimize & Make Explicit):
  - src/features/chordpro → ChordProViewer (for performance mode)
    WHY: Need to display arrangements in fullscreen
    IMPORT: From index.ts public API only

  - src/features/arrangements → ArrangementCard (for song picker)
    WHY: Reuse existing arrangement display in add song modal
    IMPORT: From index.ts public API only

  - src/features/search → SearchBar (for song search modal)
    WHY: Reuse existing search functionality
    IMPORT: From index.ts public API only

  - src/features/pwa/db → SetlistRepository (already implemented)
    WHY: Database access layer
    IMPORT: From repository.ts (infrastructure layer, not a feature)

BACKEND INTEGRATION (Phase 5 - Future):
  - API routes: None (Phase 4 is local-only)
  - Database: IndexedDB only (no Supabase yet)
  - Sync: Queue operations for Phase 5

ROUTING:
  - /setlists → SetlistsIndexPage
  - /setlist/:setlistId → SetlistPage
  - /setlist/:setlistId/performance/:index? → SetlistPerformancePage
  - /share/:shareId → SharedSetlistPage (Phase 4.4)
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint                    # ESLint checks with TypeScript rules
npm run typecheck               # TypeScript type checking (strict mode)

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test utilities
npm test -- src/features/setlists/utils/setlistSorter.test.ts
npm test -- src/features/setlists/utils/setlistValidation.test.ts
npm test -- src/features/setlists/utils/shareIdGenerator.test.ts

# Test hooks
npm test -- src/features/setlists/hooks/useSetlists.test.ts
npm test -- src/features/setlists/hooks/useFullscreen.test.ts

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Development server validation
npm run dev
# Navigate to http://localhost:5173/setlists
# Expected: Page loads, no console errors

# Create setlist flow
# 1. Click "New Setlist" button
# 2. Fill form, submit
# 3. Verify setlist appears in list
# Expected: Setlist created and persisted to IndexedDB

# Drag-and-drop validation
# Navigate to /setlist/[id]
# Drag song items to reorder
# Expected: Order persists after page refresh

# Performance mode validation
# Click "Performance Mode" on setlist
# Use arrow keys to navigate
# Press F to toggle fullscreen
# Expected: Navigation works, fullscreen works

# Production build validation
npm run build
npm run preview
# Expected: Successful build, PWA works offline
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Vertical Slice Architecture Validation:

# Check feature slice isolation
find src/features/setlists -name "*.ts" -o -name "*.tsx" | xargs grep -l "from.*features/[^setlists]"
# Expected: Only imports from shared/, chordpro/, arrangements/, search/ (via index.ts)

# Validate slice completeness
ls -la src/features/setlists/
# Expected: types/, components/, hooks/, pages/, utils/, index.ts all present

# Check circular dependencies
npx madge --circular --extensions ts,tsx src/features/setlists
# Expected: No circular dependencies within slice

# Test slice in isolation
npm test -- src/features/setlists
# Expected: All tests pass without external feature dependencies

# TypeScript Strict Mode Validation:
npm run typecheck
# Expected: Zero errors with strictNullChecks enabled

# Check for any types
grep -r "any" src/features/setlists --include="*.ts" --include="*.tsx" | grep -v "// "
# Expected: Zero matches (ESLint will catch these anyway)

# IndexedDB Validation:
# Open DevTools → Application → IndexedDB → HSASongbookDB
# Check setlists object store exists
# Check indexes: by-name, by-performance-date, by-updated, by-sync-status
# Expected: Store and indexes present

# PWA Offline Validation:
# Open app in browser
# Go offline (DevTools → Network → Offline)
# Create setlist
# Reorder songs
# Navigate to performance mode
# Expected: All functionality works offline

# Accessibility Validation:
# Run Lighthouse audit (Performance, Accessibility, Best Practices, SEO)
npm run pwa:audit
# Expected: Accessibility score > 90

# Keyboard navigation test
# Tab through all interactive elements
# Use Space to grab drag items, arrows to reorder
# Use arrow keys in performance mode
# Expected: All functionality accessible via keyboard

# @dnd-kit Validation:
# Test drag-and-drop on desktop (mouse)
# Test on mobile (touch)
# Test keyboard navigation (Space + arrows)
# Expected: All input methods work

# Fullscreen API Validation:
# Test on desktop Chrome/Firefox/Safari
# Test on iPad Safari
# Test on Android Chrome
# Note: iPhone Safari does NOT support fullscreen API
# Expected: Works on desktop + tablet (not iPhone)

# Share URL Validation (Phase 4.4):
curl http://localhost:5173/share/abc123def456
# Expected: Loads shared setlist or shows error

# Bundle Size Analysis:
npm run build
# Check dist/ folder size
# Expected: Reasonable increase (~50KB for @dnd-kit, ~10KB for nanoid)
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run typecheck` (strict mode)
- [ ] Production build succeeds: `npm run build`
- [ ] PWA preview works: `npm run preview`
- [ ] Offline functionality confirmed (IndexedDB persists)

### Feature Validation (Phase 4.1 - Basic CRUD)

- [ ] User can create setlist with name, description, performance date
- [ ] User can view list of all setlists
- [ ] User can delete setlist with confirmation
- [ ] Setlists persist in IndexedDB across sessions
- [ ] Works offline (PWA)
- [ ] Sort by name, date, recent works correctly
- [ ] Empty state displays when no setlists

### Feature Validation (Phase 4.2 - Drag-and-Drop)

- [ ] User can reorder songs by dragging (mouse)
- [ ] User can reorder songs by touch (tablet/mobile)
- [ ] User can reorder songs with keyboard (Space + arrows)
- [ ] Visual feedback during drag (opacity, transform)
- [ ] Order persists to IndexedDB immediately
- [ ] Drag handle is separate from card (doesn't drag when clicking elsewhere)

### Feature Validation (Phase 4.3 - Performance Mode)

- [ ] Fullscreen button enters performance mode
- [ ] Arrow keys navigate between arrangements (Right/Space = next, Left/Backspace = previous)
- [ ] Home/End keys jump to first/last arrangement
- [ ] ESC exits fullscreen
- [ ] Progress indicator shows current position (e.g., "3 of 7")
- [ ] ChordPro viewer displays with chords visible
- [ ] Works on desktop and tablet
- [ ] State syncs when user presses ESC or F11
- [ ] URL updates with current arrangement index

### Feature Validation (Phase 4.4 - Sharing - Optional)

- [ ] Generate unique shareId on setlist creation (12-char nanoid)
- [ ] Share URL route `/share/:shareId` works
- [ ] Public/private toggle on setlist
- [ ] Copy link button works and shows "Copied!" feedback
- [ ] Shared setlist loads correctly
- [ ] Private setlists blocked from sharing
- [ ] Invalid shareId shows error

### Code Quality Validation

- [ ] Follows existing TypeScript/React patterns
- [ ] File placement matches desired codebase tree structure
- [ ] **Vertical slice architecture maintained**: Feature is self-contained and complete
- [ ] **Cross-slice dependencies minimized**: Only imports from other slices' public APIs
- [ ] **Slice boundaries respected**: No violations of existing feature boundaries
- [ ] Anti-patterns avoided (check Anti-Patterns section)
- [ ] Dependencies properly managed (package.json updated)
- [ ] No console.log statements (use logger from @/lib/logger)
- [ ] All components memoized where appropriate (React.memo)

### TypeScript Specific

- [ ] Proper TypeScript interfaces and types defined
- [ ] Zero `any` types (ESLint enforces this)
- [ ] Explicit return types for all functions
- [ ] Optional chaining (?.) used for null safety
- [ ] Nullish coalescing (??) used for default values
- [ ] Strict mode passes: `npm run typecheck`

### Accessibility

- [ ] All interactive elements keyboard accessible
- [ ] ARIA labels on buttons (aria-label)
- [ ] Screen reader instructions provided (sr-only class)
- [ ] Focus indicators visible
- [ ] Lighthouse accessibility score > 90
- [ ] Keyboard navigation tested (no mouse/touchpad)

### Performance

- [ ] No unnecessary re-renders (React DevTools Profiler)
- [ ] Repositories memoized (useMemo)
- [ ] Expensive operations memoized (useMemo, useCallback)
- [ ] List items use React.memo
- [ ] Bundle size increase reasonable (check `npm run build` output)

### Documentation

- [ ] Code is self-documenting with clear TypeScript types
- [ ] Props interfaces properly documented
- [ ] No need for README updates (feature self-contained)

---

## Anti-Patterns to Avoid

**General Anti-Patterns:**
- ❌ Don't create new patterns when existing ones work
- ❌ Don't skip validation because "it should work"
- ❌ Don't ignore failing tests - fix them immediately
- ❌ Don't hardcode values that should be config
- ❌ Don't catch all exceptions - be specific
- ❌ Don't use console.log - use logger from @/lib/logger

**Vertical Slice Architecture Anti-Patterns:**
- ❌ Don't create direct imports between feature slices - use public APIs only (import from index.ts)
- ❌ Don't put shared business logic in setlists/ that others depend on - move to shared/
- ❌ Don't create incomplete slices missing layers (e.g., UI without corresponding hooks)
- ❌ Don't violate slice boundaries for "convenience" - maintain architectural discipline
- ❌ Don't create circular dependencies between slices
- ❌ Don't bypass the slice's public API (index.ts) when importing from other features

**TypeScript Anti-Patterns:**
- ❌ Don't use `any` type - ESLint will fail (use `unknown` with type guards)
- ❌ Don't skip type definitions for function parameters and return values
- ❌ Don't use implicit types - be explicit
- ❌ Don't ignore TypeScript errors - fix them
- ❌ Don't use `@ts-ignore` without excellent justification

**@dnd-kit Anti-Patterns:**
- ❌ Don't use numeric IDs - must be strings
- ❌ Don't forget to spread `{...attributes}` and `{...listeners}`
- ❌ Don't misalign SortableContext items with map keys
- ❌ Don't forget to check if `over` is null in onDragEnd
- ❌ Don't apply parent transforms - breaks positioning

**Fullscreen API Anti-Patterns:**
- ❌ Don't try to auto-start fullscreen - must be user-initiated
- ❌ Don't manually track fullscreen state without listening to events
- ❌ Don't forget to check `document.fullscreenEnabled` before requesting
- ❌ Don't assume fullscreen works on iPhone Safari (it doesn't)

**IndexedDB Anti-Patterns:**
- ❌ Don't create new SetlistRepository - it already exists, import it
- ❌ Don't forget to memoize repository instances
- ❌ Don't skip quota checks before large writes
- ❌ Don't forget cleanup strategies for old data

**React 19 Anti-Patterns:**
- ❌ Don't create new instances of repositories on every render
- ❌ Don't forget useCallback for async operations
- ❌ Don't skip React.memo on list items
- ❌ Don't forget cleanup in useEffect return functions

**PWA Anti-Patterns:**
- ❌ Don't assume online connectivity - design offline-first
- ❌ Don't skip IndexedDB error handling
- ❌ Don't forget to test offline scenarios

---

## PRP Quality Score

**Confidence Level for One-Pass Implementation**: **9.5/10**

**Justification**:
- ✅ **Complete Context**: All research reports included (vertical slice patterns, IndexedDB, @dnd-kit, fullscreen, nanoid)
- ✅ **Existing Infrastructure**: SetlistRepository already implemented, database schema complete
- ✅ **Clear Patterns**: Detailed examples from existing codebase (arrangements, chordpro features)
- ✅ **Library Documentation**: Comprehensive links to official docs with critical gotchas highlighted
- ✅ **Executable Validation**: All validation gates are runnable commands
- ✅ **Vertical Slice Design**: Complete slice structure defined from types to UI
- ✅ **TypeScript Strict Mode**: Full type safety enforced throughout
- ✅ **User Clarifications**: All scope questions answered (local-only, no export, transposition live, etc.)
- ⚠️ **Minor Unknowns**: Song search modal implementation details not fully specified (can adapt SearchBar component)

**Deductions**:
- -0.5: Song search modal for adding songs to setlist needs some design decisions (modal vs. page, keyboard shortcuts)

**Strengths**:
1. Comprehensive research with 5 parallel agent investigations
2. Existing SetlistRepository eliminates database implementation risk
3. Clear TypeScript patterns with strict mode enforcement
4. Detailed @dnd-kit integration guidance with gotchas
5. Step-by-step task breakdown following vertical slice architecture
6. All dependencies already researched (no unknowns)

**Conclusion**: This PRP provides sufficient context for a skilled TypeScript/React developer to implement Phase 4 setlist management in one pass with high confidence.
