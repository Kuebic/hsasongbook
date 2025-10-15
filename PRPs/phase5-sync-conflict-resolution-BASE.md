name: "Phase 5: Sync & Conflict Resolution - BASE PRP"
description: |
  Complete implementation guide for offline-first sync with Supabase and Last-Write-Wins conflict resolution.
  This PRP enables one-pass implementation success by providing comprehensive context, patterns, and code examples.

---

## Goal

**Feature Goal**: Implement offline-first cloud sync with automatic Last-Write-Wins conflict resolution for multi-device users.

**Deliverable**:
- Functional sync system between IndexedDB (local) and Supabase (cloud)
- Automatic conflict resolution with zero user intervention (Phase 5.0 MVP)
- Background sync queue processor with exponential backoff retry
- Sync status indicators in UI (syncing, synced, error states)

**Success Definition**:
- ✅ User can edit arrangements offline on Device A
- ✅ Changes automatically sync to Supabase when reconnected
- ✅ Device B pulls latest changes on next refresh
- ✅ Conflicts resolve automatically using Last-Write-Wins (LWW)
- ✅ Sync success rate > 95% (validated with telemetry)
- ✅ Zero data corruption under any scenario

---

## User Persona

**Target User**: Worship Leader with Multiple Devices

**Use Case**: Edit chord arrangements during rehearsal (offline) on tablet, then review and refine on laptop at home.

**User Journey**:
1. User edits "Amazing Grace" arrangement on tablet (offline during rehearsal)
2. Tablet queues changes in sync queue
3. User gets home, tablet connects to Wi-Fi
4. Background sync automatically uploads changes to Supabase
5. User opens laptop, app pulls latest changes
6. User sees updated arrangement without manual intervention

**Pain Points Addressed**:
- 🔴 **Data loss from switching devices** - Sync preserves edits across devices
- 🔴 **Manual export/import workflows** - Automatic sync replaces manual transfers
- 🔴 **Confusion about "which version is current"** - Cloud is source of truth
- 🟡 **Network unavailability during rehearsal** - Offline-first design handles this

---

## Why

### Business Value
- **Multi-device support** unlocks professional users (60% of target audience use 2+ devices)
- **Offline-first** is critical for rehearsal environments (unreliable church Wi-Fi)
- **Automatic sync** reduces friction compared to competitor apps (manual export/import)
- **Foundation for collaboration** (Phase 6+ features: shared setlists, public library)

### Integration with Existing Features
- **Phase 2 PWA**: Leverages existing IndexedDB and offline infrastructure
- **Phase 3 ChordPro Editor**: Syncs arrangement edits automatically
- **Phase 4 Setlist Management**: Syncs setlists across devices
- **Phase 4.5 Navigation**: Sync status visible in header/mobile nav

### Problems This Solves
- **For Single Users**: Seamless multi-device workflow (tablet → laptop → phone)
- **For Data Integrity**: Prevents lost edits from device failures or browser cache clearing
- **For User Confidence**: "My data is safe in the cloud" peace of mind

---

## What

### User-Visible Behavior

#### Scenario 1: Successful Sync (No Conflict)
1. User edits arrangement on Device A (offline)
2. Local save shows "Saved locally" message
3. When Device A reconnects, sync status shows "Syncing..." badge
4. After 1-2 seconds, badge changes to "✓ Synced"
5. Device B opens app, automatically pulls latest changes
6. Device B shows updated arrangement immediately

#### Scenario 2: Conflict Resolution (Automatic LWW)
1. User edits arrangement on Device A (offline): tempo changed to 120 BPM at 10:00 AM
2. User edits same arrangement on Device B (offline): tempo changed to 140 BPM at 10:05 AM
3. Device A reconnects first, uploads changes to Supabase (tempo = 120 BPM)
4. Device B reconnects second, detects conflict (both modified version 5)
5. **Automatic resolution**: Device B's timestamp (10:05 AM) > Device A's (10:00 AM) → **Device B wins**
6. Supabase overwrites with Device B's version (tempo = 140 BPM, version = 6)
7. Device A pulls latest changes on next sync, updates local copy (tempo = 140 BPM)
8. **User experience**: Transparent, no prompts, latest edit always wins

#### Scenario 3: Offline Editing with Queue
1. User goes offline for 2 hours, makes 10 edits to 3 different arrangements
2. Each edit queued in `syncQueue` store (coalesced: only latest version per entity)
3. User reconnects to Wi-Fi
4. Sync indicator shows "Syncing 3 items..."
5. Background processor uploads all 3 arrangements (batch request)
6. Success: "✓ All changes synced"

#### Scenario 4: Sync Failure with Retry
1. User edits arrangement, sync attempt fails (network timeout)
2. UI shows "Sync failed - will retry" toast notification
3. Background retry with exponential backoff (2s, 4s, 8s, 16s, 32s)
4. After 3 retries, user sees "Sync error - check connection" persistent banner
5. User taps "Retry Now" button → Manual sync attempt
6. Success → Banner dismisses, "✓ Synced" badge appears

### Success Criteria
- [ ] Sync latency < 2 seconds per entity (90th percentile)
- [ ] Sync success rate > 95% (measured via telemetry)
- [ ] Conflict rate < 5% of total syncs (expected for single-user scenario)
- [ ] Zero data loss incidents (validated with comprehensive testing)
- [ ] Offline functionality unchanged (app works 100% offline)
- [ ] User reports < 5 sync issues per 1000 users per month

---

## All Needed Context

### Context Completeness Check
✅ **Validated**: This PRP includes everything needed to implement sync without prior knowledge of this codebase.

### Documentation & References

```yaml
# MUST READ - Critical for Implementation

# Official Documentation
- url: https://supabase.com/docs/guides/realtime/postgres-changes
  why: Real-time subscriptions for pull-based sync
  critical: Use `on: ['INSERT', 'UPDATE', 'DELETE']` for full change tracking

- url: https://supabase.com/docs/guides/database/postgres/row-level-security
  why: RLS policies required for multi-user data isolation
  critical: Always test RLS with different user contexts (prevent data leakage)

- url: https://github.com/diff-match-patch-typescript/diff-match-patch
  why: Text diff library for auto-merge (Phase 5.1+)
  critical: Use `diff_cleanupSemantic()` for human-readable diffs

- url: https://www.npmjs.com/package/react-diff-viewer-continued
  why: React component for side-by-side diff UI (Phase 5.1 conflict UI)
  critical: Mobile-responsive, supports line highlighting

# Codebase Patterns
- file: src/features/pwa/db/repository.ts
  why: Existing BaseRepository pattern with sync queue integration
  pattern: |
    - Generic CRUD with `queueForSync()` method (line 200-220)
    - Automatic version increment on save (line 150-170)
    - Emergency cleanup with LRU (line 300-350)
  gotcha: Repository already queues changes - don't double-queue in new code

- file: src/features/pwa/db/database.ts
  why: IndexedDB setup and sync queue schema
  pattern: |
    - Singleton database instance (line 30-75)
    - SyncQueueItem type definition (lines 10-20)
    - Indexes for efficient sync queries (by-sync-status, by-timestamp)
  gotcha: Database migrations are sequential (v1 → v6). Phase 5 adds v7-v10.

- file: src/features/pwa/hooks/useOnlineStatus.ts
  why: Online/offline detection with periodic connectivity checks
  pattern: |
    - Multi-layered detection: navigator.onLine + fetch('/favicon.ico')
    - Custom events: 'connection-restored', 'connection-lost'
    - 30-second polling for accurate status
  gotcha: navigator.onLine can be false-positive. Always use fetch validation.

- file: src/types/Database.types.ts
  why: BaseEntity interface with sync fields
  pattern: |
    - syncStatus: 'pending' | 'synced' | 'conflict'
    - version: number (for optimistic locking)
    - lastAccessedAt: number (for LRU cleanup)
  gotcha: Song type missing sync fields - needs migration (see Implementation Tasks)

# AI Documentation (Created During Research)
- docfile: PRPs/ai_docs/supabase-offline-sync-patterns.md
  why: Comprehensive sync architecture patterns (RxDB vs PowerSync comparison)
  section: "Recommended Approach for HSA Songbook" (lines 1200-1400)
  critical: RxDB is recommended over PowerSync (cost, flexibility, TypeScript support)

- docfile: PRPs/ai_docs/conflict-resolution-ux-patterns.md
  why: UI patterns for showing conflicts to users
  section: "Implementation Recommendations for HSA Songbook" (lines 900-1200)
  critical: Desktop = modal with side-by-side diff, Mobile = bottom sheet with inline diff

- docfile: PRPs/ai_docs/offline-sync-patterns.md
  why: General offline-first patterns (queue, retry, delta sync)
  section: "Last-Write-Wins Resolution" (lines 150-250)
  critical: Server timestamp is authoritative (prevents clock skew issues)
```

