# PRP: Phase 5 - Data Model & Supabase Schema Implementation

---
type: BASE
phase: 5
feature: Data Model & Supabase Schema
status: ready
created: 2025-01-14
estimated_hours: 50
complexity: high
priority: critical
dependencies:
  - Phase 4.5 UX Polish (complete)
  - Supabase project setup (external)
  - Authentication flow (parallel track)
related_prps:
  - phase5-authentication-flow-prd.md
  - phase5-sync-conflict-resolution-prd.md
confidence_score: 9/10
---

## Feature Goal

Migrate HSA Songbook from offline-only IndexedDB storage to **hybrid offline-first architecture** with Supabase PostgreSQL cloud sync, enabling multi-device data access while preserving offline functionality.

**Core Requirement:** Zero data loss during migration, backward compatible with existing Phase 4 data, maintains offline-first user experience.

## Deliverable

1. **Supabase PostgreSQL Schema**:
   - Songs, Arrangements, Setlists tables with Row Level Security (RLS)
   - User ownership fields (userId, isPublic) for auth integration
   - Sync tracking fields (version, syncedAt, syncStatus) for conflict resolution
   - Optimized indexes for performance (by-user-id, by-public, by-sync-status)

2. **IndexedDB Schema Migration (v7)**:
   - Add userId, isPublic, syncedAt fields to existing entities
   - Create indexes for userId and isPublic filtering
   - Idempotent migration with data backfill (userId = 'local', isPublic = false)

3. **TypeScript Type Updates**:
   - Update Song, Arrangement, Setlist interfaces with new fields
   - Generate Supabase types from schema (src/types/supabase.ts)
   - Update BaseEntity with required userId and version fields

4. **Repository Layer Enhancements**:
   - Add getByUserId(), getPublic() methods to repositories
   - Update save() to auto-populate userId from auth context
   - Prepare sync queue integration (queueForSync already exists)

## Success Definition

✅ **Schema Parity**: IndexedDB and Supabase schemas match field-for-field
✅ **Migration Success**: Existing Phase 4 data migrated with zero data loss
✅ **Type Safety**: All TypeScript strict mode checks pass (0 errors)
✅ **Performance**: Query performance < 100ms for indexed lookups
✅ **Backward Compatibility**: Phase 4 offline features work unchanged
✅ **Validation**: All build gates pass (typecheck, lint, build)

---

## Context

