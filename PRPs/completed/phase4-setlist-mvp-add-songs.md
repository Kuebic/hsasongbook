# Phase 4: Setlist MVP - Add Songs & Key Editing (TypeScript PRP)

**Version**: 1.0
**Created**: 2025-01-09
**Status**: Ready for Implementation
**Confidence Score**: 9/10

---

## Goal

**Feature Goal**: Enable users to add arrangements to setlists via search dialog and adjust per-song keys inline, completing the core setlist management MVP.

**Deliverable**:
- `AddArrangementModal` component with search functionality
- Inline key selector in `SetlistSongItem` component
- Integration wiring in `SetlistPage.tsx`

**Success Definition**:
- ✅ Click "Add Song" button opens search modal
- ✅ Search filters arrangements by title, artist, or key (debounced, 300ms)
- ✅ Select arrangement adds it to setlist (closes modal, updates UI)
- ✅ Each setlist song displays inline key selector (dropdown)
- ✅ Changing key updates `customKey` and persists to IndexedDB immediately
- ✅ Performance mode navigation works (ALREADY IMPLEMENTED - no changes needed)
- ✅ All validation gates pass: `npm run typecheck && npm run lint && npm run build`

## User Persona

**Target User**: Worship leader preparing Sunday morning setlist

**Use Case**: Building a 6-song setlist for upcoming service

**User Journey**:
1. Opens existing setlist "Sunday Worship - Jan 19, 2025"
2. Clicks "Add Song" button → Modal opens with search input
3. Types "amazing g" → Filters show "Amazing Grace" arrangements
4. Sees "Amazing Grace - Classic (Key: G, Rating: 4.8★)"
5. Clicks arrangement → Modal closes, song appears in setlist at bottom
6. Notices vocalist prefers D instead of G
7. Clicks inline key dropdown next to song → Selects "D"
8. Key updates instantly (no save button needed)
9. Repeats for 5 more songs, reorders via drag-and-drop
10. Clicks "Performance Mode" → Full-screen navigation works

**Pain Points Addressed**:
- ❌ **Before**: Placeholder "Add Song" button does nothing
- ✅ **After**: Functional search modal with instant filtering
- ❌ **Before**: Cannot adjust keys per song in setlist context
- ✅ **After**: Inline dropdown for immediate key changes

## Why

- **MVP Completion**: Last missing piece for testable setlist management
- **User Testing**: Enable real-world testing of setlist workflow end-to-end
- **Foundation**: Establishes patterns for future features (sharing, export, collaboration)
- **Integration**: Connects existing search, arrangement, and setlist features

## What

### User-Visible Behavior

**1. Add Song Modal** (`AddArrangementModal`):
- Triggered by clicking "Add Song" button in `SetlistPage`
- Modal displays:
  - Search input with placeholder "Search by song title, artist, or key..."
  - Filtered arrangement list (shows song title, artist, key, rating)
  - Empty state: "No arrangements found" with icon
  - Loading state: Spinner while fetching from IndexedDB
- Keyboard navigation:
  - Arrow keys (↑↓) navigate results
  - Enter selects highlighted arrangement
  - Escape closes modal
- Selecting arrangement:
  - Adds to setlist with arrangement's default key as `customKey`
  - Closes modal automatically
  - UI updates immediately (no page refresh)