### Current Codebase Tree

<details>
<summary>Click to expand full codebase structure</summary>

```bash
src/
├── app/                        # Application core
│   ├── App.tsx                # ✅ Main app with routing + ThemeProvider + PWA initialization
│   └── main.tsx               # ✅ Entry point
├── components/                # shadcn/ui components
│   └── ui/                    # ✅ Reusable UI (button, card, dialog, dropdown)
├── features/                  # Feature modules (vertical slices)
│   ├── arrangements/          # ✅ Arrangement viewing & rating
│   ├── chordpro/              # ✅ ChordPro editor/viewer (CodeMirror)
│   ├── profile/               # ✅ User profile placeholder (Phase 5: add auth)
│   ├── pwa/                   # ✅ PWA infrastructure (FOCUS HERE)
│   │   ├── components/        # UpdateNotification, OfflineIndicator
│   │   ├── db/                # ✅✅✅ CRITICAL: Database & repository patterns
│   │   │   ├── database.ts    # IndexedDB setup, sync queue schema
│   │   │   ├── migrations.ts  # Database migrations (v1-v6, Phase 5 adds v7-v10)
│   │   │   ├── repository.ts  # ✅✅✅ BaseRepository<T> with sync methods
│   │   │   ├── dataMigration.ts # Mock data import (adapt for Supabase sync)
│   │   │   └── slugMigration.ts # URL slug generation
│   │   ├── hooks/             # ✅ usePWA, useOnlineStatus (trigger sync on reconnect)
│   │   ├── types/             # Type definitions for PWA
│   │   └── utils/             # storageManager.ts (quota monitoring)
│   ├── search/                # ✅ Song search (no sync impact)
│   ├── setlists/              # ✅ Setlist management (needs sync support)
│   ├── settings/              # ✅ Settings page (Phase 5: add sync debug panel)
│   ├── shared/                # ✅ Shared components (Header, MobileNav, Breadcrumbs)
│   └── songs/                 # ✅ Song display (needs sync support)
├── lib/                       # Core utilities
│   ├── config/                # ✅ Centralized configuration (environment, PWA, storage)
│   ├── logger.ts              # ✅ Production-safe logging
│   ├── theme/                 # ✅ Theme provider (dark mode)
│   └── utils.ts               # Tailwind utilities
├── types/                     # Global TypeScript types
│   ├── Arrangement.types.ts   # ✅ 70% sync-ready (has syncStatus, version)
│   ├── Database.types.ts      # ✅ BaseEntity, SyncQueueItem, HSASongbookDB schema
│   ├── Setlist.types.ts       # ✅ 60% sync-ready (missing lastAccessedAt)
│   └── Song.types.ts          # ❌ 30% sync-ready (missing syncStatus, version)
└── vite-env.d.ts              # Vite type definitions

PRPs/                          # Project requirement documents
├── ai_docs/                   # ✅✅✅ RESEARCH DOCUMENTS (READ THESE FIRST)
│   ├── supabase-offline-sync-patterns.md  # 2000 lines: RxDB vs PowerSync, LWW strategy
│   ├── conflict-resolution-ux-patterns.md # 1200 lines: UI patterns, libraries, code
│   └── offline-sync-patterns.md           # 736 lines: General sync architecture
├── completed/                 # ✅ Completed phase PRDs (reference for architecture)
│   └── phase4-setlist-management.md       # Setlist CRUD, drag-and-drop patterns
├── phase5-sync-conflict-resolution-prd.md # ✅ Strategic decisions, API specs
├── phase5-authentication-flow-prd.md      # ✅ Auth setup (prerequisite for sync)
└── phase5-data-model-supabase-schema-prd.md # ✅ SQL schema, RLS policies

public/                        # Static files
├── icons/                     # PWA icons (auto-generated)
└── manifest.json              # PWA manifest

# Key Configuration Files
├── vite.config.ts             # ✅ Vite + PWA plugin (service worker config)
├── tsconfig.app.json          # ✅ TypeScript strict mode (Phase 3.5 complete)
└── package.json               # ✅ Dependencies (see below)
```

</details>

### Desired Codebase Tree (After Phase 5 Implementation)

```bash
src/features/sync/             # ← NEW: Sync feature module
├── components/                # UI components for sync status
│   ├── SyncStatusIndicator.tsx     # Badge in header ("Syncing...", "✓ Synced")
│   ├── SyncErrorBanner.tsx         # Persistent banner for sync failures
│   └── SyncDebugPanel.tsx          # Developer tools in settings (queue viewer)
├── hooks/                     # React hooks for sync operations
│   ├── useSync.ts                  # Main sync hook (triggers sync, monitors status)
│   ├── useSyncPolling.ts           # Automatic sync on interval + reconnect
│   └── useSyncStatus.ts            # Subscribe to sync status updates
├── services/                  # Business logic layer
│   ├── SupabaseClient.ts           # Supabase client setup + auth integration
│   ├── SyncCoordinator.ts          # Orchestrates sync operations (main entry point)
│   ├── SyncQueueProcessor.ts       # Drains sync queue → Supabase
│   ├── ConflictResolver.ts         # Last-Write-Wins logic
│   └── SupabaseRepository.ts       # Extends BaseRepository with Supabase sync
├── types/                     # Sync-specific type definitions
│   ├── sync.types.ts               # SyncResult, ConflictInfo, MergeStrategy
│   └── supabase.types.ts           # Generated types from Supabase (via CLI)
└── utils/                     # Utility functions
    ├── deviceId.ts                 # Device ID generation/persistence
    ├── versionComparator.ts        # Version comparison logic
    └── timestampNormalizer.ts      # Server timestamp handling

src/lib/supabase.ts            # ← NEW: Supabase client singleton (import from sync)
```

**Responsibility Matrix:**

| File | Purpose | Key Methods/Exports |
|------|---------|---------------------|
| `SyncCoordinator.ts` | Main orchestrator | `performSync()`, `scheduleSync()`, `cancelSync()` |
| `SyncQueueProcessor.ts` | Queue processor | `processQueue()`, `processBatch()`, `handleError()` |
| `ConflictResolver.ts` | LWW resolver | `resolveLWW()`, `compareVersions()`, `pickWinner()` |
| `SupabaseRepository.ts` | Supabase CRUD | `syncToSupabase()`, `pullFromSupabase()`, `detectConflict()` |
| `useSync.ts` | React hook | `sync()`, `syncStatus`, `lastSyncedAt`, `retrySync()` |

---

### Known Gotchas of our Codebase & Library Quirks