```yaml
# Repository Pattern (Generic TypeScript)
existing_patterns:
  file: src/features/pwa/db/repository.ts
  pattern: BaseRepository<T extends BaseEntity>
  methods:
    - getById(id: string): Promise<T | undefined>
    - getAll(): Promise<T[]>
    - save(entity: Partial<T>): Promise<T>
    - delete(id: string): Promise<void>
    - queueForSync(operation, entityId, data): Promise<void>
  auto_managed_fields:
    - id: Auto-generated nanoid if missing
    - createdAt: Set on first save
    - updatedAt: Set on every save
    - version: Incremented on every save
    - syncStatus: Set to 'pending' on save
  gotchas:
    - Returns undefined (not null) for missing entities
    - Strict TypeScript mode enforced (no 'any' types)
    - Must use optional chaining (entity?.field)

# Current Type System (Strict Mode Enabled)
type_definitions:
  base_entity: src/types/Database.types.ts
  song: src/types/Song.types.ts
  arrangement: src/types/Arrangement.types.ts
  setlist: src/types/Setlist.types.ts
  current_fields:
    - id: string
    - createdAt?: string
    - updatedAt: string (required)
    - syncStatus?: 'pending' | 'synced' | 'conflict'
    - version?: number
    - lastAccessedAt?: number (for LRU cleanup)
  fields_to_add_phase5:
    - userId: string (owner/creator)
    - isPublic: boolean (public vs private)
    - syncedAt?: string (last Supabase sync timestamp)
    - deleted?: boolean (soft delete flag)
  strict_mode_constraints:
    - Zero 'any' types allowed (ESLint enforces)
    - strictNullChecks enabled
    - Use optional chaining: value?.property
    - Use nullish coalescing: value ?? defaultValue

# Migration System (Version-based)
migration_pattern:
  file: src/features/pwa/db/migrations.ts
  current_version: 6
  target_version: 7
  pattern: Sequential versioned migrations with idempotent checks
  example:
    - Check index exists: !store.indexNames.contains('index-name')
    - Check field exists: if (!entity.field) { entity.field = defaultValue }
    - Safe to run multiple times
  migration_naming: addUserIdAndPublicFields()
  handler_location: migrationHandlers[7]

# Supabase Schema Design
supabase_best_practices:
  docs:
    - url: https://supabase.com/docs/guides/database/tables#row-level-security
      anchor: "#row-level-security"
      topic: RLS policies
    - url: https://supabase.com/docs/guides/api/using-custom-schemas#typescript-types
      anchor: "#generating-types"
      topic: TypeScript type generation
    - url: https://supabase.com/docs/guides/database/postgres/indexes
      topic: Index strategies
  naming_convention: snake_case for PostgreSQL (user_id, is_public, created_at)
  field_mapping:
    userId: user_id UUID REFERENCES auth.users(id)
    isPublic: is_public BOOLEAN DEFAULT false
    createdAt: created_at TIMESTAMPTZ DEFAULT NOW()
    updatedAt: updated_at TIMESTAMPTZ DEFAULT NOW()
    syncedAt: last_synced_at TIMESTAMPTZ
    version: version INTEGER DEFAULT 1
    deleted: deleted BOOLEAN DEFAULT FALSE
  indexes_required:
    - by_user_id: CREATE INDEX idx_songs_user_id ON songs(user_id)
    - by_public: CREATE INDEX idx_songs_public ON songs(is_public) WHERE is_public = true
    - by_updated: CREATE INDEX idx_songs_updated ON songs(updated_at DESC)
    - by_version: CREATE INDEX idx_songs_version ON songs(id, version)
  rls_policies:
    owner_policy: "auth.uid() = user_id"
    public_read: "is_public = true"
    authenticated_create: "auth.uid() IS NOT NULL"

# TypeScript Type Generation
type_generation:
  command: npx supabase gen types typescript --local > src/types/supabase.ts
  workflow:
    - Deploy schema to Supabase: npx supabase db push
    - Generate types: npx supabase gen types typescript --project-id <ref>
    - Save to src/types/supabase.ts
    - Import: import type { Database } from '@/types/supabase'
  auto_types_available:
    - Database: Full schema type
    - Tables: All table definitions
    - Row<'table_name'>: Row type for inserts
    - Enums: PostgreSQL enums
  usage_pattern: |
    import { createClient } from '@supabase/supabase-js'
    import type { Database } from '@/types/supabase'
    const supabase = createClient<Database>(url, key)

# Existing Hooks to Update
hooks_to_modify:
  - file: src/features/chordpro/hooks/useArrangementSave.ts
    action: Add userId to save operations
    pattern: Get userId from useAuth() hook
  - file: src/features/setlists/hooks/useSetlistData.ts
    action: Filter by userId for private setlists
    pattern: repo.getByUserId(userId)
  - file: src/features/search/hooks/useFeaturedArrangements.ts
    action: Include public arrangements from all users
    pattern: repo.getPublic(limit)

# Files to Create
new_files:
  supabase_client:
    path: src/lib/supabase.ts
    purpose: Typed Supabase client singleton
    pattern: |
      import { createClient } from '@supabase/supabase-js'
      import type { Database } from '@/types/supabase'
      export const supabase = createClient<Database>(url, key)

  generated_types:
    path: src/types/supabase.ts
    purpose: Auto-generated types from Supabase schema
    command: npx supabase gen types typescript --project-id <ref> > src/types/supabase.ts

  migration_sql:
    path: supabase/migrations/20250114_001_initial_schema.sql
    purpose: Create songs, arrangements, setlists tables with RLS
    includes: Tables, indexes, RLS policies, triggers

# Critical Constraints
constraints:
  - No breaking changes to existing Phase 4 data structure
  - Offline-first behavior must be preserved
  - All queries must use indexes (no full table scans)
  - RLS policies must be tested for performance (< 10ms overhead)
  - Migration must be idempotent (safe to run multiple times)
  - TypeScript strict mode must pass (0 errors)
  - Zero 'any' types allowed

# Performance Requirements
performance:
  indexed_queries: < 100ms
  migration_duration: < 5 seconds (for 1000 entities)
  rls_overhead: < 10ms per query
  type_generation: < 30 seconds

# Related Documentation
external_docs:
  supabase_rls:
    url: https://supabase.com/docs/guides/auth/row-level-security
    sections:
      - "#user-based-access"
      - "#policies"
  supabase_types:
    url: https://supabase.com/docs/guides/api/rest/generating-types
  postgres_indexes:
    url: https://www.postgresql.org/docs/current/indexes.html
    focus: B-tree, partial, composite indexes
  offline_first:
    url: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
    focus: Best practices for hybrid sync
```