**2. Inline Key Selector** (in `SetlistSongItem`):
- Dropdown button showing current key (e.g., "G")
- Click opens dropdown with all 12 keys (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
- Original key indicated with "(Original)" label
- Selecting new key:
  - Updates `customKey` field on `SetlistSong`
  - Persists to IndexedDB via `useSetlistSongs.updateSongKey()`
  - No "Save" button required (immediate persistence)
  - Visual feedback: Key button updates instantly

**3. Integration** (in `SetlistPage`):
- "Add Song" button wired to `useState` for modal open/close
- Modal receives `onAdd` callback that calls `addSong()` from `useSetlistSongs`
- After adding song, setlist re-renders with updated `songs` array

### Technical Requirements

**TypeScript Strict Mode**:
- ✅ All components fully typed with interfaces
- ✅ No `any` types (ESLint enforces `@typescript-eslint/no-explicit-any: error`)
- ✅ Explicit return types on functions
- ✅ Props interfaces with proper optional (`?`) markers

**Performance**:
- ✅ Debounced search (300ms) prevents excessive re-renders
- ✅ Client-side filtering (fast for <500 arrangements)
- ✅ Memoized filtered results with `useMemo`
- ✅ IndexedDB operations batched (single transaction for add)

**Accessibility**:
- ✅ ARIA attributes: `role="combobox"`, `aria-expanded`, `aria-activedescendant`
- ✅ Keyboard navigation with arrow keys + Enter
- ✅ Focus management (auto-focus search input on modal open)
- ✅ Screen reader labels (`aria-label`, `sr-only` hints)

### Success Criteria

**Functional**:
- [x] Add Song modal opens from button click
- [x] Search input filters arrangements in real-time (debounced 300ms)
- [x] Selecting arrangement adds it to setlist and closes modal
- [x] Inline key selector displays current key with dropdown
- [x] Changing key via dropdown persists to IndexedDB immediately
- [x] Empty state shows when no search results
- [x] Loading state shows while fetching IndexedDB data
- [x] Keyboard navigation works (arrow keys, Enter, Escape)

**Code Quality**:
- [x] TypeScript strict mode compliance (zero errors)
- [x] No `any` types used
- [x] Proper ARIA attributes for accessibility
- [x] Memoization prevents unnecessary re-renders
- [x] Follows existing codebase patterns (hooks, components, vertical slice)

**Validation**:
- [x] `npm run typecheck` passes (0 errors)
- [x] `npm run lint` passes (0 errors, 0 warnings)
- [x] `npm run build` succeeds (<5 seconds)
- [x] Manual testing: Add 5 songs, change keys, navigate performance mode

---

## All Needed Context

### Context Completeness Check

✅ **"No Prior Knowledge" Test Applied**: An AI agent unfamiliar with this codebase can implement this feature successfully using only this PRP and codebase access.

**What's Included**:
- ✅ Complete type definitions for all interfaces
- ✅ Exact file paths with patterns to follow
- ✅ IndexedDB integration patterns from existing repositories
- ✅ shadcn/ui Dialog usage (controlled state, onOpenChange)
- ✅ Debounce hook implementation (custom TypeScript)
- ✅ Keyboard navigation patterns with ARIA
- ✅ Inline dropdown selector pattern for key editing
- ✅ Integration points with existing hooks (`useSetlistSongs`, `useSetlistData`)

### Documentation & References

```yaml
# External Documentation (MUST READ)
- url: https://ui.shadcn.com/docs/components/dialog
  why: Controlled Dialog pattern with open/onOpenChange
  critical: |
    - Use controlled state: open={showModal} onOpenChange={setShowModal}
    - Close modal programmatically: setShowModal(false) after adding song
    - DialogContent provides automatic focus trap and ESC handling

- url: https://www.radix-ui.com/primitives/docs/components/select#root
  why: Select.Root API for inline key selector (controlled value, onValueChange)
  critical: |
    - onValueChange fires immediately (no submit button needed)
    - Use value={song.customKey || arrangement.key} for initial state
    - SelectItem requires unique string value prop

- url: https://ui.shadcn.com/docs/components/input
  why: Input component API for search field
  critical: |
    - type="search" enables browser clear button
    - autoFocus prop for modal UX

# Codebase Patterns (MUST REFERENCE - Read these files!)
- file: src/features/setlists/pages/SetlistsIndexPage.tsx
  why: Dialog integration pattern (open state, onOpenChange callback)
  pattern: |
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent>
        <SetlistForm onSubmit={handleSubmit} onCancel={() => setShowCreateDialog(false)} />
      </DialogContent>
    </Dialog>
  gotcha: |
    - onOpenChange handles both user clicking X and backdrop
    - Modal close is controlled by parent component state

- file: src/features/setlists/hooks/useSetlistSongs.ts
  why: addSong() method signature and usage pattern
  pattern: |
    const { addSong, removeSong, reorderSongs } = useSetlistSongs(setlist, onUpdate);
    await addSong(arrangementId, customKey); // Returns Promise<void>
  gotcha: |
    - addSong is async (await it!)
    - onUpdate callback receives updated Setlist (not void)
    - SetlistSong.id is auto-generated (don't provide it)

- file: src/features/arrangements/hooks/useArrangementData.ts
  why: Data fetching hook pattern with loading/error states
  pattern: |
    useState<T | null>(null) for data
    useState<boolean>(true) for loading
    useState<string | null>(null) for error
    useMemo(() => new Repository(), []) for repository instance
    useEffect with async loadData function
  gotcha: |
    - Repository must be memoized to prevent infinite loops
    - Use Promise.all([repo1.getAll(), repo2.getAll()]) for parallel fetches

- file: src/features/setlists/components/SetlistSongItem.tsx
  why: Existing component structure to extend with inline key selector
  pattern: |
    - Uses Card component from shadcn/ui
    - Displays song index, title, artist, key
    - Has drag handle (GripVertical icon) and remove button (X icon)
  gotcha: |
    - Component is wrapped by @dnd-kit/sortable (useSortable hook)
    - Don't break drag handle by adding interactive elements inside it
    - Use setActivatorNodeRef for drag handle, not setNodeRef

- file: src/features/chordpro/components/DraftRecoveryDialog.tsx
  why: Example of modal with custom close handling (onPointerDownOutside)
  pattern: |
    - Custom dialog that prevents accidental closure
    - Manual control via onClose callback
    - Three-button footer (Cancel, Discard, Apply)
  gotcha: Not directly applicable (AddArrangementModal is simpler, single selection)

- file: src/features/shared/hooks/useAutoSave.ts
  why: Debounce pattern with TypeScript
  pattern: |
    useCallback with setTimeout/clearTimeout
    useEffect cleanup to clear timeout
    Memoized callback prevents recreating timeout on every render
  gotcha: Debounce delay should match user expectation (300ms for search)

# Types (Critical for TypeScript)
- file: src/types/Database.types.ts (lines 94-113)
  why: Setlist and SetlistSong interface definitions
  pattern: |
    export interface Setlist {
      id: string;
      name: string;
      songs: SetlistSong[];
      updatedAt: string;
    }
    export interface SetlistSong {
      id: string;          // Auto-generated by useSetlistSongs
      songId: string;      // For future use (Phase 5)
      arrangementId: string; // FK to arrangements table
      order: number;       // Position in setlist (0-indexed)
      customKey?: string;  // Override arrangement.key (THIS IS WHAT WE'RE EDITING!)
      notes?: string;      // Optional performance notes
    }
  gotcha: |
    - customKey is optional (use arrangement.key as fallback)
    - order is maintained automatically by useSetlistSongs.reorderSongs()

- file: src/types/Arrangement.types.ts
  why: Arrangement interface for search results
  pattern: |
    export interface Arrangement {
      id: string;
      name: string;
      songId: string;
      key: string;         // Musical key (C, C#, D, etc.)
      rating: number;      // 0-5 stars
      favorites: number;   // Popularity count
      chordProContent: string;
    }
  gotcha: Use arrangement.key as initial customKey value when adding to setlist
```

### Current Codebase Tree

```bash
src/
├── features/
│   ├── setlists/
│   │   ├── components/
│   │   │   ├── PerformanceControls.tsx    # ✅ Exists
│   │   │   ├── PerformanceProgressBar.tsx # ✅ Exists
│   │   │   ├── SetlistCard.tsx            # ✅ Exists
│   │   │   ├── SetlistForm.tsx            # ✅ Exists
│   │   │   ├── SetlistList.tsx            # ✅ Exists
│   │   │   └── SetlistSongItem.tsx        # ✅ Exists - WILL MODIFY
│   │   ├── hooks/
│   │   │   ├── useArrowKeyNavigation.ts   # ✅ Exists
│   │   │   ├── useFullscreen.ts           # ✅ Exists
│   │   │   ├── usePerformanceMode.ts      # ✅ Exists
│   │   │   ├── useSetlistData.ts          # ✅ Exists
│   │   │   ├── useSetlistSongs.ts         # ✅ Exists - WILL MODIFY
│   │   │   └── useSetlists.ts             # ✅ Exists
│   │   ├── pages/
│   │   │   ├── SetlistPage.tsx            # ✅ Exists - WILL MODIFY
│   │   │   ├── SetlistPerformancePage.tsx # ✅ Exists
│   │   │   └── SetlistsIndexPage.tsx      # ✅ Exists
│   │   ├── types/
│   │   │   ├── Setlist.types.ts           # ✅ Exists
│   │   │   └── index.ts                   # ✅ Exists
│   │   └── utils/
│   │       ├── setlistSorter.ts           # ✅ Exists
│   │       └── setlistValidation.ts       # ✅ Exists
│   ├── shared/
│   │   └── hooks/
│   │       └── useDebounce.ts             # ❌ WILL CREATE
│   └── arrangements/
│       └── hooks/
│           └── useArrangementData.ts      # ✅ Exists (reference pattern)
└── components/
    └── ui/
        ├── dialog.jsx                     # ✅ Exists (shadcn/ui)
        ├── input.jsx                      # ✅ Exists (shadcn/ui)
        ├── button.jsx                     # ✅ Exists (shadcn/ui)
        └── card.jsx                       # ✅ Exists (shadcn/ui)
```

**Legend**:
- ✅ Exists - File already implemented
- ❌ WILL CREATE - New file to implement
- ✅ Exists - WILL MODIFY - Existing file to extend

### Desired Codebase Tree (New Files)

```bash
src/features/setlists/
├── components/
│   └── AddArrangementModal.tsx        # ❌ CREATE - Search modal component
├── hooks/
│   ├── useArrangementSearch.ts        # ❌ CREATE - Search hook with IndexedDB
│   └── useKeyboardNavigation.ts       # ❌ CREATE - Arrow key navigation hook
│
src/features/shared/
└── hooks/
    └── useDebounce.ts                 # ❌ CREATE - Generic debounce hook
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: TypeScript Strict Mode
// - strictNullChecks enabled: Always handle null/undefined cases
// - No any types allowed: ESLint will fail build
// - Use optional chaining: value?.property
// - Use nullish coalescing: value ?? defaultValue

// CRITICAL: shadcn/ui Dialog
// - Must use controlled state (open={bool} onOpenChange={setBool})
// - onOpenChange fires on backdrop click and X button
// - Do NOT use modal={false} (breaks focus trap for Combobox - not needed here)
// - DialogContent automatically provides focus trap and ESC handler

// CRITICAL: @dnd-kit/sortable integration
// - SetlistSongItem is wrapped by useSortable() hook
// - Don't add interactive elements inside drag handle (breaks drag)
// - Use setActivatorNodeRef for drag handle, not setNodeRef
// - Adding inline dropdown OUTSIDE drag handle is safe

// CRITICAL: IndexedDB with idb library
// - Repository instances must be memoized (useMemo)
// - getAll() returns Promise<T[]> - await it!
// - save() returns Promise<T> with updated metadata (createdAt, updatedAt)
// - Transactions auto-commit (no manual commit needed)

// CRITICAL: React 19 Patterns
// - useState with null initial value requires <T | null> type
// - useEffect cleanup must clear timeouts/intervals
// - useMemo dependencies must be exhaustive (ESLint enforces)

// CRITICAL: Debouncing Search
// - 300ms delay is optimal for search UX
// - Use useDebouncedValue hook (not useDebouncedCallback)
// - Return value directly (not callback)

// CRITICAL: Keyboard Navigation
// - Arrow keys navigate list items
// - Enter selects current item
// - Escape closes modal (handled by Dialog)
// - Must update aria-activedescendant for screen readers

// CRITICAL: Musical Keys
// - Valid keys: C, C#, D, D#, E, F, F#, G, G#, A, A#, B (12 total)
// - customKey is optional - fallback to arrangement.key
// - Display format: "G (Original)" when customKey === arrangement.key
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// src/features/setlists/types/Setlist.types.ts (ALREADY EXISTS)
// READ THIS FILE FIRST - types are already defined!

// NEW: Add to src/features/setlists/hooks/useArrangementSearch.ts
export interface ArrangementWithSong extends Arrangement {
  song?: Song; // Joined from songs table via songId
}

export interface UseArrangementSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: ArrangementWithSong[];
  isLoading: boolean;
  isEmpty: boolean;
}

// NEW: Add to src/features/shared/hooks/useKeyboardNavigation.ts
export interface UseKeyboardNavigationOptions {
  itemCount: number;
  onSelect: (index: number) => void;
  loop?: boolean;
  disabled?: boolean;
}

export interface UseKeyboardNavigationReturn {
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

// NEW: Add to src/features/shared/hooks/useDebounce.ts
export interface UseDebouncedValueOptions<T> {
  delay?: number;
  equalityFn?: (left: T, right: T) => boolean;
}
```

### Implementation Tasks (Ordered by Dependency)

**CRITICAL: Complete vertical slice - UI to data layer within feature boundary**

```yaml
Task 1: CREATE src/features/shared/hooks/useDebounce.ts
  - IMPLEMENT: Generic debounced value hook with TypeScript
  - NAMING: useDebouncedValue (not useDebouncedCallback!)
  - PLACEMENT: shared/hooks (reusable across features)
  - PATTERN: |
      export function useDebouncedValue<T>(value: T, options?: UseDebouncedValueOptions<T>): T
      - useState<T>(value) for debounced state
      - useRef<T>(value) to track previous value
      - useEffect with setTimeout cleanup
      - Default delay: 300ms
  - SLICE BOUNDARY: Shared utility, no feature dependencies
  - VALIDATION: |
      const debouncedQuery = useDebouncedValue(searchQuery, { delay: 300 });
      // After 300ms of no changes, debouncedQuery updates

Task 2: CREATE src/features/shared/hooks/useKeyboardNavigation.ts
  - IMPLEMENT: Keyboard navigation with arrow keys + Enter
  - NAMING: useKeyboardNavigation
  - PLACEMENT: shared/hooks (reusable pattern)
  - PATTERN: |
      - useState<number>(-1) for selectedIndex
      - useRef<HTMLDivElement>(null) for container ref
      - useCallback for handleKeyDown with switch(event.key)
      - useEffect to scroll selected item into view
  - DEPENDENCIES: React only (no external libs)
  - SLICE BOUNDARY: Shared utility, no feature dependencies
  - VALIDATION: Arrow keys navigate, Enter selects, Escape resets

Task 3: CREATE src/features/setlists/hooks/useArrangementSearch.ts
  - IMPLEMENT: Search hook with IndexedDB integration
  - FOLLOW pattern: src/features/arrangements/hooks/useArrangementData.ts
  - DEPENDENCIES: |
      - import { ArrangementRepository, SongRepository } from '@/features/pwa/db/repository'
      - import { useDebouncedValue } from '@/features/shared/hooks/useDebounce'
      - import type { Arrangement, Song } from '@/types'
  - PATTERN: |
      export function useArrangementSearch(initialQuery = '') {
        const [query, setQuery] = useState(initialQuery);
        const [arrangements, setArrangements] = useState<Arrangement[]>([]);
        const [songs, setSongs] = useState<Song[]>([]);
        const [isLoading, setIsLoading] = useState(true);
        
        const debouncedQuery = useDebouncedValue(query, { delay: 300 });
        
        // Load data once on mount
        useEffect(() => {
          async function loadData() {
            const arrangementRepo = new ArrangementRepository();
            const songRepo = new SongRepository();
            const [allArrangements, allSongs] = await Promise.all([
              arrangementRepo.getAll(),
              songRepo.getAll()
            ]);
            setArrangements(allArrangements);
            setSongs(allSongs);
            setIsLoading(false);
          }
          loadData();
        }, []);
        
        // Filter results (memoized)
        const filteredResults = useMemo(() => {
          const q = debouncedQuery.toLowerCase().trim();
          if (!q) return arrangements.map(arr => ({
            ...arr,
            song: songs.find(s => s.id === arr.songId)
          }));
          
          return arrangements
            .filter(arr => {
              const song = songs.find(s => s.id === arr.songId);
              return (
                song?.title.toLowerCase().includes(q) ||
                song?.artist.toLowerCase().includes(q) ||
                arr.key?.toLowerCase().includes(q)
              );
            })
            .map(arr => ({
              ...arr,
              song: songs.find(s => s.id === arr.songId)
            }));
        }, [debouncedQuery, arrangements, songs]);
        
        return {
          query,
          setQuery,
          results: filteredResults,
          isLoading,
          isEmpty: filteredResults.length === 0 && !isLoading
        };
      }
  - SLICE BOUNDARY: Setlists feature uses shared hooks + PWA db
  - VALIDATION: Search filters instantly (after 300ms debounce)

Task 4: CREATE src/features/setlists/components/AddArrangementModal.tsx
  - IMPLEMENT: Modal with search + keyboard navigation
  - FOLLOW pattern: src/features/setlists/pages/SetlistsIndexPage.tsx (Dialog usage)
  - DEPENDENCIES: |
      - import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
      - import { Input } from '@/components/ui/input'
      - import { useArrangementSearch } from '../hooks/useArrangementSearch'
      - import { useKeyboardNavigation } from '@/features/shared/hooks/useKeyboardNavigation'
      - import { Search, Loader2, Music } from 'lucide-react'
  - PATTERN: |
      interface AddArrangementModalProps {
        open: boolean;
        onOpenChange: (open: boolean) => void;
        onAdd: (arrangementId: string, customKey?: string) => void;
      }
      
      export function AddArrangementModal({ open, onOpenChange, onAdd }: AddArrangementModalProps) {
        const { query, setQuery, results, isLoading, isEmpty } = useArrangementSearch();
        
        const handleSelect = (index: number) => {
          const arrangement = results[index];
          if (arrangement) {
            onAdd(arrangement.id, arrangement.key);
            onOpenChange(false); // Close modal
          }
        };
        
        const { selectedIndex, setSelectedIndex, handleKeyDown, containerRef } = useKeyboardNavigation({
          itemCount: results.length,
          onSelect: handleSelect,
          loop: true
        });
        
        return (
          <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl" onKeyDown={handleKeyDown}>
              <DialogHeader>
                <DialogTitle>Add Song to Setlist</DialogTitle>
              </DialogHeader>
              
              {/* Search Input */}
              <Input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by song title, artist, or key..."
                autoFocus
                className="pl-9"
                role="combobox"
                aria-expanded={results.length > 0}
              />
              
              {/* Results List */}
              <div ref={containerRef} className="overflow-y-auto max-h-96 border rounded-md">
                {isLoading && <Loader2 className="animate-spin" />}
                {isEmpty && <p>No arrangements found</p>}
                {results.map((arr, idx) => (
                  <div
                    key={arr.id}
                    data-index={idx}
                    role="option"
                    aria-selected={selectedIndex === idx}
                    onClick={() => handleSelect(idx)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={selectedIndex === idx ? 'bg-accent' : ''}
                  >
                    <p>{arr.song?.title}</p>
                    <p className="text-sm text-muted-foreground">{arr.song?.artist}</p>
                    <p className="text-sm">Key: {arr.key}</p>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        );
      }
  - SLICE BOUNDARY: Setlists feature component
  - VALIDATION: Modal opens, search works, Enter selects, Escape closes

Task 5: MODIFY src/features/setlists/hooks/useSetlistSongs.ts
  - IMPLEMENT: Add updateSongKey method
  - FOLLOW pattern: Existing removeSong and reorderSongs methods
  - ADD TO INTERFACE: |
      export interface UseSetlistSongsReturn {
        addSong: (arrangementId: string, customKey?: string) => Promise<void>;
        removeSong: (songId: string) => Promise<void>;
        reorderSongs: (sourceIndex: number, destinationIndex: number) => Promise<void>;
        updateSongKey: (songId: string, newKey: string) => Promise<void>; // ← ADD THIS
      }
  - IMPLEMENT: |
      const updateSongKey = useCallback(async (
        songId: string,
        newKey: string
      ): Promise<void> => {
        if (!setlist) return;
        
        const updatedSongs = setlist.songs.map(song =>
          song.id === songId
            ? { ...song, customKey: newKey }
            : song
        );
        
        const saved = await repo.save({
          ...setlist,
          songs: updatedSongs,
          updatedAt: new Date().toISOString()
        });
        
        onUpdate(saved);
        logger.debug('Song key updated:', { songId, newKey });
      }, [setlist, repo, onUpdate]);
      
      return { addSong, removeSong, reorderSongs, updateSongKey }; // ← ADD updateSongKey
  - SLICE BOUNDARY: Setlists feature hook
  - VALIDATION: Changing key updates IndexedDB immediately

Task 6: MODIFY src/features/setlists/components/SetlistSongItem.tsx
  - IMPLEMENT: Add inline DropdownMenu for key selection
  - FOLLOW pattern: src/features/chordpro/components/KeySelector.tsx
  - ADD IMPORT: |
      import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
  - ADD PROP: |
      interface SetlistSongItemProps {
        song: SetlistSong;
        arrangement?: Arrangement;
        index: number;
        onRemove: (songId: string) => void;
        onKeyChange: (songId: string, newKey: string) => void; // ← ADD THIS
      }
  - IMPLEMENT: |
      // Inside component, after existing code
      const MUSICAL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const currentKey = song.customKey || arrangement?.key || 'C';
      
      // Add to JSX (replace line 68-69):
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Key:</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-3 py-1 text-sm font-medium border rounded hover:bg-accent">
              {currentKey}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {MUSICAL_KEYS.map(key => (
              <DropdownMenuItem
                key={key}
                onClick={() => onKeyChange(song.id, key)}
              >
                {key}
                {key === arrangement?.key && (
                  <span className="ml-2 text-xs text-muted-foreground">(Original)</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
  - GOTCHA: Place dropdown OUTSIDE drag handle to avoid breaking drag
  - SLICE BOUNDARY: Setlists feature component
  - VALIDATION: Dropdown shows keys, selecting updates customKey

Task 7: MODIFY src/features/setlists/pages/SetlistPage.tsx
  - IMPLEMENT: Wire up AddArrangementModal
  - ADD STATE: |
      const [showAddModal, setShowAddModal] = useState(false);
  - ADD IMPORT: |
      import { AddArrangementModal } from '../components/AddArrangementModal';
  - MODIFY Button (line 100): |
      <Button onClick={() => setShowAddModal(true)} className="mb-6">
  - ADD MODAL (after line 132, before closing div): |
      <AddArrangementModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onAdd={async (arrangementId, customKey) => {
          await addSong(arrangementId, customKey);
          setShowAddModal(false);
        }}
      />
  - MODIFY SetlistSongItem (line 121): |
      <SetlistSongItem
        key={song.id}
        song={song}
        arrangement={arrangements.get(song.arrangementId)}
        index={index}
        onRemove={removeSong}
        onKeyChange={updateSongKey} // ← ADD THIS
      />
  - DESTRUCTURE updateSongKey from useSetlistSongs: |
      const { removeSong, reorderSongs, updateSongKey } = useSetlistSongs(
  - SLICE BOUNDARY: Setlists feature page
  - VALIDATION: Click "Add Song" opens modal, adding song works, changing key works
```

### Implementation Patterns & Key Details

```typescript
// PATTERN 1: Debounced Search Input
const [query, setQuery] = useState('');
const debouncedQuery = useDebouncedValue(query, { delay: 300 });

// PATTERN 2: IndexedDB Parallel Fetch
const [allArrangements, allSongs] = await Promise.all([
  arrangementRepo.getAll(),
  songRepo.getAll()
]);

// PATTERN 3: Memoized Filtering
const filteredResults = useMemo(() => {
  return arrangements.filter(arr => {
    const song = songs.find(s => s.id === arr.songId);
    return song?.title.toLowerCase().includes(query.toLowerCase());
  });
}, [query, arrangements, songs]);

// PATTERN 4: Keyboard Navigation
const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, itemCount - 1));
      break;
    case 'Enter':
      event.preventDefault();
      onSelect(selectedIndex);
      break;
  }
};

// PATTERN 5: Controlled Dialog
const [showModal, setShowModal] = useState(false);
<Dialog open={showModal} onOpenChange={setShowModal}>
  <DialogContent>
    {/* Modal closes on backdrop click or X button via onOpenChange */}
  </DialogContent>
</Dialog>

// PATTERN 6: Inline Dropdown Key Selector
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button>{currentKey}</button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {KEYS.map(key => (
      <DropdownMenuItem key={key} onClick={() => onKeyChange(key)}>
        {key}
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>

// GOTCHA: Don't put interactive elements inside drag handle
// ❌ BAD:
<button ref={setActivatorNodeRef} {...listeners}>
  <GripVertical />
  <DropdownMenu>...</DropdownMenu> {/* Breaks drag! */}
</button>

// ✅ GOOD:
<button ref={setActivatorNodeRef} {...listeners}>
  <GripVertical />
</button>
<DropdownMenu>...</DropdownMenu> {/* Outside drag handle */}
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after EACH file creation - fix before proceeding
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint checks

# Expected: Zero errors. If errors exist, READ output and fix immediately.
# Common errors:
# - Type 'string | undefined' not assignable: Add null check or optional chaining
# - Missing return type: Add explicit return type annotation
# - Unused variable: Remove or prefix with underscore (_variable)
```

### Level 2: Unit Testing (Future - Phase 4+)

```bash
# No tests required for MVP
# Tests will be added in future phases
```

### Level 3: Integration Testing (Manual)

```bash
# Development server
npm run dev

# Test AddArrangementModal:
# 1. Navigate to /setlists
# 2. Click existing setlist
# 3. Click "Add Song" button
# 4. Modal should open with search input focused
# 5. Type "amazing" → Should filter arrangements
# 6. Press ArrowDown → Should highlight first result
# 7. Press Enter → Should add song and close modal
# 8. Verify song appears in setlist

# Test Inline Key Selector:
# 1. In setlist, click key dropdown next to any song
# 2. Select different key (e.g., change G to D)
# 3. Verify key updates immediately
# 4. Refresh page → Verify key persists
# 5. Enter performance mode → Verify correct key displays

# Expected: All interactions work, no console errors
```

### Level 4: Production Build Validation

```bash
# Production build
npm run build

# Expected: Successful build, no TypeScript/ESLint errors
# Build time: <5 seconds
# Bundle size: ~1.3 MB (no significant increase)

# Preview production build
npm run preview

# Test in production mode:
# - All features work
# - No console errors
# - IndexedDB operations succeed
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 7 tasks completed successfully
- [ ] TypeScript strict mode compliance: `npm run typecheck` passes
- [ ] No linting errors: `npm run lint` passes
- [ ] Production build succeeds: `npm run build` passes
- [ ] No `any` types used (grep confirms)
- [ ] All props interfaces defined with explicit types

### Feature Validation

- [ ] Click "Add Song" button opens modal
- [ ] Search input filters arrangements (debounced 300ms)
- [ ] Arrow keys navigate search results
- [ ] Enter key selects highlighted arrangement
- [ ] Selected arrangement adds to setlist
- [ ] Modal closes after adding song
- [ ] Inline key dropdown displays current key
- [ ] Selecting new key updates customKey field
- [ ] Key change persists to IndexedDB immediately
- [ ] Page refresh preserves custom keys
- [ ] Performance mode displays correct keys

### Code Quality Validation

- [ ] Follows existing TypeScript patterns (hooks, components)
- [ ] File placement matches vertical slice architecture
- [ ] Vertical slice boundaries respected (no cross-feature imports)
- [ ] Memoization prevents unnecessary re-renders
- [ ] ARIA attributes present (combobox, listbox, option, activedescendant)
- [ ] Keyboard navigation works (arrow keys, Enter, Escape)
- [ ] Error handling present (try/catch for IndexedDB ops)
- [ ] Logger used instead of console.log

### User Experience Validation

- [ ] Search feels responsive (300ms debounce is imperceptible)
- [ ] Empty state clear ("No arrangements found")
- [ ] Loading state shows spinner (IndexedDB fetch)
- [ ] Key dropdown is discoverable (visible button)
- [ ] Original key indicated in dropdown ("(Original)" label)
- [ ] Drag-and-drop still works after modifications
- [ ] Mobile-friendly (touch-friendly buttons, responsive layout)

---

## Anti-Patterns to Avoid

**TypeScript Anti-Patterns:**
- ❌ Don't use `any` type - STRICTLY FORBIDDEN (ESLint will fail build)
- ❌ Don't use `@ts-ignore` or `@ts-expect-error` - Fix the type error properly
- ❌ Don't define props inline - Create separate interface
- ❌ Don't skip return type annotations on functions
- ❌ Don't use implicit `any` on function parameters

**React Anti-Patterns:**
- ❌ Don't create new repository instances on every render - Use `useMemo`
- ❌ Don't forget useEffect cleanup for timeouts - Always return cleanup function
- ❌ Don't mutate state directly - Use spread operator or immutable updates
- ❌ Don't call hooks conditionally - Always call at top level

**Dialog Anti-Patterns:**
- ❌ Don't use uncontrolled Dialog - Always use `open={state} onOpenChange={setState}`
- ❌ Don't manually close Dialog with refs - Use state: `setShowModal(false)`
- ❌ Don't forget to reset form state when modal closes
- ❌ Don't use `modal={false}` unless Combobox inside (not needed here)

**IndexedDB Anti-Patterns:**
- ❌ Don't forget to await repository methods - They return Promises
- ❌ Don't create new repository per operation - Reuse instance
- ❌ Don't forget error handling for IndexedDB operations

**Drag-and-Drop Anti-Patterns:**
- ❌ Don't put interactive elements inside drag handle - Breaks drag
- ❌ Don't use `setNodeRef` for drag handle - Use `setActivatorNodeRef`
- ❌ Don't forget `touch-none` class on drag handle

**Search Anti-Patterns:**
- ❌ Don't search on every keystroke - Use debouncing (300ms)
- ❌ Don't filter large datasets without memoization - Use `useMemo`
- ❌ Don't fetch IndexedDB on every search - Load once, filter in memory

---

## Confidence Score: 9/10

**Why 9/10:**
- ✅ Clear requirements with existing infrastructure
- ✅ Comprehensive research completed (Dialog, Select, search patterns)
- ✅ Exact file paths and patterns identified
- ✅ TypeScript types already defined
- ✅ Similar patterns exist in codebase (easy to follow)
- ✅ Validation gates clear and executable
- ⚠️ -1 point: Minor risk of ARIA attribute implementation details

**Success Likelihood**: Very high (95%+)

An AI agent with no prior knowledge of this codebase can implement this feature successfully in one pass using only this PRP and codebase access.

---

**End of PRP**