```typescript
// CRITICAL: Supabase RLS (Row Level Security) quirks
// ❌ BAD: Queries without RLS return ALL rows (security leak!)
// ✅ GOOD: Always test RLS policies with different user contexts
// Example: Create test users A and B, verify A can't see B's data
await supabase.from('arrangements').select('*'); // Without auth, returns NOTHING due to RLS

// CRITICAL: IndexedDB compound indexes require EXACT order
// ❌ BAD: Query by [syncStatus, userId] when index is [userId, syncStatus]
// ✅ GOOD: Match query order to index definition
const index = store.index('by-user-sync-status'); // Defined as [userId, syncStatus]
const results = index.getAll([userId, 'pending']); // Must match order!

// GOTCHA: navigator.onLine is unreliable
// ❌ BAD: if (navigator.onLine) { syncToSupabase(); }
// ✅ GOOD: Use useOnlineStatus hook (validates with fetch)
const { isOnline } = useOnlineStatus(); // Fetches /favicon.ico to verify
if (isOnline) { syncToSupabase(); }

// GOTCHA: Supabase auto-refresh tokens expire after 1 hour
// ❌ BAD: Assume token is always valid
// ✅ GOOD: Handle refresh failure when offline
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    // Resume sync operations
  } else if (event === 'SIGNED_OUT') {
    // Stop sync (user logged out)
  }
});

// GOTCHA: Service worker can intercept Supabase requests
// ❌ BAD: Cache Supabase API responses (breaks auth)
// ✅ GOOD: Exclude /api/* from service worker cache (already configured)
// See vite.config.ts line 37: navigateFallbackDenylist: [/^\/api/]

// GOTCHA: ChordSheetJS metadata directives
// ❌ BAD: Store {key: D}, {tempo: 120} in chordProContent
// ✅ GOOD: Use arrangement fields, inject at render time
// See src/features/chordpro/utils/metadataInjector.ts (Phase 3 pattern)

// GOTCHA: Version field must increment atomically
// ❌ BAD: const newVersion = entity.version + 1; await save({ ...entity, version: newVersion });
// ✅ GOOD: BaseRepository handles this automatically (line 150-170 of repository.ts)
await repository.save(entity); // Version auto-incremented in save()

// GOTCHA: React strict mode double-renders
// ❌ BAD: useEffect(() => { syncQueue.processQueue(); }, []); // Runs twice in dev
// ✅ GOOD: Add guard to prevent double-execution
useEffect(() => {
  let cancelled = false;
  if (!cancelled) syncQueue.processQueue();
  return () => { cancelled = true; };
}, []);

// GOTCHA: IndexedDB transactions are auto-committing
// ❌ BAD: Assume transaction stays open for async operations
// ✅ GOOD: Use IDBTransaction.done promise (idb library handles this)
const tx = db.transaction('songs', 'readwrite');
await tx.objectStore('songs').put(song);
await tx.done; // Wait for commit

// GOTCHA: Supabase batch operations have 1000-row limit
// ❌ BAD: .insert(arrayOf10000Items)
// ✅ GOOD: Chunk into batches of 100-500 items
for (const batch of chunk(items, 500)) {
  await supabase.from('songs').insert(batch);
}
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// ============================================================================
// 1. Enhanced BaseEntity (Update Existing Type)
// ============================================================================
// File: src/types/Database.types.ts
export interface BaseEntity {
  // Existing fields
  id: string; // Make required (was optional)
  createdAt: string; // Make required (was optional)
  updatedAt: string; // Already required
  syncStatus?: 'pending' | 'synced' | 'conflict';
  version?: number;
  lastAccessedAt?: number;

  // NEW: Phase 5 additions
  userId?: string; // Owner of this entity (Supabase UUID)
  deviceId?: string; // Last device that modified (for conflict context)
  lastSyncedAt?: string; // Server timestamp from last successful sync
  serverVersion?: number; // Server's version (for three-way merge)
  conflictedAt?: string; // When conflict was detected (Phase 5.1)
}

// ============================================================================
// 2. Sync-Specific Types (New File)
// ============================================================================
// File: src/features/sync/types/sync.types.ts

export interface SyncResult {
  success: boolean;
  itemsSynced: number;
  itemsFailed: number;
  conflicts: ConflictInfo[];
  errors: SyncError[];
}

export interface ConflictInfo {
  entityType: 'song' | 'arrangement' | 'setlist';
  entityId: string;
  localVersion: number;
  serverVersion: number;
  resolution: 'local_wins' | 'server_wins' | 'manual_required';
  resolvedAt: string;
}

export interface SyncError {
  entityType: 'song' | 'arrangement' | 'setlist';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  errorMessage: string;
  retryCount: number;
  timestamp: string;
}

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'error' | 'synced';
  lastSyncedAt: string | null;
  pendingCount: number;
  failedCount: number;
  isSyncing: boolean;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  lastSyncedAt: string;
  platform: string; // 'desktop' | 'mobile' | 'tablet'
}

// ============================================================================
// 3. Supabase Schema Types (Generated via CLI)
// ============================================================================
// File: src/features/sync/types/supabase.types.ts
// Generated with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/features/sync/types/supabase.types.ts

export interface Database {
  public: {
    Tables: {
      songs: {
        Row: {
          id: string;
          slug: string;
          user_id: string;
          title: string;
          artist: string;
          // ... other fields
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Row, 'created_at' | 'updated_at'>;
        Update: Partial<Insert>;
      };
      arrangements: {
        // Similar structure
      };
      setlists: {
        // Similar structure
      };
    };
    Views: {
      // Materialized views (optional)
    };
    Functions: {
      // Database functions
    };
  };
}

// ============================================================================
// 4. Repository Extensions (Extend Existing BaseRepository)
// ============================================================================
// File: src/features/sync/services/SupabaseRepository.ts

export abstract class SupabaseRepository<T extends BaseEntity> extends BaseRepository<T> {
  protected abstract tableName: string;
  protected resolver = new ConflictResolver();

  /**
   * Sync entity from IndexedDB to Supabase
   * Handles conflict detection and resolution
   */
  async syncToSupabase(entityId: string, localData: T): Promise<void> {
    // 1. Fetch remote version from Supabase
    const remoteData = await this.fetchRemote(entityId);

    // 2. No remote version → Create new
    if (!remoteData) {
      await this.createOnServer(localData);
      await this.markAsSynced(entityId, new Date().toISOString());
      return;
    }

    // 3. Check for conflict (version mismatch)
    if (this.hasConflict(localData, remoteData)) {
      const resolved = this.resolver.resolveLWW(localData, remoteData);
      await this.updateOnServer(resolved);
      await this.updateLocal(resolved);
    } else {
      // No conflict → simple update
      await this.updateOnServer(localData);
    }

    // 4. Mark as synced in IndexedDB
    await this.markAsSynced(entityId, remoteData.last_synced_at);
  }

  /**
   * Pull latest changes from Supabase to IndexedDB
   * Used for initial sync and periodic refresh
   */
  async pullFromSupabase(userId: string): Promise<T[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', this.getLastPullTimestamp());

    if (error) throw error;

    // Bulk save to IndexedDB
    await this.bulkSave(data.map(this.mapFromSupabase));
    return data.map(this.mapFromSupabase);
  }

  private hasConflict(local: T, remote: any): boolean {
    return local.version !== remote.version;
  }

  private async fetchRemote(entityId: string): Promise<any> {
    const { data } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', entityId)
      .single();
    return data;
  }

  private async createOnServer(entity: T): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .insert(this.mapToSupabase(entity));
    if (error) throw error;
  }

  private async updateOnServer(entity: T): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update(this.mapToSupabase(entity))
      .eq('id', entity.id);
    if (error) throw error;
  }

  private async updateLocal(entity: T): Promise<void> {
    await this.save(entity);
  }

  protected abstract mapToSupabase(entity: T): any;
  protected abstract mapFromSupabase(data: any): T;
  protected abstract getLastPullTimestamp(): string;
}
```

---

### Implementation Tasks (Ordered by Dependencies)