---

## Implementation Tasks

**Phase 5.1: Type Definitions & Schema Design** (8 hours)

1. **Update BaseEntity Interface** (1 hour)
   - File: `src/types/Database.types.ts`
   - Add fields: `userId: string`, `isPublic: boolean`, `syncedAt?: string`, `deleted?: boolean`
   - Make `version` required (change from `version?:` to `version:`)
   - Update JSDoc comments to document Phase 5 fields
   - Pattern reference: Existing `BaseEntity` interface at line 15

2. **Update Song Interface** (1 hour)
   - File: `src/types/Song.types.ts`
   - Extend with: `userId: string`, `isPublic: boolean`, `syncedAt?: string`
   - Add JSDoc: `@property userId - Owner/creator of this song`
   - Ensure `createdAt` and `updatedAt` are required (not optional)

3. **Update Arrangement Interface** (1 hour)
   - File: `src/types/Arrangement.types.ts`
   - Extend with: `userId: string`, `isPublic: boolean`, `syncedAt?: string`
   - Promote `version?:` to `version:` (required for optimistic locking)
   - Keep existing `syncStatus` enum

4. **Update Setlist Interface** (1 hour)
   - File: `src/types/Database.types.ts` (Setlist interface location)
   - Extend with: `userId: string`, `isPublic: boolean`, `syncedAt?: string`
   - Make `version` required

5. **Update HSASongbookDB Schema** (2 hours)
   - File: `src/types/Database.types.ts`
   - Add indexes to songs store: `'by-user-id': string`, `'by-public': boolean`
   - Add indexes to arrangements store: `'by-user-id': string`, `'by-public': boolean`
   - Add indexes to setlists store: `'by-user-id': string`
   - Pattern: Existing index definitions at lines 50-75

6. **Create Supabase Type Stub** (1 hour)
   - File: `src/types/supabase.ts` (NEW)
   - Create placeholder type: `export interface Database { /* Generated by Supabase CLI */ }`
   - Add comment: "// Run: npx supabase gen types typescript --project-id <ref> > src/types/supabase.ts"
   - Will be replaced by generated types after Supabase schema is deployed

7. **Validate TypeScript Compilation** (1 hour)
   - Run: `npm run typecheck`
   - Expect: Errors due to missing fields (normal - fixed in Phase 5.2)
   - Document expected errors for next phase

**Phase 5.2: IndexedDB Migration (v7)** (10 hours)

