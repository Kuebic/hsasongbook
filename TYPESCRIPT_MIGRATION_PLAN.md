# TypeScript Migration Plan - HSA Songbook

**Project**: HSA Songbook PWA
**Current Status**: Phase 3 Complete (ChordPro Editor/Viewer)
**Migration Phase**: 3.5 (TypeScript Migration)
**Created**: October 8, 2025

---

## Overview

This document outlines the step-by-step migration plan for converting the HSA Songbook codebase from JavaScript to TypeScript. The migration follows a feature-by-feature incremental approach to minimize risk and ensure no functionality regressions.

---

## Pre-Migration Checklist

### 1. Environment Setup

- [ ] Install TypeScript: `npm install --save-dev typescript`
- [ ] Install TypeScript ESLint: `npm install --save-dev typescript-eslint`
- [ ] Verify @types packages are installed (already in package.json):
  - [x] `@types/node@^24.5.2`
  - [x] `@types/react@^19.1.13`
  - [x] `@types/react-dom@^19.1.9`
- [ ] Check if additional @types needed:
  - [ ] `@types/chordsheetjs` (may be required)

### 2. Configuration Files

- [ ] Create `tsconfig.json` (see REACT19_TYPESCRIPT_GUIDE.md)
- [ ] Create `tsconfig.node.json` for Vite config
- [ ] Update `eslint.config.js` to support TypeScript
- [ ] Update `vite.config.js` to `vite.config.ts`
- [ ] Add `.react-router/` to `.gitignore`
- [ ] Add `typecheck` script to `package.json`

### 3. Documentation Review

- [ ] Read `REACT19_TYPESCRIPT_GUIDE.md` (comprehensive patterns)
- [ ] Read `TYPESCRIPT_QUICK_REFERENCE.md` (quick lookup)
- [ ] Bookmark React 19 TypeScript documentation

---

## Type Definition Strategy

### Core Data Models

Based on existing JSON data structures, we need to create these type definitions first.

#### 1. Song Types (`src/features/shared/types/Song.types.ts`)

```typescript
/**
 * Song entity from songs.json
 */
export interface Song {
  id: string;
  title: string;
  artist: string;
  themes: string[];
  copyright: string;
  lyrics: {
    en: string;
  };
}

/**
 * Song with additional computed properties (for display)
 */
export interface SongWithMeta extends Song {
  arrangementCount?: number;
  popularityScore?: number;
}

/**
 * Song search/filter criteria
 */
export interface SongSearchCriteria {
  query?: string;
  themes?: string[];
  artist?: string;
}
```

#### 2. Arrangement Types (`src/features/shared/types/Arrangement.types.ts`)

```typescript
/**
 * Arrangement entity from arrangements.json
 */
export interface Arrangement {
  id: string;
  songId: string;
  name: string;
  key: string;
  tempo: number;
  timeSignature: string;
  capo: number;
  tags: string[];
  rating: number | null;
  favorites: number;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
  chordProContent: string;
}

/**
 * Arrangement with populated song data (for display)
 */
export interface ArrangementWithSong extends Arrangement {
  song?: Song;
}

/**
 * Arrangement metadata (separate from ChordPro content)
 */
export interface ArrangementMetadata {
  key: string;
  tempo: number;
  timeSignature: string;
  capo: number;
}

/**
 * Sort options for arrangements
 */
export type ArrangementSortOption = 'popular' | 'rating' | 'newest' | 'oldest';
```

#### 3. Database Types (`src/features/pwa/types/Database.types.ts`)

```typescript
import { DBSchema } from 'idb';
import { Song, Arrangement } from '@/features/shared/types';

/**
 * IndexedDB schema for HSA Songbook
 */
export interface SongbookDB extends DBSchema {
  songs: {
    key: string;
    value: Song;
    indexes: {
      'by-artist': string;
      'by-title': string;
    };
  };
  arrangements: {
    key: string;
    value: Arrangement;
    indexes: {
      'by-song': string;
      'by-rating': number;
      'by-favorites': number;
    };
  };
  drafts: {
    key: string;
    value: {
      id: string;
      arrangementId: string;
      content: string;
      metadata: ArrangementMetadata;
      lastSaved: number; // timestamp
    };
  };
  settings: {
    key: string;
    value: unknown; // Generic settings store
  };
}

/**
 * Database version history for migrations
 */
export const DB_VERSION = 1;
export const DB_NAME = 'songbook-db';
```