```yaml
# ============================================================================
# PHASE 5.0: Core Sync (1 week, 40 hours)
# ============================================================================

# Day 1: Foundation (8 hours)
# ============================================================================

Task 1: SET UP Supabase project
  - CREATE: Supabase account + new project at https://supabase.com/dashboard
  - COPY: Project URL and anon key to .env.local
  - VERIFY: Test connection with simple query
  - DEPENDENCIES: None
  - VALIDATION: supabase.from('songs').select('count').then(console.log) returns count
  - FILE: .env.local (new), src/lib/supabase.ts (new)

Task 2: CREATE Supabase SQL schema
  - RUN: SQL migration script from phase5-data-model-supabase-schema-prd.md (lines 230-750)
  - CREATE: songs, arrangements, setlists, setlist_songs, user_preferences tables
  - ADD: RLS policies for all tables
  - ADD: Triggers for updated_at auto-update
  - DEPENDENCIES: Task 1 (Supabase project)
  - VALIDATION: psql connection + SELECT * FROM songs LIMIT 1 (should return 0 rows with RLS)
  - FILE: Supabase dashboard SQL editor

Task 3: GENERATE TypeScript types from Supabase schema
  - RUN: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/features/sync/types/supabase.types.ts
  - VERIFY: Generated file has Database interface with public.Tables
  - DEPENDENCIES: Task 2 (SQL schema)
  - VALIDATION: Import Database type in TypeScript file (should have no errors)
  - FILE: src/features/sync/types/supabase.types.ts (new)

Task 4: UPDATE BaseEntity interface with sync fields
  - ADD: userId, deviceId, lastSyncedAt, serverVersion, conflictedAt fields
  - MAKE: id and createdAt required (remove optional ? markers)
  - DEPENDENCIES: None (type-only change)
  - VALIDATION: npm run typecheck (should pass)
  - FILE: src/types/Database.types.ts (update lines 10-30)

Task 5: UPDATE Song.types.ts to extend BaseEntity
  - CHANGE: export interface Song extends BaseEntity { ... }
  - REMOVE: Duplicate createdAt, updatedAt fields (inherited)
  - ADD: userId field (required for multi-user)
  - DEPENDENCIES: Task 4 (BaseEntity updated)
  - VALIDATION: npm run typecheck (should pass)
  - FILE: src/types/Song.types.ts (update lines 1-20)

Task 6: CREATE device ID utility
  - IMPLEMENT: getDeviceId() function with localStorage persistence
  - IMPLEMENT: getDeviceName() function with platform detection
  - PATTERN: Use nanoid(12) for unique device ID
  - DEPENDENCIES: None
  - VALIDATION: getDeviceId() returns same value across calls
  - FILE: src/features/sync/utils/deviceId.ts (new, ~50 lines)

Task 7: CREATE Supabase client singleton
  - INSTALL: @supabase/supabase-js npm package
  - SETUP: createClient with auth config (autoRefreshToken, persistSession)
  - EXPORT: Singleton supabase instance
  - DEPENDENCIES: Task 1 (env vars), Task 3 (types)
  - VALIDATION: import { supabase } from '@/lib/supabase'; supabase.from('songs').select('count') works
  - FILE: src/lib/supabase.ts (new, ~30 lines)

Task 8: CREATE sync types file
  - IMPLEMENT: SyncResult, ConflictInfo, SyncError, SyncStatus, DeviceInfo interfaces
  - FOLLOW: Type definitions from "Data Models and Structure" section above
  - DEPENDENCIES: Task 4 (BaseEntity)
  - VALIDATION: npm run typecheck (should pass)
  - FILE: src/features/sync/types/sync.types.ts (new, ~80 lines)

# Day 2: Conflict Resolution (8 hours)
# ============================================================================

Task 9: CREATE ConflictResolver class
  - IMPLEMENT: resolveLWW() method (Last-Write-Wins logic)
  - ADD: Server timestamp comparison (authoritative)
  - ADD: Device ID tie-breaker (lexicographic order)
  - FOLLOW: Pattern from PRPs/ai_docs/offline-sync-patterns.md lines 150-250
  - DEPENDENCIES: Task 8 (sync types)
  - VALIDATION: Unit tests (see Task 14)
  - FILE: src/features/sync/services/ConflictResolver.ts (new, ~100 lines)

Task 10: CREATE SupabaseRepository abstract class
  - EXTEND: BaseRepository<T extends BaseEntity>
  - IMPLEMENT: syncToSupabase(), pullFromSupabase(), hasConflict() methods
  - INTEGRATE: ConflictResolver for LWW resolution
  - FOLLOW: Code example in "Data Models and Structure" section above
  - DEPENDENCIES: Task 7 (Supabase client), Task 9 (ConflictResolver)
  - VALIDATION: npm run typecheck (should pass)
  - FILE: src/features/sync/services/SupabaseRepository.ts (new, ~300 lines)

Task 11: CREATE concrete repository classes
  - IMPLEMENT: SongRepositorySupabase extends SupabaseRepository<Song>
  - IMPLEMENT: ArrangementRepositorySupabase extends SupabaseRepository<Arrangement>
  - IMPLEMENT: SetlistRepositorySupabase extends SupabaseRepository<Setlist>
  - ADD: mapToSupabase() and mapFromSupabase() for each entity type
  - DEPENDENCIES: Task 10 (SupabaseRepository)
  - VALIDATION: npm run typecheck (should pass)
  - FILE: src/features/sync/services/repositories/*.ts (3 new files, ~150 lines each)

# Day 3: Sync Queue Processor (8 hours)
# ============================================================================

Task 12: CREATE SyncQueueProcessor class
  - IMPLEMENT: processQueue() method (drain syncQueue store → Supabase)
  - IMPLEMENT: processBatch() method (batch uploads, max 10-20 items)
  - IMPLEMENT: handleError() method (exponential backoff retry logic)
  - FOLLOW: Pattern from src/features/pwa/db/repository.ts lines 200-220
  - DEPENDENCIES: Task 10 (SupabaseRepository), Task 11 (concrete repos)
  - VALIDATION: Unit tests (see Task 15)
  - FILE: src/features/sync/services/SyncQueueProcessor.ts (new, ~250 lines)

Task 13: CREATE SyncCoordinator class
  - IMPLEMENT: performSync() method (orchestrate full sync: queue drain + pull)
  - IMPLEMENT: scheduleSync() method (periodic sync every 5 minutes when online)
  - IMPLEMENT: cancelSync() method (cancel ongoing sync)
  - INTEGRATE: SyncQueueProcessor for push sync
  - INTEGRATE: SupabaseRepository for pull sync
  - DEPENDENCIES: Task 12 (SyncQueueProcessor)
  - VALIDATION: Integration tests (see Task 16)
  - FILE: src/features/sync/services/SyncCoordinator.ts (new, ~200 lines)

# Day 4: React Hooks (8 hours)
# ============================================================================

Task 14: CREATE useSync hook
  - IMPLEMENT: sync(), syncStatus, lastSyncedAt, pendingCount, retrySync() exports
  - INTEGRATE: SyncCoordinator for sync operations
  - INTEGRATE: useOnlineStatus for network awareness
  - PATTERN: Use React Query for reactive updates (optional)
  - DEPENDENCIES: Task 13 (SyncCoordinator)
  - VALIDATION: Integration tests (see Task 16)
  - FILE: src/features/sync/hooks/useSync.ts (new, ~150 lines)

Task 15: CREATE useSyncPolling hook
  - IMPLEMENT: Auto-trigger sync on interval (5 minutes when online)
  - IMPLEMENT: Auto-trigger sync on 'connection-restored' event
  - INTEGRATE: useOnlineStatus hook
  - INTEGRATE: useSync hook
  - DEPENDENCIES: Task 14 (useSync)
  - VALIDATION: Manual testing (disconnect/reconnect network)
  - FILE: src/features/sync/hooks/useSyncPolling.ts (new, ~100 lines)

Task 16: CREATE useSyncStatus hook
  - IMPLEMENT: Subscribe to sync status updates (reactive)
  - EXPORT: syncStatus, lastSyncedAt, pendingCount, failedCount
  - PATTERN: Use React Context or Zustand for global state
  - DEPENDENCIES: Task 14 (useSync)
  - VALIDATION: Integration tests (see Task 18)
  - FILE: src/features/sync/hooks/useSyncStatus.ts (new, ~80 lines)

# Day 5: UI Components (8 hours)
# ============================================================================

Task 17: CREATE SyncStatusIndicator component
  - IMPLEMENT: Badge showing "Syncing...", "✓ Synced", "Sync Error" states
  - DESIGN: Desktop = top-right header, Mobile = bottom-left corner
  - INTEGRATE: useSyncStatus hook
  - FOLLOW: shadcn/ui Badge component (src/components/ui/badge.tsx)
  - DEPENDENCIES: Task 16 (useSyncStatus)
  - VALIDATION: Storybook or manual testing (simulate states)
  - FILE: src/features/sync/components/SyncStatusIndicator.tsx (new, ~100 lines)

Task 18: CREATE SyncErrorBanner component
  - IMPLEMENT: Persistent banner for sync failures
  - ADD: "Retry Now" button + "Dismiss" button
  - DESIGN: Full-width banner below header (mobile + desktop)
  - INTEGRATE: useSync hook for retry action
  - FOLLOW: shadcn/ui Alert component (src/components/ui/alert.tsx)
  - DEPENDENCIES: Task 14 (useSync), Task 16 (useSyncStatus)
  - VALIDATION: Manual testing (force sync error, verify UI)
  - FILE: src/features/sync/components/SyncErrorBanner.tsx (new, ~120 lines)

Task 19: CREATE SyncDebugPanel component (Developer Tools)
  - IMPLEMENT: Show sync queue items, status, last synced timestamps
  - ADD: "Force Sync Now" button, "Clear Queue" button
  - DESIGN: Collapsible panel in settings page (Advanced section)
  - INTEGRATE: useSync hook, direct IndexedDB access
  - DEPENDENCIES: Task 14 (useSync), Task 16 (useSyncStatus)
  - VALIDATION: Manual testing (inspect queue, trigger sync)
  - FILE: src/features/sync/components/SyncDebugPanel.tsx (new, ~200 lines)

Task 20: INTEGRATE sync components into app
  - ADD: SyncStatusIndicator to DesktopHeader.tsx (top-right, next to user avatar)
  - ADD: SyncStatusIndicator to MobileNav.tsx (bottom-left corner)
  - ADD: SyncErrorBanner to App.tsx (below header, above main content)
  - ADD: SyncDebugPanel to SettingsPage.tsx (Advanced section)
  - DEPENDENCIES: Task 17, 18, 19 (all components)
  - VALIDATION: Visual inspection + npm run dev (should render without errors)
  - FILES: src/features/shared/components/DesktopHeader.tsx (update), src/features/shared/components/MobileNav.tsx (update), src/app/App.tsx (update), src/features/settings/pages/SettingsPage.tsx (update)

# Day 6: Testing (8 hours)
# ============================================================================

Task 21: WRITE unit tests for ConflictResolver
  - TEST: resolveLWW() with local > remote timestamp (local wins)
  - TEST: resolveLWW() with remote > local timestamp (remote wins)
  - TEST: resolveLWW() with equal timestamps (device ID tie-breaker)
  - FRAMEWORK: Vitest (already configured)
  - DEPENDENCIES: Task 9 (ConflictResolver)
  - VALIDATION: npm run test -- src/features/sync/services/ConflictResolver.test.ts (all pass)
  - FILE: src/features/sync/services/ConflictResolver.test.ts (new, ~200 lines)

Task 22: WRITE unit tests for SyncQueueProcessor
  - TEST: processQueue() with empty queue (no-op)
  - TEST: processQueue() with 3 items (all succeed)
  - TEST: processQueue() with 1 failed item (retry logic)
  - TEST: processBatch() with 20 items (chunking)
  - DEPENDENCIES: Task 12 (SyncQueueProcessor)
  - VALIDATION: npm run test -- src/features/sync/services/SyncQueueProcessor.test.ts (all pass)
  - FILE: src/features/sync/services/SyncQueueProcessor.test.ts (new, ~300 lines)

Task 23: WRITE integration tests for sync flow
  - TEST: User edits arrangement offline → reconnects → sync succeeds
  - TEST: User edits on Device A, then Device B → conflict resolves (LWW)
  - TEST: User edits offline → network fails → retry with exponential backoff
  - FRAMEWORK: Vitest + Mock Supabase client
  - DEPENDENCIES: Task 13 (SyncCoordinator), Task 14 (useSync)
  - VALIDATION: npm run test -- src/features/sync/integration/ (all pass)
  - FILE: src/features/sync/integration/sync-flow.test.ts (new, ~400 lines)

Task 24: WRITE end-to-end tests for multi-device sync
  - TEST: Open app on Device A (Playwright browser 1), edit arrangement
  - TEST: Open app on Device B (Playwright browser 2), verify changes appear
  - TEST: Edit same arrangement on both devices (offline) → conflict resolves
  - FRAMEWORK: Playwright (install if not present)
  - DEPENDENCIES: Task 20 (UI integration)
  - VALIDATION: npm run test:e2e (all pass)
  - FILE: tests/e2e/multi-device-sync.spec.ts (new, ~300 lines)

# Day 7: Polish & Documentation (8 hours)
# ============================================================================

Task 25: ADD database migrations for sync fields
  - CREATE: Migration v7: Add userId, deviceId, lastSyncedAt indexes
  - CREATE: Migration v8: Add serverVersion, conflictedAt indexes
  - FOLLOW: Pattern from src/features/pwa/db/migrations.ts
  - DEPENDENCIES: Task 4 (BaseEntity updated)
  - VALIDATION: npm run dev → Open app → IndexedDB inspector (verify indexes)
  - FILE: src/features/pwa/db/migrations.ts (update, add v7-v8)

Task 26: UPDATE authentication integration
  - INTEGRATE: Supabase auth with existing anonymous user flow (Phase 5 auth PRD)
  - ADD: User ID to all entities on sign-in
  - TEST: Anonymous user converts to authenticated → data preserved + synced
  - DEPENDENCIES: phase5-authentication-flow-prd.md implementation (prerequisite)
  - VALIDATION: Sign in → check Supabase dashboard → user_id populated
  - FILES: src/features/auth/hooks/useAuth.ts (update), src/features/auth/components/AuthProvider.tsx (update)

Task 27: ADD telemetry for sync metrics
  - TRACK: Sync success rate, latency, conflict rate, error rate
  - INTEGRATE: Google Analytics or Sentry (optional)
  - LOG: Sync events to console in development (logger.info)
  - DEPENDENCIES: Task 13 (SyncCoordinator)
  - VALIDATION: npm run dev → Perform sync → Check console logs
  - FILE: src/features/sync/services/SyncCoordinator.ts (update, add telemetry)

Task 28: WRITE user-facing documentation
  - CREATE: "How Sync Works" help article
  - EXPLAIN: Last-Write-Wins strategy, conflict resolution, offline behavior
  - ADD: FAQ section (common issues, troubleshooting)
  - DEPENDENCIES: None
  - VALIDATION: User review (ask for feedback)
  - FILE: docs/sync-how-it-works.md (new, ~500 words)

# ============================================================================
# END OF PHASE 5.0 (Core Sync MVP)
# ============================================================================
```