8. **Create Migration Handler** (3 hours)
   - File: `src/features/pwa/db/migrations.ts`
   - Add to `MIGRATIONS` record: `7: 'Add userId, isPublic, syncedAt fields for Phase 5 cloud sync'`
   - Create function: `addUserIdAndPublicFields(db, transaction)`
   - Pattern reference: Existing `addSlugIndexes()` function at line 120
   - Idempotency checks:
     ```typescript
     if (!songsStore.indexNames.contains('by-user-id')) {
       songsStore.createIndex('by-user-id', 'userId', { unique: false });
     }
     if (!songsStore.indexNames.contains('by-public')) {
       songsStore.createIndex('by-public', 'isPublic', { unique: false });
     }
     ```

9. **Add Indexes to Songs Store** (1 hour)
   - Store: `songs`
   - Indexes:
     - `by-user-id` on `userId` field (non-unique)
     - `by-public` on `isPublic` field (non-unique)
   - Log: `logger.log('Created by-user-id and by-public indexes on songs store')`

10. **Add Indexes to Arrangements Store** (1 hour)
    - Store: `arrangements`
    - Indexes:
      - `by-user-id` on `userId` field (non-unique)
      - `by-public` on `isPublic` field (non-unique)

11. **Add Indexes to Setlists Store** (1 hour)
    - Store: `setlists`
    - Indexes:
      - `by-user-id` on `userId` field (non-unique)
    - Note: Setlists are always private (no `by-public` index needed)

12. **Create Data Backfill Script** (2 hours)
    - File: `src/features/pwa/db/migrations.ts` (add function)
    - Function: `backfillPhase5Fields(db)`
    - Logic:
      ```typescript
      const stores = ['songs', 'arrangements', 'setlists'];
      for (const storeName of stores) {
        const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
        const cursor = await store.openCursor();
        while (cursor) {
          const entity = cursor.value;
          if (!entity.userId) {
            entity.userId = 'local'; // Default for existing data
            entity.isPublic = false;
            entity.version = entity.version || 1;
            await cursor.update(entity);
          }
          cursor = await cursor.continue();
        }
      }
      ```
    - Pattern reference: Existing cursor iteration in `slugMigration.ts`

13. **Update getCurrentVersion()** (1 hour)
    - File: `src/features/pwa/db/migrations.ts`
    - Change: `const CURRENT_VERSION = 7;`
    - Update: `validateSchema()` to check for new indexes
    - Test: Force migration by clearing IndexedDB in DevTools

14. **Run Migration Locally** (1 hour)
    - Clear IndexedDB: Chrome DevTools > Application > IndexedDB > hsasongbook > Delete
    - Reload app: Should trigger migration v1-7
    - Verify: Check that new indexes exist in DevTools
    - Verify: All entities have `userId: 'local'`, `isPublic: false`

**Phase 5.3: Repository Layer Updates** (12 hours)

15. **Update BaseRepository.save()** (3 hours)
    - File: `src/features/pwa/db/repository.ts`
    - Add userId auto-population:
      ```typescript
      async save(entity: Partial<T>): Promise<T> {
        // Get userId from auth context (Phase 5 - requires auth integration)
        const userId = entity.userId || 'local'; // Fallback to 'local' for now

        const updatedEntity: T = {
          ...entity,
          userId,
          isPublic: entity.isPublic ?? false, // Default to private
          version: (entity.version || 0) + 1,
          updatedAt: new Date().toISOString(),
        } as T;

        // ... existing save logic ...
      }
      ```
    - Pattern reference: Existing `save()` method at line 75

16. **Add getByUserId() Method** (2 hours)
    - File: `src/features/pwa/db/repository.ts`
    - Add to `BaseRepository` class:
      ```typescript
      async getByUserId(userId: string): Promise<T[]> {
        const db = await this.getDB();
        const index = db.transaction(this.storeName).store.index('by-user-id');
        return await index.getAll(userId);
      }
      ```

