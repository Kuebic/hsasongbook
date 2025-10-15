# Supabase Implementation Best Practices - Phase 5 Research Report

**Research Date**: January 14, 2025
**Project**: HSA Songbook - Phase 5 Cloud Integration
**Purpose**: Comprehensive guide for implementing Supabase with TypeScript, RLS, migrations, and offline-first sync

---

## Table of Contents

1. [Schema Design Best Practices](#section-1-schema-design-best-practices)
2. [TypeScript Integration](#section-2-typescript-integration)
3. [RLS Policy Patterns](#section-3-rls-policy-patterns)
4. [Migration Best Practices](#section-4-migration-best-practices)
5. [Offline-First Architecture](#section-5-offline-first-architecture)
6. [Performance Optimization](#section-6-performance-optimization)
7. [Authentication & Custom Claims](#section-7-authentication--custom-claims)
8. [React Query Integration](#section-8-react-query-integration)
9. [Critical URLs Reference](#section-9-critical-urls-reference)

---

## Section 1: Schema Design Best Practices

### 1.1 Naming Conventions

**Official Recommendation**: Use `snake_case` for all database identifiers

```sql
-- ✅ CORRECT - snake_case
create table song_arrangements (
  id uuid primary key default gen_random_uuid(),
  song_id uuid references songs(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ❌ AVOID - camelCase requires double quotes everywhere
create table "songArrangements" (
  "id" uuid,
  "songId" uuid,
  "createdAt" timestamptz
);
```

**Why snake_case?**
- PostgreSQL folds identifiers to lowercase unless double-quoted
- camelCase requires double quotes in every SQL query
- snake_case works seamlessly in SQL and RLS policies
- Less typing, fewer errors

**Source**: [Supabase Troubleshooting - camelCase Issues](https://supabase.com/docs/guides/troubleshooting/why-is-my-camelcase-name-not-working-in-postgres-functions-or-rls-policies-EJMzVd)

### 1.2 Table Creation Standards

```sql
-- Best practice: Define all columns at creation
create table songs (
  -- Primary key (use uuid or bigint identity)
  id uuid primary key default gen_random_uuid(),

  -- Core fields
  title text not null,
  artist text,
  slug text unique not null,

  -- Timestamps (essential for sync)
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- Soft delete support
  deleted boolean default false not null,

  -- User ownership
  user_id uuid references auth.users(id) on delete cascade
);

-- Add indexes immediately
create index songs_user_id_idx on songs(user_id);
create index songs_slug_idx on songs(slug);
create index songs_updated_at_idx on songs(updated_at); -- For sync queries
```

**Key Principles**:
1. **Always add primary key** - Prefer `uuid` for distributed systems or `bigint generated always as identity` for sequential IDs
2. **Use `not null` constraints** - TypeScript types will reflect this (no `| null`)
3. **Add timestamps** - Essential for sync and audit trails (`created_at`, `updated_at`)
4. **Soft deletes** - Use `deleted boolean` instead of `DELETE` for sync compatibility
5. **Foreign keys with cascade** - Define relationships explicitly

**Sources**:
- [Tables and Data | Supabase Docs](https://supabase.com/docs/guides/database/tables)
- [Database Overview](https://supabase.com/docs/guides/database/overview)

### 1.3 Schema Organization

```sql
-- Public schema (default, exposed to API)
create table public.songs (...);

-- Private schema (not exposed to API)
create schema if not exists private;
create table private.user_secrets (
  user_id uuid primary key references auth.users(id),
  api_keys jsonb
);
```

**Best Practices**:
- Use `public` schema for user-accessible data
- Create `private` schema for sensitive internal data
- RLS must be enabled on **all** tables in exposed schemas
- Custom schemas require explicit configuration

**Source**: [Using Custom Schemas](https://supabase.com/docs/guides/api/using-custom-schemas)

### 1.4 Index Strategies

```sql
-- B-tree indexes (default, best for most cases)
create index songs_title_idx on songs using btree(title);

-- GIN indexes for JSONB and full-text search
create index arrangements_metadata_idx on arrangements using gin(metadata jsonb_path_ops);

-- Composite indexes for common queries
create index setlists_user_date_idx on setlists(user_id, performance_date desc);

-- Partial indexes for filtered queries
create index active_songs_idx on songs(user_id) where deleted = false;
```

**Index Types**:
- **B-tree** (default): Best for equality, range queries, sorting
- **GIN**: JSONB, arrays, full-text search (slower writes, faster reads)
- **GiST**: Spatial data, full-text search (faster writes, slower reads)
- **Hash**: Equality only (rarely used)

**Performance Tips**:
- Index foreign keys (improves JOIN performance)
- Index columns used in WHERE, ORDER BY, GROUP BY
- Use partial indexes to reduce index size
- Monitor index usage with `pg_stat_user_indexes`

**Sources**:
- [Managing Indexes in PostgreSQL](https://supabase.com/docs/guides/database/postgres/indexes)
- [Steps to improve query performance with indexes](https://supabase.com/docs/guides/troubleshooting/steps-to-improve-query-performance-with-indexes-q8PoC9)

---

## Section 2: TypeScript Integration

### 2.1 Type Generation Workflow

```bash
# Install Supabase CLI (local dev dependency)
npm install supabase@">=1.8.1" --save-dev

# Login to Supabase
npx supabase login

# Initialize local project
npx supabase init

# Generate types from remote database
npx supabase gen types typescript --project-id "$PROJECT_REF" --schema public > src/types/database.types.ts

# Generate types from local database (during development)
npx supabase gen types typescript --local > src/types/database.types.ts
```

**Automated Type Sync** - GitHub Action (`.github/workflows/update-types.yml`):

```yaml
name: Update Supabase Types

on:
  schedule:
    - cron: '0 0 * * *' # Daily at midnight
  workflow_dispatch: # Manual trigger

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Generate types
        run: |
          npx supabase gen types typescript --project-id "${{ secrets.SUPABASE_PROJECT_REF }}" > src/types/database.types.ts

      - name: Commit changes
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add src/types/database.types.ts
          git diff --staged --quiet || git commit -m "chore: update Supabase types"
          git push
```

**Source**: [Generating TypeScript Types](https://supabase.com/docs/guides/api/rest/generating-types)

### 2.2 Using Generated Types

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

// Create typed Supabase client
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

// Type helpers for easier access
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Example usage
export type Song = Tables<'songs'>
export type SongInsert = Inserts<'songs'>
export type SongUpdate = Updates<'songs'>
```

### 2.3 Type-Safe Queries

```typescript
// Type inference automatically works
const { data: songs, error } = await supabase
  .from('songs')
  .select('id, title, artist')

// songs is typed as Array<{ id: string; title: string; artist: string | null }>

// Complex queries with joins
const { data: arrangements } = await supabase
  .from('arrangements')
  .select(`
    id,
    key,
    song:songs (
      id,
      title,
      artist
    )
  `)

// arrangements is fully typed with nested song data

// QueryData helper for complex query types
import { QueryData } from '@supabase/supabase-js'

const arrangementsQuery = supabase
  .from('arrangements')
  .select('*, song:songs(*)')

type ArrangementWithSong = QueryData<typeof arrangementsQuery>[number]
```

### 2.4 Type Overrides

```typescript
// Override specific column types (e.g., for JSON fields)
import { MergeDeep } from 'type-fest'

type DatabaseWithCustomTypes = MergeDeep<
  Database,
  {
    public: {
      Tables: {
        arrangements: {
          Row: {
            metadata: {
              tempo?: number
              time_signature?: string
            }
          }
        }
      }
    }
  }
>

// Use custom types
const supabase = createClient<DatabaseWithCustomTypes>(url, key)
```

**Key Features**:
- Detects `not null` constraints (no `| null` for non-nullable columns)
- Separate types for `Row`, `Insert`, `Update` operations
- Generated columns show type errors on insert
- Supports multi-schema type generation

**Sources**:
- [JavaScript: TypeScript support](https://supabase.com/docs/reference/javascript/typescript-support)
- [Generate types using GitHub Actions](https://supabase.com/docs/guides/deployment/ci/generating-types)

---

## Section 3: RLS Policy Patterns

### 3.1 Basic User-Owned Data Pattern

```sql
-- Enable RLS (ALWAYS required for public schema)
alter table songs enable row level security;

-- Policy: Users can only see their own songs
create policy "Users can view own songs"
on songs
for select
to authenticated
using (
  (select auth.uid()) = user_id
);

-- Policy: Users can insert their own songs
create policy "Users can create songs"
on songs
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);

-- Policy: Users can update their own songs
create policy "Users can update own songs"
on songs
for update
to authenticated
using (
  (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = user_id
);

-- Policy: Users can delete their own songs
create policy "Users can delete own songs"
on songs
for delete
to authenticated
using (
  (select auth.uid()) = user_id
);
```

**Critical Pattern**: Always wrap `auth.uid()` in `SELECT` for query plan caching!

**Source**: [Row Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)

### 3.2 Public Read, Authenticated Write

```sql
-- Public profiles visible to everyone
create policy "Profiles are publicly readable"
on profiles
for select
to anon, authenticated
using (true);

-- Only authenticated users can create profiles
create policy "Users can create profile"
on profiles
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);
```

### 3.3 Role-Based Access Control

```sql
-- Add role column to users
alter table profiles add column role text default 'user' check (role in ('user', 'moderator', 'admin'));

-- Helper function for role checking
create or replace function has_role(required_role text)
returns boolean as $$
begin
  return (
    select role from profiles
    where user_id = auth.uid()
  ) = required_role;
end;
$$ language plpgsql security definer;

-- Policy using role
create policy "Admins can view all songs"
on songs
for select
to authenticated
using (
  (select has_role('admin'))
);
```

### 3.4 Null Safety for Unauthenticated Users

```sql
-- ❌ BAD: Silently fails for anonymous users
create policy "User can view own data"
on songs
using (auth.uid() = user_id);

-- ✅ GOOD: Explicit null check
create policy "User can view own data"
on songs
using (
  auth.uid() is not null
  and auth.uid() = user_id
);
```

**Why?** `auth.uid()` returns `NULL` for anonymous users, causing policies to silently fail.

### 3.5 Performance-Optimized Policies

```sql
-- ❌ SLOW: Function not wrapped in SELECT
create policy "Slow policy"
on songs
using (is_admin() or auth.uid() = user_id);

-- ✅ FAST: Wrapped in SELECT for query plan caching
create policy "Fast policy"
on songs
using (
  (select is_admin())
  or (select auth.uid()) = user_id
);

-- ✅ EVEN FASTER: Use IN for subqueries
create policy "Team member access"
on documents
using (
  team_id in (
    select team_id
    from team_members
    where user_id = (select auth.uid())
  )
);
```

**Performance Tips**:
1. **Wrap functions in SELECT** - Enables query plan caching
2. **Add indexes on policy columns** - Index `user_id`, `team_id`, etc.
3. **Use explicit role filters** - Always specify `to authenticated`
4. **Add filters in queries** - Don't rely solely on RLS: `.eq('user_id', userId)`
5. **Minimize joins** - Use `IN` or `ANY` instead of row-by-row comparisons

**Sources**:
- [RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Custom Claims & RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)

---

## Section 4: Migration Best Practices

### 4.1 Migration File Naming Convention

**Format**: `YYYYMMDDHHmmss_description.sql`

- `YYYY` - Four-digit year (2025)
- `MM` - Two-digit month (01-12)
- `DD` - Two-digit day (01-31)
- `HH` - Two-digit hour in 24h format (00-23)
- `mm` - Two-digit minute (00-59)
- `ss` - Two-digit second (00-59)
- Timestamp is in **UTC**

**Examples**:
```
supabase/migrations/20250114123045_create_songs_table.sql
supabase/migrations/20250114140022_add_slug_to_songs.sql
supabase/migrations/20250115091530_enable_rls_on_songs.sql
```

### 4.2 Creating Migrations

```bash
# Create new migration file
npx supabase migration new create_songs_table

# Generate migration from dashboard changes
npx supabase db diff --use-migra create_songs_table

# Apply migrations locally
npx supabase db reset

# Deploy migrations to production
npx supabase db push
```

### 4.3 Idempotent Migration Pattern

```sql
-- 20250114123045_create_songs_table.sql

-- Idempotent: Check if table exists before creating
create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz default now() not null
);

-- Idempotent: Check if column exists before adding
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'songs' and column_name = 'slug'
  ) then
    alter table songs add column slug text unique;
  end if;
end $$;

-- Idempotent: Check if index exists
create index if not exists songs_slug_idx on songs(slug);

-- Enable RLS (idempotent)
alter table songs enable row level security;

-- Drop policy if exists, then recreate
drop policy if exists "Users can view own songs" on songs;
create policy "Users can view own songs"
on songs for select to authenticated
using ((select auth.uid()) = user_id);
```

### 4.4 Data Backfill Pattern

```sql
-- 20250114150000_add_slug_to_existing_songs.sql

-- Add column (nullable first)
alter table songs add column if not exists slug text;

-- Backfill existing data
update songs
set slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(id::text, 1, 6)
where slug is null;

-- Add constraints after backfill
alter table songs alter column slug set not null;
alter table songs add constraint songs_slug_unique unique (slug);
create index if not exists songs_slug_idx on songs(slug);
```

### 4.5 Rollback Strategy

**Important**: Never reset deployed production migrations!

```sql
-- ❌ NEVER DO THIS in production
drop table if exists songs;

-- ✅ CREATE A NEW FORWARD MIGRATION to undo changes
-- 20250114160000_revert_slug_column.sql

-- Remove constraints first
alter table songs drop constraint if exists songs_slug_unique;
drop index if exists songs_slug_idx;

-- Drop column
alter table songs drop column if exists slug;
```

**Best Practice**: Test rollback migrations locally before deploying!

### 4.6 Testing Workflow

```bash
# Local testing
npx supabase start
npx supabase db reset  # Applies all migrations from scratch
npx supabase db seed   # Loads seed data

# Verify in local Studio
npx supabase studio

# Test rollback (create reverse migration)
npx supabase migration new revert_feature_x
# ... write reverse SQL ...
npx supabase db reset

# Deploy to staging
npx supabase link --project-ref staging-project-id
npx supabase db push --dry-run  # Preview changes
npx supabase db push

# Deploy to production (after approval)
npx supabase link --project-ref prod-project-id
npx supabase db push
```

**Sources**:
- [Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Local development with schema migrations](https://supabase.com/docs/guides/local-development/overview)
- [Managing Environments](https://supabase.com/docs/guides/deployment/managing-environments)

---

## Section 5: Offline-First Architecture

### 5.1 Sync Requirements for Tables

```sql
-- All synced tables MUST have these fields
create table songs (
  id uuid primary key default gen_random_uuid(),

  -- ... other columns ...

  -- Required for sync
  updated_at timestamptz default now() not null,
  deleted boolean default false not null
);

-- Trigger to auto-update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger songs_updated_at
before update on songs
for each row
execute function update_updated_at_column();

-- Index for sync queries (critical!)
create index songs_updated_at_idx on songs(updated_at);
```

**Why These Fields?**
- `updated_at` - Enables "pull changes since last sync" queries
- `deleted` - Soft delete pattern allows clients to know about deleted records
- Index on `updated_at` - Essential for efficient sync queries

### 5.2 Offline-First Sync Pattern

**Architecture**:
1. **Local Storage** (IndexedDB) - Primary data source, always read from here
2. **Sync Queue** - Queue local changes for upload when online
3. **Realtime Subscriptions** - Listen for remote changes while online
4. **Conflict Resolution** - Handle concurrent edits

**Three-Step Sync Process**:

```typescript
// 1. PULL: Fetch changes from server since last sync
async function pullChanges(lastSyncTimestamp: string) {
  const { data: changes, error } = await supabase
    .from('songs')
    .select('*')
    .gt('updated_at', lastSyncTimestamp)
    .order('updated_at', { ascending: true })

  if (changes) {
    // Merge into IndexedDB with conflict resolution
    for (const change of changes) {
      await db.songs.upsert(change, { conflictResolution: 'remote-wins' })
    }
  }
}

// 2. PUSH: Upload local changes to server
async function pushChanges() {
  const pendingChanges = await db.syncQueue.toArray()

  for (const change of pendingChanges) {
    if (change.operation === 'insert') {
      await supabase.from('songs').insert(change.data)
    } else if (change.operation === 'update') {
      await supabase.from('songs').update(change.data).eq('id', change.data.id)
    } else if (change.operation === 'delete') {
      // Soft delete
      await supabase.from('songs').update({ deleted: true }).eq('id', change.id)
    }

    // Remove from queue on success
    await db.syncQueue.delete(change.id)
  }
}

// 3. REALTIME: Subscribe to live updates
function subscribeToChanges() {
  const channel = supabase
    .channel('songs-changes')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'songs'
      },
      async (payload) => {
        // Update local IndexedDB immediately
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          await db.songs.put(payload.new)
        } else if (payload.eventType === 'DELETE') {
          await db.songs.delete(payload.old.id)
        }

        // Notify UI to re-render
        notifyDataChanged()
      }
    )
    .subscribe()

  return channel
}
```

### 5.3 Conflict Resolution Strategies

**1. Last Write Wins (Simplest)**

```typescript
type ConflictResolution = 'local-wins' | 'remote-wins' | 'merge'

async function upsertWithConflict(
  tableName: string,
  remoteRecord: any,
  strategy: ConflictResolution = 'remote-wins'
) {
  const localRecord = await db[tableName].get(remoteRecord.id)

  if (!localRecord) {
    // No conflict, just insert
    await db[tableName].put(remoteRecord)
    return
  }

  // Compare timestamps
  const remoteUpdatedAt = new Date(remoteRecord.updated_at)
  const localUpdatedAt = new Date(localRecord.updated_at)

  if (strategy === 'remote-wins') {
    await db[tableName].put(remoteRecord)
  } else if (strategy === 'local-wins') {
    // Keep local, queue for upload
    await db.syncQueue.add({
      operation: 'update',
      tableName,
      data: localRecord
    })
  } else if (strategy === 'merge') {
    // Custom merge logic
    const merged = { ...remoteRecord, ...localRecord }
    await db[tableName].put(merged)
  }
}
```

**2. Version-Based Conflict Detection**

```sql
-- Add version column to tables
alter table songs add column version integer default 1 not null;

-- Increment version on every update
create or replace function increment_version()
returns trigger as $$
begin
  new.version = old.version + 1;
  return new;
end;
$$ language plpgsql;

create trigger songs_version
before update on songs
for each row
execute function increment_version();
```

```typescript
async function updateWithVersionCheck(id: string, updates: any, expectedVersion: number) {
  const { data, error } = await supabase
    .from('songs')
    .update({ ...updates, version: expectedVersion + 1 })
    .eq('id', id)
    .eq('version', expectedVersion) // Optimistic lock
    .select()

  if (error || data.length === 0) {
    // Version mismatch - conflict detected
    throw new ConflictError('Record was modified by another client')
  }

  return data[0]
}
```

### 5.4 Network Detection

```typescript
// src/features/pwa/hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Trigger sync when coming online
      syncWithServer()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

### 5.5 RxDB + Supabase Pattern (Alternative)

If you want a more robust solution, consider **RxDB** with the Supabase replication plugin:

```bash
npm install rxdb rxdb-premium/supabase
```

```typescript
import { createRxDatabase } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { replicateSupabase } from 'rxdb-premium/plugins/replication-supabase'

const db = await createRxDatabase({
  name: 'hsasongbook',
  storage: getRxStorageDexie()
})

await db.addCollections({
  songs: {
    schema: songSchema
  }
})

// Setup replication
const replicationState = replicateSupabase({
  collection: db.songs,
  supabaseClient: supabase,
  pull: {
    batchSize: 50,
    modifier: (doc) => doc // Transform if needed
  },
  push: {
    batchSize: 50,
    modifier: (doc) => doc
  },
  realtimePostgresChanges: true
})
```

**RxDB Benefits**:
- Automatic two-way sync
- Built-in conflict resolution
- Reactive queries (auto-update UI)
- Offline queue built-in

**Trade-offs**:
- Adds ~200 KB to bundle
- More complex setup
- Learning curve

**Sources**:
- [Building offline-first mobile apps with Supabase, Flutter and Brick](https://supabase.com/blog/offline-first-flutter-apps)
- [RxDB Supabase Replication Plugin](https://rxdb.info/replication-supabase.html)
- [GitHub: rxdb-supabase](https://github.com/marceljuenemann/rxdb-supabase)

---

## Section 6: Performance Optimization

### 6.1 Query Performance Checklist

```typescript
// ✅ GOOD: Explicit filters + RLS
const { data } = await supabase
  .from('songs')
  .select('*')
  .eq('user_id', userId) // Don't rely on RLS alone
  .eq('deleted', false)
  .order('created_at', { ascending: false })
  .limit(50) // Always paginate

// ❌ BAD: No filters, relying only on RLS
const { data } = await supabase
  .from('songs')
  .select('*') // Returns all user's songs, could be thousands
```

### 6.2 Index Strategies for Common Queries

```sql
-- Single column indexes
create index songs_user_id_idx on songs(user_id);
create index songs_created_at_idx on songs(created_at);

-- Composite index (order matters!)
create index setlists_user_date_idx on setlists(user_id, performance_date desc);
-- Good for: WHERE user_id = X ORDER BY performance_date DESC
-- Also good for: WHERE user_id = X

-- Partial index (smaller, faster)
create index active_songs_idx on songs(user_id, updated_at)
where deleted = false;

-- GIN index for JSONB
create index arrangements_metadata_idx on arrangements
using gin(metadata jsonb_path_ops);
-- Enables: WHERE metadata @> '{"tempo": 120}'
```

### 6.3 RLS Performance Patterns

```sql
-- ❌ SLOW: No index on user_id
create policy "User songs" on songs
using ((select auth.uid()) = user_id);

-- ✅ FAST: Add index
create index songs_user_id_idx on songs(user_id);

create policy "User songs" on songs
using ((select auth.uid()) = user_id);

-- ❌ SLOW: Complex join in policy
create policy "Team member access" on documents
using (
  exists (
    select 1 from team_members tm
    join teams t on t.id = tm.team_id
    where tm.user_id = auth.uid()
    and t.id = documents.team_id
  )
);

-- ✅ FAST: Use IN with subquery
create policy "Team member access" on documents
using (
  team_id in (
    select team_id from team_members
    where user_id = (select auth.uid())
  )
);
```

### 6.4 Debugging Query Performance

```typescript
// Use .explain() to see query plan
const { data, error } = await supabase
  .from('songs')
  .select('*')
  .eq('user_id', userId)
  .explain({ analyze: true, verbose: true })

console.log(data) // Shows EXPLAIN ANALYZE output
```

**In PostgreSQL directly**:

```sql
-- Check query execution time
explain analyze
select * from songs
where user_id = 'uuid-here'
and deleted = false;

-- Check index usage
select schemaname, tablename, indexname, idx_scan
from pg_stat_user_indexes
where tablename = 'songs'
order by idx_scan desc;

-- Find missing indexes (Supabase Index Advisor)
select * from index_advisor('select * from songs where user_id = $1');
```

**Sources**:
- [Query Optimization](https://supabase.com/docs/guides/database/query-optimization)
- [Index Advisor](https://supabase.com/docs/guides/database/extensions/index_advisor)

---

## Section 7: Authentication & Custom Claims

### 7.1 Accessing User ID in RLS Policies

```sql
-- Basic auth.uid() usage
create policy "User can view own songs"
on songs for select
using ((select auth.uid()) = user_id);

-- With null safety
create policy "User can view own songs"
on songs for select
using (
  auth.uid() is not null
  and (select auth.uid()) = user_id
);
```

**How auth.uid() works**:
```sql
-- Extracts user ID from JWT
select coalesce(
  current_setting('request.jwt.claim.sub', true),
  (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
)::uuid
```

### 7.2 Custom Claims & User Roles

**Add custom claims to JWT** using Auth Hooks:

```typescript
// Supabase Edge Function: supabase/functions/custom-access-token/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { user } = await req.json()

  // Fetch user role from database
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('user_id', user.id)
    .single()

  // Add custom claims to JWT
  return new Response(
    JSON.stringify({
      user_role: profile?.role || 'user',
      organization_id: profile?.organization_id
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

**Access custom claims in RLS policies**:

```sql
-- Helper function to extract custom claims
create or replace function get_user_role()
returns text as $$
  select coalesce(
    current_setting('request.jwt.claims', true)::jsonb ->> 'user_role',
    'user'
  );
$$ language sql stable;

-- Use in policy
create policy "Admins can view all songs"
on songs for select
using (
  (select get_user_role()) = 'admin'
  or (select auth.uid()) = user_id
);
```

**Access custom claims in TypeScript**:

```typescript
import { jwtDecode } from 'jwt-decode'

interface JWTClaims {
  sub: string
  user_role: string
  organization_id: string
}

async function getUserRole() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) return null

  const claims = jwtDecode<JWTClaims>(session.access_token)
  return claims.user_role
}
```

**Important**: Custom claims only update when user re-authenticates! Consider fetching from database for real-time role changes.

**Sources**:
- [Custom Access Token Hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook)
- [Custom Claims & RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)
- [JWT Claims Reference](https://supabase.com/docs/guides/auth/jwt-fields)

---

## Section 8: React Query Integration

### 8.1 Supabase Cache Helpers

**Install**:
```bash
npm install @supabase-cache-helpers/postgrest-react-query
npm install @tanstack/react-query
```

**Setup** (src/lib/react-query.ts):

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
})
```

**App wrapper** (src/app/App.tsx):

```typescript
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/react-query'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  )
}
```

### 8.2 Query Patterns

```typescript
// src/features/songs/hooks/useSongs.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useSongs(userId: string) {
  return useQuery({
    queryKey: ['songs', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', userId)
        .eq('deleted', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!userId // Only fetch if userId exists
  })
}

// Usage in component
function SongList() {
  const { data: songs, isLoading, error } = useSongs(userId)

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage error={error} />

  return <div>{songs.map(song => <SongCard key={song.id} song={song} />)}</div>
}
```

### 8.3 Mutation Patterns

```typescript
// src/features/songs/hooks/useCreateSong.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useCreateSong() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newSong: SongInsert) => {
      const { data, error } = await supabase
        .from('songs')
        .insert(newSong)
        .select()
        .single()

      if (error) throw error
      return data
    },

    // Optimistic update
    onMutate: async (newSong) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['songs', newSong.user_id] })

      // Snapshot previous value
      const previousSongs = queryClient.getQueryData(['songs', newSong.user_id])

      // Optimistically update cache
      queryClient.setQueryData(['songs', newSong.user_id], (old: any[]) => [
        { ...newSong, id: 'temp-id', created_at: new Date().toISOString() },
        ...old
      ])

      return { previousSongs }
    },

    // Rollback on error
    onError: (err, newSong, context) => {
      queryClient.setQueryData(
        ['songs', newSong.user_id],
        context?.previousSongs
      )
    },

    // Refetch on success
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['songs', data.user_id] })
    }
  })
}

// Usage
function CreateSongForm() {
  const createSong = useCreateSong()

  const handleSubmit = (formData) => {
    createSong.mutate({
      title: formData.title,
      artist: formData.artist,
      user_id: userId
    })
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

### 8.4 Realtime Subscriptions with React Query

```typescript
// src/features/songs/hooks/useSongsRealtime.ts
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useSongsRealtime(userId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('songs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'songs',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Invalidate queries to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['songs', userId] })

          // Or update cache directly for instant UI updates
          if (payload.eventType === 'INSERT') {
            queryClient.setQueryData(
              ['songs', userId],
              (old: any[]) => [payload.new, ...old]
            )
          } else if (payload.eventType === 'UPDATE') {
            queryClient.setQueryData(
              ['songs', userId],
              (old: any[]) => old.map(song =>
                song.id === payload.new.id ? payload.new : song
              )
            )
          } else if (payload.eventType === 'DELETE') {
            queryClient.setQueryData(
              ['songs', userId],
              (old: any[]) => old.filter(song => song.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}

// Usage: Call in component that uses useSongs
function SongList() {
  const { data: songs } = useSongs(userId)
  useSongsRealtime(userId) // Auto-updates cache on changes

  return <div>...</div>
}
```

### 8.5 Supabase Cache Helpers (Advanced)

```typescript
// Alternative using @supabase-cache-helpers
import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'

export function useSongs(userId: string) {
  return useQuery(
    supabase
      .from('songs')
      .select('*')
      .eq('user_id', userId)
      .eq('deleted', false)
  )
  // Cache key automatically generated from query
  // Mutations auto-update cache
}

// Mutations with automatic cache updates
import { useInsertMutation } from '@supabase-cache-helpers/postgrest-react-query'

export function useCreateSong() {
  return useInsertMutation(
    supabase.from('songs'),
    ['id'] // Primary key
  )
  // Automatically invalidates related queries!
}
```

**Sources**:
- [Using React Query with Next.js App Router and Supabase Cache Helpers](https://supabase.com/blog/react-query-nextjs-app-router-cache-helpers)
- [Supabase Cache Helpers - Getting Started](https://supabase-cache-helpers.vercel.app/postgrest/getting-started)
- [TanStack Query Documentation](https://tanstack.com/query/latest/docs/framework/react/overview)

---

## Section 9: Critical URLs Reference

### Official Supabase Documentation

#### Schema & Tables
- [Tables and Data](https://supabase.com/docs/guides/database/tables)
- [Database Overview](https://supabase.com/docs/guides/database/overview)
- [Using Custom Schemas](https://supabase.com/docs/guides/api/using-custom-schemas)
- [Declarative Schemas](https://supabase.com/docs/guides/local-development/declarative-database-schemas)

#### Row Level Security
- [Row Level Security Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Custom Claims & RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)

#### TypeScript Integration
- [Generating TypeScript Types](https://supabase.com/docs/guides/api/rest/generating-types)
- [JavaScript: TypeScript Support](https://supabase.com/docs/reference/javascript/typescript-support)
- [Generate types using GitHub Actions](https://supabase.com/docs/guides/deployment/ci/generating-types)

#### Migrations
- [Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Local Development Overview](https://supabase.com/docs/guides/local-development/overview)
- [Managing Environments](https://supabase.com/docs/guides/deployment/managing-environments)

#### Performance
- [Managing Indexes](https://supabase.com/docs/guides/database/postgres/indexes)
- [Query Optimization](https://supabase.com/docs/guides/database/query-optimization)
- [Index Advisor](https://supabase.com/docs/guides/database/extensions/index_advisor)
- [Steps to improve query performance with indexes](https://supabase.com/docs/guides/troubleshooting/steps-to-improve-query-performance-with-indexes-q8PoC9)

#### Authentication
- [Custom Access Token Hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook)
- [JWT Claims Reference](https://supabase.com/docs/guides/auth/jwt-fields)
- [User Management](https://supabase.com/docs/guides/auth/managing-user-data)

#### Realtime
- [Subscribing to Database Changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes)
- [JavaScript API Reference - Subscribe](https://supabase.com/docs/reference/javascript/subscribe)
- [Getting Started with Realtime](https://supabase.com/docs/guides/realtime/getting_started)

#### Offline-First
- [Building offline-first Flutter apps](https://supabase.com/blog/offline-first-flutter-apps)
- [React Native Offline-first with WatermelonDB](https://supabase.com/blog/react-native-offline-first-watermelon-db)

### Community Resources

#### TypeScript & React Query
- [Supabase Cache Helpers](https://supabase-cache-helpers.vercel.app/postgrest/getting-started)
- [Using React Query with Supabase](https://makerkit.dev/blog/saas/supabase-react-query)
- [Next.js + TanStack Query + Supabase Guide](https://silvestri.co/blog/nextjs-tanstack-query-supabase-guide)

#### Offline-First Libraries
- [RxDB Supabase Replication Plugin](https://rxdb.info/replication-supabase.html)
- [GitHub: rxdb-supabase](https://github.com/marceljuenemann/rxdb-supabase)
- [PowerSync: Offline-First for Supabase](https://www.powersync.com/blog/bringing-offline-first-to-supabase)

#### GitHub Discussions
- [Using Supabase offline (Discussion #357)](https://github.com/orgs/supabase/discussions/357)
- [Custom claims for multi tenancy (Discussion #1148)](https://github.com/orgs/supabase/discussions/1148)
- [Converting snake_case to camelCase (Discussion #646)](https://github.com/orgs/supabase/discussions/646)
- [Tables and columns naming conventions (Discussion #619)](https://github.com/orgs/supabase/discussions/619)

---

## Summary & Next Steps

### Key Takeaways

1. **Schema Design**
   - Use `snake_case` for all database identifiers
   - Add `created_at`, `updated_at`, `deleted` to all tables
   - Enable RLS on all public tables
   - Index foreign keys and columns used in queries

2. **TypeScript Integration**
   - Generate types with Supabase CLI: `npx supabase gen types typescript`
   - Automate type generation with GitHub Actions
   - Use strict TypeScript settings for null safety
   - Create type helpers for easier access

3. **RLS Performance**
   - Wrap functions in `SELECT` for query plan caching
   - Always index columns used in policies
   - Use explicit role filters (`to authenticated`)
   - Add explicit filters in queries (don't rely on RLS alone)

4. **Migrations**
   - Use timestamp naming: `YYYYMMDDHHmmss_description.sql`
   - Write idempotent migrations (check before create/alter)
   - Test locally with `supabase db reset`
   - Never rollback in production - create forward migrations

5. **Offline-First**
   - IndexedDB as primary data source
   - Sync queue for offline changes
   - Realtime subscriptions for live updates
   - Conflict resolution (last-write-wins or version-based)

6. **React Query**
   - Use for server state management
   - Implement optimistic updates
   - Integrate with Realtime for live cache updates
   - Consider Supabase Cache Helpers for automatic cache management

### Recommended Phase 5 Implementation Plan

**Week 1: Foundation**
- Set up Supabase project (local + cloud)
- Design schema with TypeScript type generation
- Implement authentication (email/password + OAuth)
- Enable RLS on all tables

**Week 2: Sync Infrastructure**
- Create sync queue in IndexedDB
- Implement pull/push sync logic
- Add conflict resolution (last-write-wins)
- Test offline → online transitions

**Week 3: React Query Integration**
- Replace direct Supabase calls with React Query hooks
- Add optimistic updates for mutations
- Integrate Realtime subscriptions with cache
- Test multi-device sync

**Week 4: Polish & Testing**
- Add migration scripts for existing local data
- Test conflict resolution edge cases
- Performance testing and optimization
- User acceptance testing

---

**Generated**: January 14, 2025
**Research Duration**: ~45 minutes
**Total Sources**: 40+ official docs + community resources