---

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: Supabase Client Setup
// ============================================================================
// File: src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/features/sync/types/supabase.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true, // Auto-refresh JWT token
    persistSession: true,    // Persist session to localStorage
    detectSessionInUrl: true, // Handle OAuth redirects
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limit for real-time subscriptions
    },
  },
});

// GOTCHA: Always check auth state before sync operations
export async function ensureAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
}

// ============================================================================
// PATTERN 2: Last-Write-Wins Conflict Resolution
// ============================================================================
// File: src/features/sync/services/ConflictResolver.ts

import type { BaseEntity } from '@/types/Database.types';
import logger from '@/lib/logger';

export class ConflictResolver {
  /**
   * Last-Write-Wins conflict resolution
   * Server timestamp is authoritative (prevents clock skew issues)
   *
   * Resolution logic:
   * 1. Compare updatedAt timestamps
   * 2. If timestamps equal, use deviceId lexicographic order as tie-breaker
   * 3. Winner's data overwrites loser's data
   */
  resolveLWW<T extends BaseEntity>(local: T, remote: T): T {
    const localTime = new Date(local.updatedAt).getTime();
    const remoteTime = new Date(remote.updatedAt).getTime();

    if (localTime > remoteTime) {
      logger.info(`Conflict resolved: local wins (${local.id})`);
      return { ...local, serverVersion: remote.version }; // Preserve server version
    } else if (remoteTime > localTime) {
      logger.info(`Conflict resolved: remote wins (${remote.id})`);
      return remote;
    } else {
      // Timestamps equal → tie-breaker
      const winner = local.deviceId! > remote.deviceId! ? local : remote;
      logger.info(`Conflict tie-breaker: ${winner.deviceId} wins (${winner.id})`);
      return winner;
    }
  }