17. **Add getPublic() Method** (2 hours)
    - File: `src/features/pwa/db/repository.ts`
    - Add to `BaseRepository` class:
      ```typescript
      async getPublic(limit = 50): Promise<T[]> {
        const db = await this.getDB();
        const index = db.transaction(this.storeName).store.index('by-public');

        const publicItems = await index.getAll(true);

        // Sort by popularity or rating (store-specific logic)
        return publicItems
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, limit);
      }
      ```

18. **Update SongRepository** (2 hours)
    - File: `src/features/pwa/db/repository.ts` (SongRepository class)
    - Add methods:
      - `async getMyRecent(userId: string, limit = 10): Promise<Song[]>` - Recent songs for user
      - `async getPublicSongs(limit = 50): Promise<Song[]>` - Public songs from all users
    - Implementation:
      ```typescript
      async getMyRecent(userId: string, limit = 10): Promise<Song[]> {
        const userSongs = await this.getByUserId(userId);
        return userSongs
          .sort((a, b) => (b.lastAccessedAt || 0) - (a.lastAccessedAt || 0))
          .slice(0, limit);
      }
      ```

19. **Update ArrangementRepository** (2 hours)
    - File: `src/features/pwa/db/repository.ts` (ArrangementRepository class)
    - Add methods:
      - `async getMyArrangements(userId: string): Promise<Arrangement[]>`
      - `async getPublicArrangements(limit = 50): Promise<Arrangement[]>`

20. **Update SetlistRepository** (1 hour)
    - File: `src/features/pwa/db/repository.ts` (SetlistRepository class)
    - Add methods:
      - `async getMySetlists(userId: string): Promise<Setlist[]>`
    - Note: No getPublic() for setlists (always private in Phase 5.0)

**Phase 5.4: Supabase Schema Creation** (12 hours)

21. **Create Initial Schema Migration** (4 hours)
    - File: `supabase/migrations/20250114_001_initial_schema.sql` (NEW)
    - Create songs table:
      ```sql
      CREATE TABLE songs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        artist TEXT,
        themes TEXT[],
        copyright TEXT,

        -- Sync fields
        version INTEGER DEFAULT 1 NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        last_synced_at TIMESTAMPTZ,
        is_public BOOLEAN DEFAULT false,
        deleted BOOLEAN DEFAULT false
      );
      ```
    - Pattern reference: Existing phase5-data-model-supabase-schema-prd.md SQL examples

22. **Create Arrangements Table** (2 hours)
    - File: Same as above
    - Schema:
      ```sql
      CREATE TABLE arrangements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        song_id UUID REFERENCES songs(id),
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        chord_pro_content TEXT NOT NULL,
        key TEXT NOT NULL,
        tempo INTEGER,
        capo INTEGER,
        time_signature TEXT,
        rating REAL DEFAULT 0,
        favorites INTEGER DEFAULT 0,

        -- Sync fields
        version INTEGER DEFAULT 1 NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        last_synced_at TIMESTAMPTZ,
        is_public BOOLEAN DEFAULT false,
        deleted BOOLEAN DEFAULT false
      );
      ```

23. **Create Setlists Table** (2 hours)
    - File: Same as above
    - Schema:
      ```sql
      CREATE TABLE setlists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        performance_date TIMESTAMPTZ,
        songs JSONB NOT NULL DEFAULT '[]', -- Array of {arrangementId, customKey, order}

        -- Sync fields
        version INTEGER DEFAULT 1 NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        last_synced_at TIMESTAMPTZ,
        is_public BOOLEAN DEFAULT false, -- Private by default
        deleted BOOLEAN DEFAULT false
      );
      ```