#### 4. PWA Types (`src/features/pwa/types/PWA.types.ts`)

```typescript
/**
 * Storage quota information
 */
export interface StorageQuota {
  usage: number;
  quota: number;
  percentage: number;
}

/**
 * Storage cleanup result
 */
export interface CleanupResult {
  itemsDeleted: number;
  bytesFreed: number;
  errors: Error[];
}

/**
 * PWA update status
 */
export type UpdateStatus = 'idle' | 'checking' | 'available' | 'installing' | 'ready' | 'error';

/**
 * Online/offline status
 */
export interface NetworkStatus {
  online: boolean;
  effectiveType?: string; // '4g', '3g', '2g', 'slow-2g'
  downlink?: number;
  rtt?: number;
}
```

#### 5. ChordPro Types (`src/features/chordpro/types/ChordPro.types.ts`)

```typescript
import { Song as ChordSheetSong } from 'chordsheetjs';

/**
 * ChordPro parsing result
 */
export interface ParsedChordSheet {
  song: ChordSheetSong;
  html: string;
  hasChords: boolean;
  metadata: {
    title?: string;
    artist?: string;
    key?: string;
    tempo?: string;
    capo?: string;
    time?: string;
  };
}

/**
 * Transpose options
 */
export interface TransposeOptions {
  steps: number; // Semitones to transpose (-12 to +12)
  useFlats?: boolean;
}

/**
 * Editor state
 */
export interface EditorState {
  content: string;
  isDirty: boolean;
  lastSaved: number | null;
  cursorPosition?: number;
}

/**
 * Key signature options
 */
export const KEYS = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'
] as const;

export type KeySignature = typeof KEYS[number];

/**
 * Time signature options
 */
export const TIME_SIGNATURES = [
  '4/4', '3/4', '6/8', '2/4', '5/4', '7/8', '12/8'
] as const;

export type TimeSignature = typeof TIME_SIGNATURES[number];
```

---

## Migration Order & File List

### Phase 1: Type Definitions (Week 1)

Create all `.types.ts` files first. These have no dependencies and establish the foundation.

**Files to Create:**
- [ ] `src/features/shared/types/Song.types.ts`
- [ ] `src/features/shared/types/Arrangement.types.ts`
- [ ] `src/features/pwa/types/Database.types.ts`
- [ ] `src/features/pwa/types/PWA.types.ts`
- [ ] `src/features/chordpro/types/ChordPro.types.ts`

**Validation:**
- [ ] Run `npm run typecheck` - should pass
- [ ] No import errors

---

### Phase 2: Utilities & Configuration (Week 1-2)

Migrate pure utility functions and configuration modules. These are independent and easiest to convert.

**Core Utilities:**
- [ ] `src/lib/logger.js` → `src/lib/logger.ts`
- [ ] `src/lib/utils.js` → `src/lib/utils.ts`

**Configuration Files:**
- [ ] `src/lib/config/pwa.js` → `src/lib/config/pwa.ts`
- [ ] `src/lib/config/storage.js` → `src/lib/config/storage.ts` (if exists)

**Shared Utilities:**
- [ ] `src/features/shared/utils/dataHelpers.js` → `.ts`
- [ ] `src/features/shared/utils/arrangementSorter.js` → `.ts`

**ChordPro Utilities:**
- [ ] `src/features/chordpro/utils/metadataInjector.js` → `.ts`
- [ ] `src/features/chordpro/utils/contentSanitizer.js` → `.ts`