  // CRITICAL: Always increment version after conflict resolution
  // Prevents infinite conflict loops
  incrementVersion<T extends BaseEntity>(entity: T): T {
    return {
      ...entity,
      version: (entity.version || 0) + 1,
      serverVersion: (entity.serverVersion || 0) + 1,
    };
  }
}

// ============================================================================
// PATTERN 3: Sync Queue Processing with Exponential Backoff
// ============================================================================
// File: src/features/sync/services/SyncQueueProcessor.ts

import { getDatabase } from '@/features/pwa/db/database';
import type { SyncQueueItem } from '@/types/Database.types';
import logger from '@/lib/logger';

export class SyncQueueProcessor {
  private processing = false;
  private maxRetries = 5;
  private baseDelay = 2000; // 2 seconds

  async processQueue(): Promise<void> {
    if (this.processing || !navigator.onLine) return;

    this.processing = true;
    logger.info('Processing sync queue...');

    try {
      const db = await getDatabase();
      const queue = await db.getAll('syncQueue');

      for (const item of queue) {
        try {
          await this.processItem(item);
          await db.delete('syncQueue', item.id);
          logger.info(`Synced ${item.type} ${item.entityId}`);
        } catch (error) {
          await this.handleRetry(item, error);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  private async handleRetry(item: SyncQueueItem, error: unknown): Promise<void> {
    const db = await getDatabase();

    item.retryCount++;

    if (item.retryCount >= this.maxRetries) {
      // Max retries exceeded → Move to dead letter queue or delete
      logger.error(`Max retries exceeded for ${item.id}`, error);
      await db.delete('syncQueue', item.id);
      // TODO: Move to dead letter queue for manual inspection
    } else {
      // Exponential backoff: 2s, 4s, 8s, 16s, 32s
      const delay = Math.min(this.baseDelay * Math.pow(2, item.retryCount), 60000);
      logger.warn(`Retry ${item.retryCount}/${this.maxRetries} for ${item.id} in ${delay}ms`);

      // Schedule retry
      setTimeout(() => this.processQueue(), delay);

      // Update retry count in queue
      await db.put('syncQueue', item);
    }
  }

  // GOTCHA: Process in batches for efficiency (reduce network round-trips)
  private async processBatch(items: SyncQueueItem[]): Promise<void> {
    const batchSize = 10;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await Promise.all(batch.map(item => this.processItem(item)));
    }
  }
}

// ============================================================================
// PATTERN 4: React Hook for Sync Operations
// ============================================================================
// File: src/features/sync/hooks/useSync.ts

import { useState, useCallback, useEffect } from 'react';
import { SyncCoordinator } from '../services/SyncCoordinator';
import { useOnlineStatus } from '@/features/pwa/hooks/useOnlineStatus';
import type { SyncStatus } from '../types/sync.types';

export function useSync() {
  const { isOnline } = useOnlineStatus();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'idle',
    lastSyncedAt: null,
    pendingCount: 0,
    failedCount: 0,
    isSyncing: false,
  });

  const coordinator = useMemo(() => new SyncCoordinator(), []);

  const sync = useCallback(async () => {
    if (!isOnline || syncStatus.isSyncing) return;

    setSyncStatus(prev => ({ ...prev, status: 'syncing', isSyncing: true }));

    try {
      const result = await coordinator.performSync();
      setSyncStatus({
        status: 'synced',
        lastSyncedAt: new Date().toISOString(),
        pendingCount: 0,
        failedCount: result.itemsFailed,
        isSyncing: false,
      });
    } catch (error) {
      logger.error('Sync failed:', error);
      setSyncStatus(prev => ({ ...prev, status: 'error', isSyncing: false }));
    }
  }, [isOnline, coordinator, syncStatus.isSyncing]);

  // Auto-sync on network reconnection
  useEffect(() => {
    if (isOnline && syncStatus.status === 'error') {
      sync(); // Retry failed sync
    }
  }, [isOnline]);

  return {
    sync,
    syncStatus,
    retrySync: sync, // Alias for user-triggered retry
  };
}

// ============================================================================
// PATTERN 5: Sync Status Indicator Component
// ============================================================================
// File: src/features/sync/components/SyncStatusIndicator.tsx

import { useSyncStatus } from '../hooks/useSyncStatus';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, AlertCircle } from 'lucide-react';

export function SyncStatusIndicator() {
  const { syncStatus } = useSyncStatus();

  if (syncStatus.status === 'idle' || syncStatus.status === 'synced') {
    return (
      <Badge variant="outline" className="gap-1">
        <Check className="h-3 w-3" />
        <span className="hidden sm:inline">Synced</span>
      </Badge>
    );
  }

  if (syncStatus.status === 'syncing') {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="hidden sm:inline">Syncing...</span>
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="gap-1">
      <AlertCircle className="h-3 w-3" />
      <span className="hidden sm:inline">Sync Error</span>
    </Badge>
  );
}

// CRITICAL: Mobile placement (bottom-left corner, fixed positioning)
// Desktop placement (top-right header, next to user avatar)
```

---

### Integration Points

```yaml
# ============================================================================
# DATABASE (Supabase PostgreSQL)
# ============================================================================
MIGRATION: supabase/migrations/20250115_phase5_sync_support.sql
  - ADD: user_id column to songs, arrangements, setlists tables
  - ADD: server_version, last_synced_at, device_id columns
  - CREATE: RLS policies for multi-user data isolation
  - CREATE: Triggers for updated_at auto-update
  - CREATE: Indexes for efficient sync queries

RLS: Row Level Security Policies
  - songs: "Users can view their own songs OR public songs"
  - arrangements: "Users can view their own arrangements OR public arrangements"
  - setlists: "Users can view their own setlists ONLY (private)"

# ============================================================================
# TYPES (TypeScript Type Generation)
# ============================================================================
UPDATE: src/types/Database.types.ts
  - BaseEntity: Add userId, deviceId, lastSyncedAt, serverVersion, conflictedAt

GENERATE: src/features/sync/types/supabase.types.ts
  - Command: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/features/sync/types/supabase.types.ts
  - Output: Database interface with public.Tables for songs, arrangements, setlists

# ============================================================================
# ROUTING (React Router Integration)
# ============================================================================
ADD: Sync debug panel route (settings page)
  - Route: /settings → Scroll to Advanced section → Sync Debug Panel
  - Component: src/features/sync/components/SyncDebugPanel.tsx

# ============================================================================
# AUTHENTICATION (Supabase Auth Integration)
# ============================================================================
INTEGRATE: phase5-authentication-flow-prd.md (prerequisite)
  - User sign-in flow → Populate userId in all entities
  - Anonymous → Authenticated conversion → Upload local data + sync

# ============================================================================
# SERVICE WORKER (Vite PWA Plugin)
# ============================================================================
NO CHANGES REQUIRED: Service worker already configured correctly
  - navigateFallbackDenylist: [/^\/api/] → Excludes Supabase API from cache
  - Auth tokens NOT cached (security)