24. **Create Indexes** (2 hours)
    - File: Same as above
    - Indexes:
      ```sql
      -- Songs indexes
      CREATE INDEX idx_songs_user_id ON songs(user_id);
      CREATE INDEX idx_songs_public ON songs(is_public) WHERE is_public = true;
      CREATE INDEX idx_songs_slug ON songs(slug);
      CREATE INDEX idx_songs_updated ON songs(updated_at DESC);
      CREATE INDEX idx_songs_version ON songs(id, version);

      -- Arrangements indexes
      CREATE INDEX idx_arrangements_user_id ON arrangements(user_id);
      CREATE INDEX idx_arrangements_song_id ON arrangements(song_id);
      CREATE INDEX idx_arrangements_public ON arrangements(is_public) WHERE is_public = true;
      CREATE INDEX idx_arrangements_slug ON arrangements(slug);
      CREATE INDEX idx_arrangements_updated ON arrangements(updated_at DESC);
      CREATE INDEX idx_arrangements_version ON arrangements(id, version);

      -- Setlists indexes
      CREATE INDEX idx_setlists_user_id ON setlists(user_id);
      CREATE INDEX idx_setlists_perf_date ON setlists(performance_date);
      CREATE INDEX idx_setlists_updated ON setlists(updated_at DESC);
      ```

25. **Create RLS Policies** (2 hours)
    - File: `supabase/migrations/20250114_002_rls_policies.sql` (NEW)
    - Enable RLS:
      ```sql
      ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE arrangements ENABLE ROW LEVEL SECURITY;
      ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
      ```
    - Songs policies:
      ```sql
      -- Users can view their own songs
      CREATE POLICY "Users can view own songs"
        ON songs FOR SELECT
        USING (auth.uid() = user_id);

      -- Users can view public songs
      CREATE POLICY "Users can view public songs"
        ON songs FOR SELECT
        USING (is_public = true);

      -- Users can insert their own songs
      CREATE POLICY "Users can insert own songs"
        ON songs FOR INSERT
        WITH CHECK (auth.uid() = user_id);

      -- Users can update their own songs
      CREATE POLICY "Users can update own songs"
        ON songs FOR UPDATE
        USING (auth.uid() = user_id);

      -- Users can delete their own songs
      CREATE POLICY "Users can delete own songs"
        ON songs FOR DELETE
        USING (auth.uid() = user_id);
      ```
    - Repeat pattern for arrangements and setlists tables

**Phase 5.5: TypeScript Type Generation** (4 hours)

26. **Deploy Schema to Supabase** (1 hour)
    - Command: `npx supabase db push`
    - Verify: Check Supabase dashboard > Database > Tables
    - Ensure: All tables, indexes, and RLS policies deployed

27. **Generate TypeScript Types** (1 hour)
    - Command: `npx supabase gen types typescript --project-id <your-ref> > src/types/supabase.ts`
    - Verify: File created at `src/types/supabase.ts`
    - Check: `Database` interface exported

28. **Create Supabase Client** (1 hour)
    - File: `src/lib/supabase.ts` (NEW)
    - Content:
      ```typescript
      import { createClient } from '@supabase/supabase-js';
      import type { Database } from '@/types/supabase';
      import logger from './logger';

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

      if (!supabaseUrl || !supabaseAnonKey) {
        logger.error('Missing Supabase environment variables');
      }

      export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
      ```

29. **Add Environment Variables** (1 hour)
    - File: `.env.example` (NEW)
    - Content:
      ```bash
      # Supabase Configuration (Phase 5)
      VITE_SUPABASE_URL=https://your-project.supabase.co
      VITE_SUPABASE_ANON_KEY=your-anon-key-here
      ```
    - Create: `.env.local` with actual values (not committed)
    - Update: `.gitignore` to include `.env.local`

**Phase 5.6: Testing & Validation** (4 hours)

30. **Test IndexedDB Migration** (1 hour)
    - Clear IndexedDB in Chrome DevTools
    - Reload app, verify migration runs
    - Check: All entities have `userId: 'local'`, `isPublic: false`
    - Check: New indexes exist in IndexedDB