**Validation After Each File:**
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`

---

### Phase 3: PWA Feature Module (Week 2)

Migrate PWA infrastructure (database, hooks, utilities).

**Database Layer:**
- [ ] `src/features/pwa/db/database.js` → `.ts`
  - Use `DBSchema` from idb
  - Import `SongbookDB` type
- [ ] `src/features/pwa/db/repository.js` → `.ts`
  - Type all CRUD operations
  - Use generic repository pattern
- [ ] `src/features/pwa/db/migrations.js` → `.ts`
- [ ] `src/features/pwa/db/dataMigration.js` → `.ts`
- [ ] `src/features/pwa/db/cleanupManager.js` → `.ts`

**Hooks:**
- [ ] `src/features/pwa/hooks/useOnlineStatus.js` → `.ts`
  - Return type: `NetworkStatus`
- [ ] `src/features/pwa/hooks/useStorageQuota.js` → `.ts`
  - Return type: `StorageQuota`
- [ ] `src/features/pwa/hooks/usePWA.js` → `.ts`
  - Complex hook - take care with types

**Utilities:**
- [ ] `src/features/pwa/utils/storageManager.js` → `.ts`

**Configuration:**
- [ ] `src/features/pwa/config/storage.js` → `.ts`

**Components:**
- [ ] `src/features/pwa/components/OfflineIndicator.jsx` → `.tsx`
- [ ] `src/features/pwa/components/UpdateNotification.jsx` → `.tsx`

**Index:**
- [ ] `src/features/pwa/index.js` → `.ts`

**Validation:**
- [ ] PWA functionality works offline
- [ ] IndexedDB operations work
- [ ] Update notifications appear
- [ ] No console errors

---

### Phase 4: Search Feature (Week 2)

Small module - good for testing component migration.

**Files:**
- [ ] `src/features/search/components/*.jsx` → `.tsx`
- [ ] `src/features/search/hooks/*.js` → `.ts`
- [ ] `src/features/search/index.js` → `.ts`

**Validation:**
- [ ] Search functionality works
- [ ] Filtering works correctly

---

### Phase 5: Songs Feature (Week 3)

**Components:**
- [ ] `src/features/songs/components/SongList.jsx` → `.tsx`
- [ ] `src/features/songs/components/SongCard.jsx` → `.tsx`
- [ ] `src/features/songs/components/*.jsx` → `.tsx` (any others)

**Pages:**
- [ ] `src/features/songs/pages/SongDetailPage.jsx` → `.tsx`

**Hooks:**
- [ ] `src/features/songs/hooks/*.js` → `.ts`

**Index:**
- [ ] `src/features/songs/index.js` → `.ts`

**Validation:**
- [ ] Song list displays correctly
- [ ] Song detail pages work
- [ ] Navigation functions properly

---

### Phase 6: Arrangements Feature (Week 3)

**Components:**
- [ ] `src/features/arrangements/components/ArrangementList.jsx` → `.tsx`
- [ ] `src/features/arrangements/components/ArrangementCard.jsx` → `.tsx`
- [ ] `src/features/arrangements/components/ArrangementMetadataForm.jsx` → `.tsx`
- [ ] `src/features/arrangements/components/SortSelector.jsx` → `.tsx`

**Pages:**
- [ ] `src/features/arrangements/pages/ArrangementViewPage.jsx` → `.tsx`

**Hooks:**
- [ ] `src/features/arrangements/hooks/*.js` → `.ts`

**Index:**
- [ ] `src/features/arrangements/index.js` → `.ts`

**Validation:**
- [ ] Arrangement list/display works
- [ ] Sorting works correctly
- [ ] Metadata form functions properly

---

### Phase 7: ChordPro Feature (Week 4)

**CRITICAL MODULE** - This is the most complex feature. Take extra care.

**Services:**
- [ ] `src/features/chordpro/services/PersistenceService.js` → `.ts`

**Database:**
- [ ] `src/features/chordpro/db/DraftRepository.js` → `.ts`

**Language/Highlighting:**
- [ ] `src/features/chordpro/language/chordProLanguage.js` → `.ts`
- [ ] `src/features/chordpro/language/chordProHighlight.js` → `.ts`

**Hooks:**
- [ ] `src/features/chordpro/hooks/useAutoSave.js` → `.ts`
- [ ] `src/features/chordpro/hooks/useKeyDetection.js` → `.ts`
- [ ] `src/features/chordpro/hooks/useChordSheet.js` → `.ts`
- [ ] `src/features/chordpro/hooks/*.js` → `.ts` (any others)

**Components:**
- [ ] `src/features/chordpro/components/ChordProViewer.jsx` → `.tsx`
- [ ] `src/features/chordpro/components/ChordProEditor.jsx` → `.tsx`
- [ ] `src/features/chordpro/components/EditorToolbar.jsx` → `.tsx`
- [ ] `src/features/chordpro/components/*.jsx` → `.tsx` (any others)

**Pages:**
- [ ] `src/features/chordpro/pages/EditorPage.jsx` → `.tsx`

**Index:**
- [ ] `src/features/chordpro/index.js` → `.ts`

**Validation:**
- [ ] ChordPro viewer renders correctly
- [ ] Editor works with syntax highlighting
- [ ] Auto-save functions properly
- [ ] Transposition works
- [ ] Print view functions
- [ ] Metadata injection/sanitization works

---

### Phase 8: Shared Components (Week 4-5)

**Components:**
- [ ] `src/features/shared/components/Breadcrumbs.jsx` → `.tsx`
- [ ] `src/features/shared/components/MobileNav.jsx` → `.tsx`
- [ ] `src/features/shared/components/RatingDisplay.jsx` → `.tsx`
- [ ] `src/features/shared/components/PopularityDisplay.jsx` → `.tsx`
- [ ] `src/features/shared/components/*.jsx` → `.tsx` (any others)

**Hooks:**
- [ ] `src/features/shared/hooks/*.js` → `.ts`

**Index:**
- [ ] `src/features/shared/index.js` → `.ts`

---

### Phase 9: App Core (Week 5)

**Critical files - migrate last to ensure all dependencies are typed.**

- [ ] `src/app/App.jsx` → `src/app/App.tsx`
- [ ] `src/app/main.jsx` → `src/app/main.tsx`

**Validation:**
- [ ] Application starts without errors
- [ ] All routes work
- [ ] Error boundaries function
- [ ] Production build succeeds

---

### Phase 10: Vite Configuration (Week 5)

- [ ] `vite.config.js` → `vite.config.ts`
- [ ] Test production build
- [ ] Test PWA in production mode

---

## Testing Checklist (After Each Phase)

### Automated Tests

- [ ] `npm run typecheck` - TypeScript compilation succeeds
- [ ] `npm run lint` - No linting errors
- [ ] `npm run build` - Production build succeeds
- [ ] `npm run preview` - Preview build works

### Manual Testing

- [ ] Application loads without console errors
- [ ] Search functionality works
- [ ] Song browsing works
- [ ] Arrangement viewing works
- [ ] ChordPro editor/viewer works
- [ ] Auto-save functions
- [ ] Transposition works
- [ ] Offline mode works (PWA)
- [ ] IndexedDB stores data correctly
- [ ] Service worker updates properly

### Regression Testing

- [ ] No functionality has been broken
- [ ] Performance is equivalent or better
- [ ] All existing features still work

---

## Common Migration Patterns for This Project

### Pattern 1: Mock Data Import

**Before (JS):**
```javascript
import songsData from '@/features/shared/data/songs.json';
import arrangementsData from '@/features/shared/data/arrangements.json';
```

**After (TS):**
```typescript
import songsData from '@/features/shared/data/songs.json';
import arrangementsData from '@/features/shared/data/arrangements.json';
import type { Song, Arrangement } from '@/features/shared/types';

// Type assertion if needed
const songs: Song[] = songsData;
const arrangements: Arrangement[] = arrangementsData;
```

### Pattern 2: Repository Pattern (idb)

**Before (JS):**
```javascript
async function getSong(id) {
  const db = await getDB();
  return db.get('songs', id);
}
```

**After (TS):**
```typescript
import { openDB, IDBPDatabase } from 'idb';
import type { SongbookDB } from '@/features/pwa/types/Database.types';
import type { Song } from '@/features/shared/types/Song.types';

async function getSong(id: string): Promise<Song | undefined> {
  const db: IDBPDatabase<SongbookDB> = await getDB();
  return db.get('songs', id);
}
```

### Pattern 3: Component Props

**Before (JS):**
```javascript
export default function SongCard({ song, onClick }) {
  return (
    <div onClick={onClick}>
      <h3>{song.title}</h3>
      <p>{song.artist}</p>
    </div>
  );
}
```

**After (TS):**
```typescript
import type { Song } from '@/features/shared/types/Song.types';
import type { MouseEvent } from 'react';

interface SongCardProps {
  song: Song;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
}

export default function SongCard({ song, onClick }: SongCardProps) {
  return (
    <div onClick={onClick}>
      <h3>{song.title}</h3>
      <p>{song.artist}</p>
    </div>
  );
}
```

### Pattern 4: Custom Hooks

**Before (JS):**
```javascript
export function useChordSheet(chordProContent, transpose = 0) {
  const [parsedSong, setParsedSong] = useState(null);
  // ...
  return { parsedSong, html, error };
}
```

**After (TS):**
```typescript
import type { ParsedChordSheet } from '@/features/chordpro/types/ChordPro.types';

interface UseChordSheetReturn {
  parsedSong: ParsedChordSheet | null;
  html: string;
  error: Error | null;
}

export function useChordSheet(
  chordProContent: string,
  transpose: number = 0
): UseChordSheetReturn {
  const [parsedSong, setParsedSong] = useState<ParsedChordSheet | null>(null);
  const [error, setError] = useState<Error | null>(null);
  // ...
  return { parsedSong, html, error };
}
```

### Pattern 5: Logger Usage

**Already correct pattern (no changes needed):**
```javascript
import logger from '@/lib/logger';

logger.info('Starting migration');
logger.error('Migration failed', error);
```

**After TS (type the error parameter):**
```typescript
import logger from '@/lib/logger';

try {
  // code
} catch (error) {
  if (error instanceof Error) {
    logger.error('Migration failed', error);
  } else {
    logger.error('Unknown error', new Error(String(error)));
  }
}
```

---

## ESLint Rules for TypeScript

Add to `eslint.config.js`:

```javascript
rules: {
  // TypeScript-specific
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unused-vars': ['warn', {
    argsIgnorePattern: '^_',
    varsIgnorePattern: '^_'
  }],
  '@typescript-eslint/explicit-function-return-type': 'off', // Allow inference
  '@typescript-eslint/explicit-module-boundary-types': 'off', // Allow inference

  // Existing React rules
  'react/prop-types': 'off', // No longer needed with TypeScript
}
```

---

## Git Commit Strategy

### Commit After Each Module

**Example commits:**
```
feat(types): add core type definitions for Song and Arrangement
feat(types): add PWA and ChordPro type definitions
feat(utils): migrate logger to TypeScript
feat(utils): migrate shared utilities to TypeScript
feat(pwa): migrate PWA database layer to TypeScript
feat(pwa): migrate PWA hooks to TypeScript
feat(pwa): migrate PWA components to TypeScript
feat(search): migrate search feature to TypeScript
feat(songs): migrate songs feature to TypeScript
feat(arrangements): migrate arrangements feature to TypeScript
feat(chordpro): migrate ChordPro utilities to TypeScript
feat(chordpro): migrate ChordPro hooks to TypeScript
feat(chordpro): migrate ChordPro components to TypeScript
feat(shared): migrate shared components to TypeScript
feat(app): migrate app core to TypeScript
chore(config): migrate Vite config to TypeScript
docs(ts): update CLAUDE.md to reflect TypeScript completion
```

---

## Troubleshooting Guide

### Issue: "Cannot find module" errors

**Solution:**
- Check `tsconfig.json` paths are correct
- Ensure file extensions in imports are omitted (`.ts`/`.tsx` not needed)
- Verify `baseUrl` and `paths` in tsconfig

### Issue: Type errors in third-party libraries

**Solution:**
- Install `@types` package: `npm install --save-dev @types/packagename`
- If no types available, create `src/types/packagename.d.ts`:
  ```typescript
  declare module 'packagename';
  ```

### Issue: "any" type errors

**Solution:**
- Replace `any` with proper type
- Use `unknown` and type guards if type is truly unknown
- Create interface for complex objects

### Issue: Event handler type errors

**Solution:**
- Import correct event type from React
- Use `React.MouseEvent<HTMLButtonElement>` etc.
- See TYPESCRIPT_QUICK_REFERENCE.md for event types

---

## Success Criteria

### Phase 3.5 Complete When:

- [ ] All `.js` files converted to `.ts`
- [ ] All `.jsx` files converted to `.tsx`
- [ ] `npm run typecheck` passes with 0 errors
- [ ] `npm run lint` passes with 0 errors
- [ ] `npm run build` succeeds
- [ ] `npm run preview` works without errors
- [ ] All manual tests pass
- [ ] No functionality regressions
- [ ] CLAUDE.md updated to reflect TypeScript completion

---

## Timeline Estimate

**Total Estimated Time**: 5 weeks

- **Week 1**: Setup + Type Definitions + Core Utilities
- **Week 2**: PWA Feature + Search Feature
- **Week 3**: Songs + Arrangements Features
- **Week 4**: ChordPro Feature (complex)
- **Week 5**: Shared Components + App Core + Final Testing

**Note**: This is a conservative estimate. Actual time may vary based on unexpected issues.

---

## Resources

- **Primary Guide**: `REACT19_TYPESCRIPT_GUIDE.md` (comprehensive)
- **Quick Reference**: `TYPESCRIPT_QUICK_REFERENCE.md` (lookups)
- **React 19 Docs**: https://react.dev/blog/2024/04/25/react-19-upgrade-guide
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **React + TS Cheatsheet**: https://react-typescript-cheatsheet.netlify.app/

---

**Last Updated**: October 8, 2025
**Status**: Ready to begin migration
**Next Step**: Phase 1 - Type Definitions