# ============================================================================
# ENVIRONMENT VARIABLES (New .env.local Variables)
# ============================================================================
ADD: .env.local
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

SECURITY: Anon key is safe to expose (public key), RLS protects data
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint          # ESLint check (should pass with 0 errors)
npm run typecheck     # TypeScript compilation (strict mode enabled)
npm run build         # Full build (should complete without errors)

# Expected output:
# ✓ Lint: 0 errors, 0 warnings
# ✓ TypeScript: 0 errors
# ✓ Build: dist/ folder created, 1.3 MB bundle size

# If errors exist:
# 1. READ error output carefully (TypeScript errors are descriptive)
# 2. FIX issues (common: missing types, unused imports, any type usage)
# 3. RERUN validation before proceeding
```

---

### Level 2: Unit Tests (Component Validation)

```bash
# Test each component as it's created
npm run test -- src/features/sync/services/ConflictResolver.test.ts
npm run test -- src/features/sync/services/SyncQueueProcessor.test.ts
npm run test -- src/features/sync/hooks/useSync.test.ts

# Full test suite for sync feature
npm run test -- src/features/sync/

# Coverage validation (target: >80% for sync logic)
npm run test:coverage

# Expected output:
# PASS  src/features/sync/services/ConflictResolver.test.ts (5 tests)
# PASS  src/features/sync/services/SyncQueueProcessor.test.ts (8 tests)
# PASS  src/features/sync/hooks/useSync.test.ts (6 tests)
# Test Suites: 3 passed, 3 total
# Tests:       19 passed, 19 total
# Coverage: 85% (sync/ directory)

# If tests fail:
# 1. READ test output (shows expected vs. actual)
# 2. DEBUG root cause (add console.log, use Vitest UI)
# 3. FIX implementation or update test expectations
# 4. RERUN until all pass
```

---

### Level 3: Integration Testing (System Validation)

```bash
# Start development server
npm run dev &
sleep 5  # Wait for server startup

# Health check (should return 200 OK)
curl -f http://localhost:5173 || echo "Dev server not responding"

# Database validation (Supabase)
npx supabase status --local    # Verify local Supabase running (if using local dev)
npx supabase db query "SELECT count(*) FROM songs" --local

# Feature-specific manual testing