31. **Test Repository Methods** (1 hour)
    - Console test: `const repo = new SongRepository(); await repo.getByUserId('local');`
    - Console test: `await repo.getPublic(10);`
    - Verify: Results filtered correctly
    - Check: No TypeScript errors

32. **Validate Supabase Schema** (1 hour)
    - Supabase Dashboard > Database > Tables
    - Check: All tables created (songs, arrangements, setlists)
    - Check: Indexes exist (by-user-id, by-public, etc.)
    - Check: RLS policies enabled

33. **Test TypeScript Compilation** (1 hour)
    - Run: `npm run typecheck`
    - Expect: 0 errors
    - Run: `npm run lint`
    - Expect: 0 warnings
    - Run: `npm run build`
    - Expect: Successful build

---

## Validation Gates

**Pre-Implementation Checklist:**
- [ ] Phase 4.5 complete (UX Polish finished)
- [ ] Supabase project created (external dependency)
- [ ] Supabase CLI installed: `npx supabase --version`
- [ ] Environment variables configured in `.env.local`
- [ ] Backup of current IndexedDB data taken (DevTools export)

**Phase 5.1 Gate: Type Definitions** (Pass Criteria: TypeScript compiles)
```bash
npm run typecheck
# Expected: Errors related to missing userId/isPublic (normal)
# Must: No syntax errors, no 'any' type violations
```

**Phase 5.2 Gate: IndexedDB Migration** (Pass Criteria: Migration runs successfully)
```bash
# Clear IndexedDB in Chrome DevTools
# Reload app
# Check: Migration v7 runs, new indexes created
# Check: All entities have userId='local', isPublic=false
```

**Phase 5.3 Gate: Repository Methods** (Pass Criteria: Methods work correctly)
```javascript
// Test in browser console
const songRepo = new SongRepository();
const userSongs = await songRepo.getByUserId('local'); // Should return all songs
const publicSongs = await songRepo.getPublic(10); // Should return empty array (isPublic=false)
console.log('User songs:', userSongs.length);
console.log('Public songs:', publicSongs.length);
```

**Phase 5.4 Gate: Supabase Schema** (Pass Criteria: Schema deployed correctly)
```bash
npx supabase db push
# Expected: Migration success message
# Verify: Supabase dashboard shows tables, indexes, RLS policies
```

**Phase 5.5 Gate: Type Generation** (Pass Criteria: Types generated and importable)
```bash
npx supabase gen types typescript --project-id <ref> > src/types/supabase.ts
npm run typecheck
# Expected: 0 errors
# Expected: Database interface exported from src/types/supabase.ts
```

**Phase 5.6 Gate: End-to-End Validation** (Pass Criteria: All systems working)
```bash
npm run lint        # 0 errors
npm run typecheck   # 0 errors
npm run build       # Success
npm run preview     # App loads, no console errors
```

---

## Final Validation Checklist

**Schema Parity:**
- [ ] IndexedDB songs store has userId, isPublic, syncedAt fields
- [ ] IndexedDB arrangements store has userId, isPublic, syncedAt fields
- [ ] IndexedDB setlists store has userId, isPublic, syncedAt fields
- [ ] Supabase songs table has user_id, is_public, last_synced_at columns
- [ ] Supabase arrangements table has user_id, is_public, last_synced_at columns
- [ ] Supabase setlists table has user_id, is_public, last_synced_at columns

**Indexes:**
- [ ] IndexedDB has by-user-id, by-public indexes on songs, arrangements, setlists
- [ ] Supabase has idx_songs_user_id, idx_songs_public, etc. indexes
- [ ] Partial index on is_public = true exists (performance optimization)

**Migration:**
- [ ] Migration v7 runs successfully on fresh install
- [ ] Migration v6→v7 runs successfully on existing data
- [ ] All existing entities backfilled with userId='local', isPublic=false
- [ ] Zero data loss verified (song/arrangement/setlist counts match)