# Test 1: Offline editing + sync
1. Open app in browser (http://localhost:5173)
2. Sign in with test user
3. Open DevTools → Network tab → Go offline (throttle to "Offline")
4. Edit arrangement (change tempo)
5. Verify "Saved locally" message appears
6. Go back online (throttle to "Online")
7. Verify "Syncing..." badge appears in header
8. Wait 2 seconds → Verify "✓ Synced" badge appears
9. Open app in incognito window (same user)
10. Verify arrangement has updated tempo (sync successful)

# Test 2: Conflict resolution (multi-device)
1. Open app in Browser A (http://localhost:5173)
2. Open app in Browser B (http://localhost:5174) # Use different port or incognito
3. Sign in as same user on both browsers
4. Go offline on BOTH browsers
5. Edit same arrangement on Browser A (tempo = 120)
6. Edit same arrangement on Browser B (tempo = 140)
7. Go online on Browser A first → Wait for sync
8. Go online on Browser B second → Wait for sync
9. Verify Browser A shows tempo = 140 (Browser B won via LWW)
10. Check Supabase dashboard → Verify arrangements table has tempo = 140

# Test 3: Sync failure + retry
1. Open app, sign in
2. Edit arrangement
3. Open DevTools → Network tab → Block all requests to *.supabase.co
4. Verify "Sync failed - will retry" toast appears
5. Wait 2 seconds → Verify retry attempt (console log)
6. Unblock requests
7. Wait for next retry → Verify "✓ Synced" badge

# Test 4: Sync queue persistence
1. Open app, sign in, go offline
2. Make 5 edits to 3 different arrangements
3. Open IndexedDB inspector (DevTools → Application → IndexedDB)
4. Verify syncQueue store has 3 items (coalesced: latest version per entity)
5. Close browser tab (app closed)
6. Reopen app → Go online
7. Verify sync queue automatically processes (3 items synced)

# Expected results:
# ✅ All manual tests pass (no errors, expected behavior)
# ✅ Sync latency < 2 seconds (measured with stopwatch)
# ✅ No console errors during sync
# ✅ IndexedDB and Supabase data match after sync
```

---

### Level 4: Creative & Domain-Specific Validation

```bash
# React Component Testing

# Visual regression testing (if available)
npm run test:visual    # Chromatic or Percy (optional)

# Accessibility testing
npm run test:a11y      # axe-core or Pa11y (optional)
npx pa11y http://localhost:5173  # CLI accessibility scan

# Performance testing
npm run build
npm run preview
# Open Lighthouse (Chrome DevTools → Lighthouse tab)
# Run audit → Performance score should be > 90

# E2E testing with Playwright
npm run test:e2e       # Full end-to-end test suite

# Specific E2E test for multi-device sync
npx playwright test tests/e2e/multi-device-sync.spec.ts

# Mobile responsiveness testing
# 1. Open Chrome DevTools → Toggle device toolbar (Ctrl+Shift+M)
# 2. Test on iPhone SE (375x667), iPad (768x1024), Desktop (1920x1080)
# 3. Verify sync status indicator visible on all sizes
# 4. Verify sync error banner doesn't obscure content

# Cross-browser testing
# Test in Chrome, Firefox, Safari (minimum support)
# Focus areas:
#   - IndexedDB compatibility (all modern browsers support)
#   - Service worker behavior (check registration)
#   - Network detection (navigator.onLine accuracy)

# PWA validation
npm run build
npm run preview
# Open DevTools → Application tab → Service Worker
# Verify: Status = activated, Update on reload = enabled
# Verify: Manifest tab shows correct manifest.json
# Test offline: Go offline → Navigate app → Should work

# Supabase RLS policy testing
# 1. Create two test users in Supabase dashboard (user A, user B)
# 2. Sign in as user A → Create arrangement
# 3. Sign in as user B → Try to fetch user A's arrangement
# 4. Verify: RLS prevents access (empty result set)
# 5. User A makes arrangement public (is_public = true)
# 6. User B fetches again → Verify: RLS allows access

# Custom Business Logic Validation

# Conflict resolution accuracy test
# 1. Create arrangement with version = 1
# 2. Simulate conflict: local version = 2, remote version = 3
# 3. Verify: LWW resolver picks newer timestamp
# 4. Edge case: Equal timestamps → Verify device ID tie-breaker works

# Sync queue coalescing test
# 1. Edit same arrangement 10 times offline
# 2. Verify: Sync queue has only 1 item (latest version)
# 3. Go online → Sync → Verify: Only 1 upload (not 10)

# Version increment test
# 1. Create arrangement (version = 1)
# 2. Edit arrangement (version = 2)
# 3. Sync → Verify: Supabase version = 2
# 4. Edit again (version = 3)
# 5. Sync → Verify: Supabase version = 3

# Expected output:
# ✅ All creative validations pass
# ✅ Performance meets requirements (Lighthouse > 90)
# ✅ Accessibility meets WCAG 2.1 AA standards (axe score 100)
# ✅ E2E tests pass (Playwright green checkmarks)
# ✅ Cross-browser works (Chrome, Firefox, Safari)
# ✅ PWA works offline (no errors)
# ✅ RLS policies prevent unauthorized access
```

---

## Final Validation Checklist

### Technical Validation
- [ ] All 4 validation levels completed successfully (Levels 1-4 above)
- [ ] All unit tests pass: `npm run test -- src/features/sync/` (>80% coverage)
- [ ] No linting errors: `npm run lint` (0 errors, 0 warnings)
- [ ] No type errors: `npm run typecheck` (strict mode enabled)
- [ ] TypeScript strict mode compliance (0 `any` types, 0 `@ts-ignore` comments)
- [ ] Build succeeds: `npm run build` (dist/ folder created, <2 MB bundle)
- [ ] All integration tests pass (manual testing scenarios 1-4)
- [ ] E2E tests pass: `npm run test:e2e` (multi-device sync validated)

### Feature Validation
- [ ] User can edit arrangements offline on Device A
- [ ] Changes automatically sync to Supabase when Device A reconnects
- [ ] Device B pulls latest changes on next refresh
- [ ] Conflicts resolve automatically using Last-Write-Wins (LWW)
- [ ] Sync success rate > 95% (measure with telemetry after 1 week)
- [ ] Sync latency < 2 seconds per entity (90th percentile)
- [ ] Zero data loss incidents (validated with comprehensive testing)
- [ ] Offline functionality unchanged (app works 100% offline)
- [ ] Sync status visible in UI (header badge, mobile nav badge)
- [ ] Sync errors show actionable messages ("Retry Now" button)

### Code Quality Validation
- [ ] Follows existing codebase patterns (BaseRepository, hooks, shadcn/ui)
- [ ] File placement matches desired codebase tree structure (src/features/sync/)
- [ ] Anti-patterns avoided:
  - [ ] No `any` types (ESLint enforces this)
  - [ ] No `console.log` in production code (use `logger` instead)
  - [ ] No hardcoded Supabase URLs (use env vars)
  - [ ] No cached auth tokens in service worker (security)
  - [ ] No metadata in ChordPro content (use arrangement fields)
- [ ] Dependencies properly managed (package.json updated)
- [ ] Configuration changes integrated (.env.local template documented)

### Database Validation
- [ ] Supabase schema matches IndexedDB schema (type mapping correct)
- [ ] RLS policies prevent unauthorized access (tested with 2 users)
- [ ] Indexes created for efficient sync queries (user_id, sync_status, updated_at)
- [ ] Triggers auto-update `updated_at` timestamp (tested with UPDATE query)
- [ ] Soft deletes implemented (deleted rows retained for 30 days)

### Documentation & Deployment
- [ ] Code is self-documenting (clear variable/function names)
- [ ] Logs are informative but not verbose (production-safe logger)
- [ ] Environment variables documented in .env.example
- [ ] User-facing documentation created (docs/sync-how-it-works.md)
- [ ] README.md updated with Phase 5 setup instructions

### User Experience Validation
- [ ] Sync happens transparently (no blocking modals)
- [ ] Sync status is visible but not intrusive (badge in header)
- [ ] Sync errors are actionable (clear messages, retry button)
- [ ] Mobile UX is optimized (bottom-left sync badge, no obstruction)
- [ ] Desktop UX is consistent (top-right sync badge, next to avatar)
- [ ] No friction for offline users (app works exactly as before)

---

## Anti-Patterns to Avoid

### TypeScript Anti-Patterns
- ❌ Don't use `any` type - ESLint will flag it (use `unknown` + type guards)
- ❌ Don't use `@ts-ignore` without excellent justification (fix the type instead)
- ❌ Don't define props inline - create separate interfaces (improves reusability)
- ❌ Don't skip type definitions for function parameters/return values

### Sync Anti-Patterns
- ❌ Don't trust `navigator.onLine` alone - validate with fetch (false-positives)
- ❌ Don't sync on every keystroke - debounce edits (wait 2 seconds idle)
- ❌ Don't block UI during sync - use background queue processor
- ❌ Don't show conflict UI for every conflict - auto-resolve with LWW (Phase 5.0)
- ❌ Don't retry failed syncs infinitely - use exponential backoff + max retries
- ❌ Don't cache auth tokens in service worker - security vulnerability

### Supabase Anti-Patterns
- ❌ Don't query without RLS policies - data leak risk
- ❌ Don't insert 1000+ rows in single request - chunk into batches (max 500)
- ❌ Don't hardcode Supabase URL - use environment variables
- ❌ Don't skip RLS testing - always test with multiple user contexts

### Database Anti-Patterns
- ❌ Don't hard-delete rows - use soft deletes (deleted = true)
- ❌ Don't forget to create indexes - sync queries will be slow
- ❌ Don't rely on client timestamps - server `NOW()` is authoritative

### Code Quality Anti-Patterns
- ❌ Don't create new patterns when existing ones work (use BaseRepository)
- ❌ Don't skip validation because "it should work" (always run npm run typecheck)
- ❌ Don't ignore failing tests - fix them (tests catch regressions)
- ❌ Don't mix async/await with Promise chains (pick one style, stick with it)
- ❌ Don't hardcode values that should be environment variables
- ❌ Don't skip React hook dependency arrays (causes stale closures)
- ❌ Don't forget to handle loading and error states (user sees blank screens)

---

## Appendix: Research Documents

### AI Documentation (Created During Research Phase)

All comprehensive research is available in `PRPs/ai_docs/`:

1. **supabase-offline-sync-patterns.md** (2,000 lines)
   - RxDB vs PowerSync comparison (recommendation: RxDB for cost/flexibility)
   - Complete 5-week implementation plan
   - SQL schema requirements (updated_at triggers, soft deletes, version fields)
   - Conflict resolution strategies (LWW, OT, CRDTs)
   - Code examples (TypeScript, React, Supabase)

2. **conflict-resolution-ux-patterns.md** (1,200 lines)
   - UI patterns (side-by-side diff, version selection, auto-merge)
   - How major apps handle conflicts (Google Docs, Notion, Obsidian, GitHub)
   - React component libraries (react-diff-viewer-continued recommended)
   - Mobile vs. desktop considerations
   - Best practices for non-technical users

3. **offline-sync-patterns.md** (736 lines)
   - Offline-first repository pattern
   - Last-Write-Wins (LWW) conflict resolution
   - Background sync with service worker
   - Sync queue implementation with exponential backoff
   - Delta sync for efficiency
   - Supabase integration examples

### Phase 5 PRDs (Strategic Context)

1. **phase5-sync-conflict-resolution-prd.md** (1,150 lines)
   - Strategic decision: LWW + Version Vectors (vs CRDTs, OT)
   - API specifications (PUT /arrangements/:id with conflict detection)
   - Data model additions (deviceId, lastSyncedAt, serverVersion)
   - Risk assessment and mitigations
   - Success metrics (>95% sync success rate, <5% conflict rate)

2. **phase5-authentication-flow-prd.md** (1,655 lines)
   - Anonymous sign-in flow (prerequisite for sync)
   - Email/password authentication
   - User ID integration with entities
   - Session persistence and token refresh

3. **phase5-data-model-supabase-schema-prd.md** (1,492 lines)
   - Complete SQL schema (songs, arrangements, setlists tables)
   - RLS policies for multi-user data isolation
   - Migration strategy from IndexedDB to Supabase
   - Type mapping (IndexedDB ↔ Supabase)

---

## Confidence Score: 9/10

**Rationale:**
- ✅ **Complete Context**: All necessary patterns, code examples, and gotchas documented
- ✅ **Existing Infrastructure**: 70% of sync code already implemented (repository, queue, online detection)
- ✅ **Clear Implementation Path**: 28 sequential tasks with dependencies and validation
- ✅ **Comprehensive Validation**: 4-level validation loop with specific test scenarios
- ✅ **Research-Backed**: 4,000+ lines of research documentation (Supabase patterns, conflict UX, offline sync)
- ⚠️ **One Unknown**: RxDB vs custom implementation (PRD recommends custom, research suggests RxDB)

**Reason for 9/10 (not 10/10)**: Minor uncertainty around RxDB adoption (adds ~100KB to bundle, but simplifies sync logic). Custom implementation is fully specified in this PRP, so one-pass success is still highly likely.

---

**Document Status:** ✅ Ready for Implementation
**Last Updated:** 2025-01-14
**Phase:** 5.0 (Core Sync MVP)
**Estimated Implementation Time:** 1 week (40 hours)