**Type Safety:**
- [ ] `npm run typecheck` passes (0 errors)
- [ ] No 'any' types used (ESLint check)
- [ ] strictNullChecks passing (optional chaining used)
- [ ] Supabase types imported and used in client

**Repository Methods:**
- [ ] getByUserId() returns correct entities
- [ ] getPublic() filters by isPublic=true
- [ ] save() auto-populates userId and isPublic
- [ ] Existing methods still work (backward compatibility)

**RLS Policies:**
- [ ] Songs table: Users can read own + public songs
- [ ] Arrangements table: Users can read own + public arrangements
- [ ] Setlists table: Users can only read own setlists
- [ ] INSERT/UPDATE/DELETE restricted to owner (auth.uid() = user_id)
- [ ] RLS enabled on all tables (verified in Supabase dashboard)

**Performance:**
- [ ] Indexed queries < 100ms (test with 1000+ entities)
- [ ] RLS overhead < 10ms per query
- [ ] Migration duration < 5 seconds (for 1000 entities)

**Offline-First:**
- [ ] App works fully offline (no Supabase required)
- [ ] IndexedDB queries unchanged from Phase 4
- [ ] No breaking changes to existing hooks/components

**Build Validation:**
- [ ] `npm run lint` passes (0 errors, 0 warnings)
- [ ] `npm run typecheck` passes (0 errors)
- [ ] `npm run build` succeeds (< 5 minutes)
- [ ] `npm run preview` shows working app with Phase 5 data

**Documentation:**
- [ ] CLAUDE.md updated with Phase 5 status
- [ ] Migration v7 documented in migrations.ts
- [ ] Supabase environment variables documented in .env.example
- [ ] RLS policies documented in SQL migration files

---

## Confidence Score: 9/10

**Strengths:**
- ✅ Comprehensive research completed (database patterns, Supabase best practices, file analysis)
- ✅ Clear implementation path with specific file references
- ✅ Existing repository pattern is Phase 5-ready (syncStatus, version, queueForSync)
- ✅ TypeScript strict mode already enforced (no regressions expected)
- ✅ Idempotent migration patterns proven in Phase 4

**Risks:**
- ⚠️ Supabase environment setup is external dependency (may have delays)
- ⚠️ RLS policy testing requires authenticated users (Phase 5 auth track)
- ⚠️ Type generation assumes schema deployed first (dependency ordering)

**Mitigation:**
- All tasks are independent within phases (can parallelize)
- Detailed validation gates at each phase (catch issues early)
- Fallback to 'local' userId allows testing without auth

---

## Notes for Implementing Agent

**Critical Success Factors:**
1. **Idempotency**: Always check before creating (indexes, fields, migrations)
2. **Type Safety**: Zero 'any' types, use optional chaining everywhere
3. **Backward Compatibility**: Phase 4 offline features must work unchanged
4. **Performance**: Always use indexes, no full table scans
5. **Testing**: Validate at each phase, don't wait until end

**When Stuck:**
- Reference: Existing repository pattern in `src/features/pwa/db/repository.ts`
- Reference: Migration pattern in `src/features/pwa/db/migrations.ts`
- Reference: Type definitions in `src/types/`
- Search: PRPs/ai_docs/ for similar implementation patterns

**Phase Dependencies:**
- Phase 5.1 (Types) → Phase 5.2 (Migration) → Phase 5.3 (Repositories)
- Phase 5.4 (Supabase Schema) → Phase 5.5 (Type Generation)
- Phase 5.6 (Testing) requires all previous phases complete

**External Dependencies:**
- Supabase project must be created first (external)
- Authentication flow is parallel track (userId defaults to 'local' for now)

**Success Metrics:**
- If all validation gates pass → Feature is complete
- If migration runs with 0 data loss → Success
- If TypeScript compiles with 0 errors → Success

---

**Document Version:** 1.0
**Last Updated:** 2025-01-14
**Confidence Score:** 9/10 (High confidence for one-pass implementation)