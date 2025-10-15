# Supabase Offline-First Sync Patterns Research

**Date**: October 14, 2025
**Purpose**: Comprehensive research on implementing offline-first sync with Supabase for Phase 5 of HSA Songbook
**Focus**: Conflict resolution strategies, real-time subscriptions, IndexedDB integration, and best practices

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Approaches](#architecture-approaches)
3. [Official Supabase Real-time Subscriptions](#official-supabase-real-time-subscriptions)
4. [Third-Party Solutions](#third-party-solutions)
5. [Database Schema Requirements](#database-schema-requirements)
6. [Conflict Resolution Strategies](#conflict-resolution-strategies)
7. [Implementation Patterns](#implementation-patterns)
8. [Best Practices & Pitfalls](#best-practices--pitfalls)
9. [Recommended Approach for HSA Songbook](#recommended-approach-for-hsa-songbook)
10. [Code Examples](#code-examples)
11. [Additional Resources](#additional-resources)

---

## Executive Summary

### Key Findings

**Supabase's Native Offline Support**: Limited compared to Firebase. Supabase Realtime provides excellent real-time subscriptions but lacks built-in offline persistence and conflict resolution. Third-party solutions are recommended for production offline-first apps.

**Recommended Solutions** (in order of preference):
1. **PowerSync** - Commercial solution, batteries-included, most robust
2. **RxDB + Supabase Plugin** - Open-source, highly customizable, good for web apps
3. **Custom Implementation** - Build your own sync queue + conflict resolution

**Critical Insight**: Don't try to build complex offline-first sync from scratch unless you have specific requirements. Use battle-tested libraries that handle edge cases.

### Firebase vs Supabase Offline Support

| Feature | Firebase | Supabase (Native) | Supabase + PowerSync | Supabase + RxDB |
|---------|----------|-------------------|---------------------|-----------------|
| Offline Persistence | ✅ Built-in | ❌ None | ✅ SQLite/IndexedDB | ✅ IndexedDB |
| Automatic Sync | ✅ Built-in | ❌ Manual | ✅ Automatic | ✅ Automatic |
| Conflict Resolution | ✅ Built-in | ❌ Manual | ✅ Configurable | ✅ Customizable |
| Real-time Updates | ✅ Excellent | ✅ Excellent | ✅ Excellent | ✅ Excellent |
| Learning Curve | Low | N/A | Medium | High |
| Cost | Free tier generous | Free tier generous | Paid service | Open-source |

**Recommendation**: For HSA Songbook Phase 5, evaluate PowerSync first (simplest), then RxDB (most flexible).

---

## Architecture Approaches

### Approach 1: PowerSync (Recommended for Simplicity)

**Architecture Overview**:
```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT APPLICATION                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          PowerSync SDK (Web/React Native)           │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │   Local SQLite Database (IndexedDB for Web)  │  │   │
│  │  │   - Embedded in app                          │  │   │
│  │  │   - Offline-capable                          │  │   │
│  │  │   - Auto-synced                              │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │   Upload Queue                               │  │   │
│  │  │   - Queues local writes                      │  │   │
│  │  │   - Syncs when online                        │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↕
                   (PowerSync Protocol)
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                    PowerSync Service                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Reads Postgres WAL (Write-Ahead Log)              │  │
│  │   Stores versioned data snapshot                     │  │
│  │   Exposes sync endpoint for clients                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↕
                    (Direct Connection)
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Postgres Database                 │
│  - Source of truth                                           │
│  - RLS policies enforced                                     │
│  - Real-time replication enabled                             │
└─────────────────────────────────────────────────────────────┘
```

**How It Works**:
1. App reads/writes directly to local SQLite (IndexedDB on web)
2. Local writes queued and sent via Supabase client when online
3. PowerSync service reads Postgres WAL and syncs changes to client
4. Conflict resolution handled at backend API level

**Pros**:
- Batteries-included solution
- Handles WAL reading, checkpointing, and sync automatically
- Works for Web (WASM SQLite in IndexedDB), React Native, Flutter
- Robust consistency guarantees
- Minimal custom code required

**Cons**:
- Commercial service (paid)
- Adds external dependency
- Less control over sync logic

**Official Docs**: https://docs.powersync.com/integration-guides/supabase-+-powersync

---

### Approach 2: RxDB + Supabase Plugin (Recommended for Flexibility)

**Architecture Overview**:
```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT APPLICATION                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              RxDB Database                           │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │   IndexedDB Storage (Browser)                │  │   │
│  │  │   - Collections (songs, arrangements, etc.)  │  │   │
│  │  │   - Reactive queries                         │  │   │
│  │  │   - Offline-first                            │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │   Replication Handler                        │  │   │
│  │  │   - Push changes to Supabase                 │  │   │
│  │  │   - Pull changes from Supabase               │  │   │
│  │  │   - Conflict resolution hooks                │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↕
              (PostgREST API + Realtime WebSocket)
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Backend                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   PostgREST API (for pull/push)                      │  │
│  │   Realtime Server (WebSocket for live updates)       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Postgres Database                                   │  │
│  │   - _modified timestamp (for sync)                    │  │
│  │   - _deleted boolean (for soft deletes)              │  │
│  │   - replicationRevision (for conflict detection)     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**How It Works**:
1. RxDB stores data locally in IndexedDB
2. Replication plugin syncs with Supabase via PostgREST
3. Supabase Realtime streams live updates to client
4. Conflicts resolved client-side with custom handlers
5. Similar to Git: pull before push, merge locally

**Pros**:
- Open-source and free
- Highly customizable conflict resolution
- Reactive queries (subscribe to data changes)
- Works well with React hooks
- Client-side conflict resolution (easier backend)

**Cons**:
- More complex setup than PowerSync
- Requires custom conflict handler implementation
- Higher learning curve
- Need to manage replication protocol yourself

**Official Docs**: https://rxdb.info/replication-supabase.html
**GitHub**: https://github.com/marceljuenemann/rxdb-supabase

---

### Approach 3: Custom Implementation (Not Recommended)

Building your own sync queue + conflict resolution from scratch.

**When to Consider**:
- Very specific requirements not met by existing solutions
- Budget constraints prevent commercial solutions
- You have deep expertise in distributed systems

**Challenges**:
- Edge cases are numerous (network failures, concurrent edits, race conditions)
- Requires significant testing and maintenance
- Likely to reinvent poorly what libraries do well

**Recommendation**: Only pursue if you have a strong reason. Use PowerSync or RxDB instead.

---

## Official Supabase Real-time Subscriptions

### Setup and Configuration

**1. Enable Replication for Table**:
```sql
-- Enable replication for your table
alter publication supabase_realtime
add table songs;

alter publication supabase_realtime
add table arrangements;
```

**2. Create Supabase Client**:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://<project>.supabase.co',
  '<anon-key>'
)
```

**3. Subscribe to Database Changes**:
```typescript
// Subscribe to all changes on 'songs' table
const channel = supabase
  .channel('schema-db-changes')
  .on(
    'postgres_changes',
    {
      event: '*',        // INSERT, UPDATE, DELETE, or * for all
      schema: 'public',
      table: 'songs',
    },
    (payload) => {
      console.log('Change received!', payload)
      // Update local IndexedDB here
    }
  )
  .subscribe()

// Clean up
channel.unsubscribe()
```

**4. Filter Subscriptions**:
```typescript
// Only listen to specific rows (uses RLS internally)
supabase
  .channel('songs-channel')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'songs',
      filter: 'id=eq.123', // Only song with id 123
    },
    handleSongUpdate
  )
  .subscribe()
```

### Integration with RLS (Row Level Security)

**Critical for Multi-Device Sync**: Supabase Realtime respects RLS policies. This ensures users only receive updates for data they have access to.

```sql
-- Example RLS policy: Users can only see their own setlists
create policy "Users can view own setlists"
on setlists
for select
using (auth.uid() = user_id);

-- Example RLS policy: Allow authenticated users to read all songs
create policy "Allow authenticated access to songs"
on songs
for select
to authenticated
using (true);
```

**How RLS Works with Realtime**:
- Every change event is checked against the user's RLS policies
- If you have 100 users subscribed to a table, a single insert triggers 100 "read checks"
- This can impact performance at scale (consider using Broadcast method)

### Scaling Considerations

**Broadcast Method (Recommended for Scale)**:
```sql
-- Create a trigger to broadcast changes
create or replace function broadcast_song_changes()
returns trigger as $$
begin
  perform realtime.broadcast_changes(
    'public',
    'songs',
    TG_OP,
    NEW,
    OLD
  );
  return NEW;
end;
$$ language plpgsql;

create trigger songs_broadcast_trigger
after insert or update or delete on songs
for each row execute function broadcast_song_changes();
```

**Benefits**:
- More scalable than Postgres Changes
- Decouples subscription checks from database events
- Better for high-frequency updates

**Official Docs**: https://supabase.com/docs/guides/realtime/postgres-changes

---

## Third-Party Solutions

### PowerSync

**Best For**: Teams wanting a turnkey solution without building sync logic.

**Key Features**:
- Automatic WAL reading and checkpointing
- Configurable sync rules (YAML-based)
- Supports Web (IndexedDB), React Native, Flutter, Kotlin, Swift
- Built-in conflict resolution
- Granular access control via sync rules

**Sync Rules Example**:
```yaml
bucket_definitions:
  user_lists:
    # Parameters define what data to sync for this user
    parameters: select id as list_id from lists where owner_id = request.user_id()

    # Data to sync
    data:
      - select * from lists where id = bucket.list_id
      - select * from todos where list_id = bucket.list_id
```

**Setup Steps**:
1. Configure Supabase database (enable replication)
2. Create PowerSync instance (cloud service)
3. Define sync rules
4. Install PowerSync SDK in your app
5. Implement `uploadData()` callback for local writes

**Pricing**: Commercial (check https://www.powersync.com for latest pricing)

**Docs**: https://docs.powersync.com/integration-guides/supabase-+-powersync

---

### RxDB with Supabase Plugin

**Best For**: Web apps needing full control over sync logic and conflict resolution.

**Key Features**:
- Client-side IndexedDB database with reactive queries
- Two-way sync with Supabase (pull/push)
- Custom conflict resolution handlers
- Works similar to Git (pull, merge, push)
- Built-in retry logic and checkpointing

**Required Table Structure**:
```sql
create table songs (
  id text primary key,
  title text not null,
  artist text,

  -- REQUIRED for RxDB sync
  _modified timestamptz default now(),
  _deleted boolean default false
);

-- Trigger to auto-update _modified
create or replace function update_modified_column()
returns trigger as $$
begin
  NEW._modified = now();
  return NEW;
end;
$$ language plpgsql;

create trigger set_timestamp
before update on songs
for each row execute function update_modified_column();
```

**Why `_deleted` instead of hard deletes?**
- Clients need to know about deletions that happened while offline
- Soft deletes allow sync of deletion events
- Can be cleaned up later with a cron job

**Installation**:
```bash
npm install rxdb rxdb-supabase @supabase/supabase-js --save
```

**Basic Setup** (TypeScript):
```typescript
import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { replicateSupabase } from 'rxdb-supabase';
import { createClient } from '@supabase/supabase-js';

// 1. Create RxDB database
const db = await createRxDatabase({
  name: 'hsasongbook',
  storage: getRxStorageDexie(), // Uses IndexedDB
});

// 2. Define schema
const songSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    title: { type: 'string' },
    artist: { type: 'string' },
    _modified: { type: 'string' }, // ISO timestamp
    _deleted: { type: 'boolean' },
  },
  required: ['id', 'title'],
};

// 3. Add collection
await db.addCollections({
  songs: {
    schema: songSchema,
  },
});

// 4. Create Supabase client
const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

// 5. Start replication
const replication = replicateSupabase({
  tableName: 'songs',
  client: supabase,
  collection: db.songs,
  replicationIdentifier: 'songs-replication',
  live: true, // Enable real-time updates
  pull: {
    batchSize: 50,
  },
  push: {
    batchSize: 50,
  },
});

// 6. Handle errors
replication.error$.subscribe(err => {
  console.error('[replication error]', err);
});

// 7. Wait for initial sync (optional)
await replication.awaitInitialReplication();
```

**GitHub**: https://github.com/marceljuenemann/rxdb-supabase
**Docs**: https://rxdb.info/replication-supabase.html

---

### WatermelonDB + Supabase

**Best For**: React Native apps (mobile-first).

**Key Features**:
- Fast, reactive database built on SQLite
- Excellent for mobile performance
- Requires more custom sync implementation

**Note**: Less documentation for Supabase integration compared to RxDB. Consider PowerSync or RxDB for web apps.

**Blog Post**: https://www.themorrow.digital/blog/building-an-offline-first-app-with-expo-supabase-and-watermelondb

---

## Database Schema Requirements

### Essential Fields for Offline Sync

**Every synced table MUST have**:

1. **`_modified` (or `updated_at`) - Timestamp**:
   - Stores last modification time
   - Used for incremental sync (only pull changes since last sync)
   - Updated automatically via trigger

2. **`_deleted` (or `deleted_at`) - Boolean or Timestamp**:
   - Marks rows as deleted (soft delete)
   - Prevents clients from missing deletions while offline
   - Cleanup can happen later via cron job

3. **`version` or `replicationRevision` (Optional but Recommended)**:
   - Numeric version counter
   - Increments on each write
   - Enables optimistic locking and conflict detection

### Example Schema (PostgreSQL)

```sql
-- Example: Songs table with sync support
create table songs (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  artist text,
  created_at timestamptz default now(),

  -- Sync fields (REQUIRED)
  updated_at timestamptz default now(),
  deleted boolean default false,

  -- Conflict detection (OPTIONAL but recommended)
  version integer default 1,

  -- Ownership for RLS
  user_id uuid references auth.users(id)
);

-- Index for efficient sync queries
create index songs_updated_at_idx on songs(updated_at);
create index songs_deleted_idx on songs(deleted) where deleted = false;

-- Enable Row Level Security
alter table songs enable row level security;

-- RLS policy: Users can read all non-deleted songs
create policy "Allow authenticated read"
on songs
for select
to authenticated
using (deleted = false);

-- RLS policy: Users can only update their own songs
create policy "Users can update own songs"
on songs
for update
to authenticated
using (auth.uid() = user_id);
```

### Auto-Update Triggers

**Option 1: Using MODDATETIME Extension (Recommended)**:
```sql
-- Enable the extension
create extension if not exists moddatetime schema extensions;

-- Create trigger to auto-update updated_at
create trigger handle_updated_at
before update on songs
for each row execute procedure moddatetime(updated_at);
```

**Option 2: Custom Trigger Function**:
```sql
-- Create function
create or replace function update_modified_column()
returns trigger as $$
begin
  NEW.updated_at = now();
  NEW.version = OLD.version + 1; -- Increment version
  return NEW;
end;
$$ language plpgsql;

-- Apply trigger
create trigger set_timestamp
before update on songs
for each row execute function update_modified_column();
```

### Soft Delete Implementation

**Using `deleted_at` Timestamp** (Recommended):
```sql
-- Add column
alter table songs add column deleted_at timestamptz;

-- Create view for active (non-deleted) rows
create view active_songs as
select * from songs where deleted_at is null;

-- Grant access to view
grant select on active_songs to authenticated;

-- Application queries active_songs instead of songs
```

**Using Boolean `deleted` Field**:
```sql
-- Add column
alter table songs add column deleted boolean default false;

-- Create view
create view active_songs as
select * from songs where deleted = false;
```

**Soft Delete Function** (Instead of Hard Delete):
```sql
create or replace function soft_delete_song(song_id text)
returns void as $$
begin
  update songs
  set deleted_at = now()
  where id = song_id;
end;
$$ language plpgsql;
```

**Official Docs**: https://supabase.com/docs/guides/troubleshooting/soft-deletes-with-supabase-js

---

## Conflict Resolution Strategies

### Overview

**What is a Conflict?**
- Two devices edit the same record while offline
- Both try to sync their changes when online
- System must decide which version "wins"

### Strategy 1: Last-Write-Wins (LWW)

**How It Works**:
- Compare `updated_at` timestamps
- The version with the newer timestamp wins
- Overwrites the older version

**Implementation (Pseudo-code)**:
```typescript
function resolveConflict(localDoc, remoteDoc) {
  if (localDoc.updated_at > remoteDoc.updated_at) {
    // Local is newer, push to server
    return localDoc;
  } else {
    // Remote is newer, accept server version
    return remoteDoc;
  }
}
```

**Pros**:
- Simple to implement
- Works well for single-user editing
- No manual intervention required

**Cons**:
- Data loss (older changes are discarded)
- Not suitable for collaborative editing
- Race conditions if timestamps are close

**Best For**: User-specific data (preferences, setlists, personal notes)

---

### Strategy 2: Optimistic Locking with Version Field

**How It Works**:
- Each record has a `version` counter
- Client sends version number with update
- Server checks if version matches
- If mismatch, conflict detected

**Implementation (PostgreSQL Function)**:
```sql
create or replace function update_song_with_version(
  song_id text,
  new_title text,
  expected_version integer
)
returns table(success boolean, current_version integer, message text) as $$
declare
  actual_version integer;
begin
  -- Get current version
  select version into actual_version
  from songs
  where id = song_id;

  -- Check version match
  if actual_version != expected_version then
    return query select false, actual_version, 'Conflict detected';
  end if;

  -- Update with new version
  update songs
  set title = new_title,
      version = version + 1,
      updated_at = now()
  where id = song_id;

  return query select true, expected_version + 1, 'Success';
end;
$$ language plpgsql;
```

**Client-Side Usage**:
```typescript
async function updateSongWithConflictDetection(
  songId: string,
  newTitle: string,
  currentVersion: number
) {
  const { data, error } = await supabase.rpc('update_song_with_version', {
    song_id: songId,
    new_title: newTitle,
    expected_version: currentVersion,
  });

  if (data?.success === false) {
    // Conflict detected!
    console.warn('Conflict detected:', data.message);

    // Option 1: Fetch latest version and retry
    const latest = await fetchLatestSong(songId);
    // Show merge UI to user

    // Option 2: Auto-merge (if possible)
    // Option 3: Force overwrite (if user chooses)
  }
}
```

**Pros**:
- Detects conflicts reliably
- Prevents accidental overwrites
- Can prompt user to resolve

**Cons**:
- Requires additional UI for conflict resolution
- More complex implementation
- Requires version tracking in client

**Best For**: Collaborative editing (shared setlists, song arrangements)

---

### Strategy 3: Custom Merge Logic (Field-Level)

**How It Works**:
- Track which fields changed
- Merge non-conflicting fields
- Only conflict on same-field edits

**Example Scenario**:
- User A changes song title (offline)
- User B changes song artist (offline)
- Both sync → Merge both changes (no conflict)

**Implementation (RxDB Conflict Handler)**:
```typescript
const songCollection = await db.addCollections({
  songs: {
    schema: songSchema,
    conflictHandler: async (conflict) => {
      const localDoc = conflict.newDocumentState;
      const remoteDoc = conflict.realMasterState;

      // Custom merge logic
      const merged = {
        ...remoteDoc, // Start with remote (server wins by default)

        // Keep local changes for specific fields if newer
        title: localDoc.updated_at > remoteDoc.updated_at
          ? localDoc.title
          : remoteDoc.title,

        // Always take the newer version of each field
        artist: localDoc.artist_updated_at > remoteDoc.artist_updated_at
          ? localDoc.artist
          : remoteDoc.artist,
      };

      return merged;
    },
  },
});
```

**Pros**:
- Minimizes data loss
- Intelligent merging
- Best user experience

**Cons**:
- Complex to implement
- Requires field-level timestamps
- May still need manual resolution UI

**Best For**: Complex documents with many independent fields

---

### Strategy 4: Operational Transformation (OT) / CRDTs

**How It Works**:
- Track operations instead of states
- Replay operations in order
- Guaranteed convergence

**Example**: Google Docs-style collaborative editing

**Libraries**:
- Yjs (CRDT library)
- Automerge (CRDT for JSON)

**Pros**:
- Mathematically guaranteed conflict-free
- Best for real-time collaboration
- No data loss

**Cons**:
- Very complex to implement
- Performance overhead
- May not fit all data models

**Best For**: Real-time collaborative editing (not typical for HSA Songbook)

**Recommendation for HSA Songbook**: Not needed (overkill)

---

### RxDB Conflict Handler Example (Complete)

```typescript
import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

const db = await createRxDatabase({
  name: 'hsasongbook',
  storage: getRxStorageDexie(),
});

const songSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    artist: { type: 'string' },
    _modified: { type: 'string' },
    _deleted: { type: 'boolean' },
    replicationRevision: { type: 'number' }, // Conflict detection
  },
};

await db.addCollections({
  songs: {
    schema: songSchema,

    // Conflict handler (called when replicationRevision mismatch)
    conflictHandler: async (conflict) => {
      const localDoc = conflict.newDocumentState;
      const remoteDoc = conflict.realMasterState;

      // Compare replication revisions
      if (localDoc.replicationRevision > remoteDoc.replicationRevision) {
        console.log('Local is newer, keeping local');
        return localDoc;
      } else if (remoteDoc.replicationRevision > localDoc.replicationRevision) {
        console.log('Remote is newer, accepting remote');
        return remoteDoc;
      } else {
        // Same revision (shouldn't happen, but fallback to LWW)
        console.warn('Same revision, using Last-Write-Wins');
        return localDoc._modified > remoteDoc._modified
          ? localDoc
          : remoteDoc;
      }
    },
  },
});
```

**Docs**: https://github.com/marceljuenemann/rxdb-supabase#conflict-resolution

---

## Implementation Patterns

### Pattern 1: Sync Queue (For Custom Implementations)

**IndexedDB Schema for Sync Queue**:
```typescript
interface SyncQueueItem {
  id: string; // Unique queue item ID
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string; // Table name
  recordId: string; // Record being synced
  payload: any; // Data to sync
  timestamp: number; // When queued
  retries: number; // Retry count
  error?: string; // Last error (if any)
}

// IndexedDB setup
const dbPromise = openDB('hsasongbook-sync', 1, {
  upgrade(db) {
    // Main data stores
    db.createObjectStore('songs', { keyPath: 'id' });
    db.createObjectStore('arrangements', { keyPath: 'id' });

    // Sync queue
    const queueStore = db.createObjectStore('syncQueue', {
      keyPath: 'id',
      autoIncrement: true
    });
    queueStore.createIndex('timestamp', 'timestamp');
  },
});
```

**Queue Operations**:
```typescript
// Add item to sync queue
async function queueForSync(
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  table: string,
  recordId: string,
  payload: any
) {
  const db = await dbPromise;

  await db.add('syncQueue', {
    operation,
    table,
    recordId,
    payload,
    timestamp: Date.now(),
    retries: 0,
  });

  // Trigger sync if online
  if (navigator.onLine) {
    processSyncQueue();
  }
}

// Process sync queue with exponential backoff
async function processSyncQueue() {
  const db = await dbPromise;
  const queue = await db.getAll('syncQueue');

  for (const item of queue) {
    try {
      // Sync with Supabase
      if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
        const { error } = await supabase
          .from(item.table)
          .upsert(item.payload);

        if (error) throw error;
      } else if (item.operation === 'DELETE') {
        const { error } = await supabase
          .from(item.table)
          .update({ deleted: true })
          .eq('id', item.recordId);

        if (error) throw error;
      }

      // Success - remove from queue
      await db.delete('syncQueue', item.id);

    } catch (error) {
      console.error('Sync failed:', error);

      // Update retry count
      await db.put('syncQueue', {
        ...item,
        retries: item.retries + 1,
        error: error.message,
      });

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, item.retries), 30000);
      setTimeout(() => processSyncQueue(), delay);
    }
  }
}

// Listen for online event
window.addEventListener('online', () => {
  console.log('Back online, processing sync queue');
  processSyncQueue();
});
```

---

### Pattern 2: Exponential Backoff Retry

**Supabase Client with Retry Logic**:
```typescript
import { createClient } from '@supabase/supabase-js';
import fetchRetry from 'fetch-retry';

// Wrap fetch with retry logic
const retryingFetch = fetchRetry(fetch, {
  retries: 5,
  retryDelay: (attempt) => {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s (max 30s)
    return Math.min(1000 * Math.pow(2, attempt), 30000);
  },
  retryOn: [408, 429, 500, 502, 503, 504], // Retry on these HTTP codes
});

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key',
  {
    global: {
      fetch: retryingFetch,
    },
  }
);
```

**Official Docs**: https://supabase.com/docs/guides/api/automatic-retries-in-supabase-js

**PostgreSQL-Based Queue (PGQueue)**:

For server-side retry logic (e.g., webhooks, background jobs):

```bash
npm install @gc-ft/supabase-pgqueue
```

**Features**:
- Exponential backoff for failed jobs
- Scheduled job execution
- Handles 429 (rate limit) errors
- Built-in Supabase integration

**GitHub**: https://github.com/gc-ft/supabase-pgqueue

---

### Pattern 3: Optimistic UI Updates

**Update UI immediately, sync in background**:
```typescript
async function updateSongTitle(songId: string, newTitle: string) {
  // 1. Update local IndexedDB immediately (optimistic)
  await db.songs.update(songId, { title: newTitle });

  // UI updates instantly (good UX)

  // 2. Queue for sync
  await queueForSync('UPDATE', 'songs', songId, {
    id: songId,
    title: newTitle,
    updated_at: new Date().toISOString(),
  });

  // 3. Sync will happen in background
  if (navigator.onLine) {
    processSyncQueue().catch(err => {
      console.error('Sync failed, will retry later');
      // Optionally show error toast
    });
  }
}
```

**Benefits**:
- Instant UI feedback
- Works offline seamlessly
- Automatic retry when online

---

### Pattern 4: Real-time Updates Integration

**Combine Supabase Realtime with Local IndexedDB**:
```typescript
// Set up Supabase Realtime subscription
supabase
  .channel('songs-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'songs',
    },
    async (payload) => {
      console.log('Change received from server:', payload);

      // Update local IndexedDB with server change
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        await db.songs.upsert(payload.new);
      } else if (payload.eventType === 'DELETE') {
        await db.songs.remove(payload.old.id);
      }

      // UI will automatically update via React hooks watching IndexedDB
    }
  )
  .subscribe();

// React hook to watch local data
function useSongs() {
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    // Initial load from IndexedDB
    db.songs.getAll().then(setSongs);

    // Watch for changes (if using RxDB or similar)
    const subscription = db.songs.$.subscribe(updatedSongs => {
      setSongs(updatedSongs);
    });

    return () => subscription.unsubscribe();
  }, []);

  return songs;
}
```

---

## Best Practices & Pitfalls

### Best Practices

1. **Use Soft Deletes, Not Hard Deletes**
   - Add `deleted` boolean or `deleted_at` timestamp
   - Clients need to know about deletions while offline
   - Clean up later with a cron job

2. **Index Sync Fields**
   ```sql
   create index songs_updated_at_idx on songs(updated_at);
   create index songs_deleted_idx on songs(deleted) where deleted = false;
   ```
   - Essential for efficient incremental sync queries

3. **Enable RLS (Row Level Security)**
   - Prevents data leakage
   - Ensures users only sync their own data
   - Realtime subscriptions respect RLS

4. **Use Timestamps (UTC) for Sync**
   ```sql
   updated_at timestamptz default now() -- Always use timestamptz
   ```
   - Avoid `timestamp` without timezone
   - Ensures consistent cross-timezone sync

5. **Batch Sync Operations**
   ```typescript
   pull: { batchSize: 50 },
   push: { batchSize: 50 },
   ```
   - Reduces network overhead
   - Prevents overwhelming the server

6. **Handle Offline Gracefully**
   ```typescript
   window.addEventListener('online', processSyncQueue);
   window.addEventListener('offline', () => {
     console.log('Offline mode activated');
     // Show offline indicator
   });
   ```

7. **Implement Exponential Backoff**
   - Prevents server overload on retry storms
   - Use `Math.min(1000 * 2^attempt, 30000)` pattern

8. **Test Offline Scenarios**
   - Simulate network failures
   - Test concurrent edits from multiple devices
   - Verify conflict resolution works

9. **Monitor Sync Queue Size**
   - Alert if queue grows too large
   - Indicates sync issues

10. **Version Your Schema**
    - Use RxDB schema versioning
    - Plan for migrations

---

### Common Pitfalls

1. **Forgetting to Update `_modified` Timestamp**
   - **Problem**: Incremental sync breaks
   - **Solution**: Use database trigger (automatic)

2. **Hard Deleting Records**
   - **Problem**: Offline clients miss deletions
   - **Solution**: Always use soft deletes

3. **Not Handling Conflicts**
   - **Problem**: Data loss or inconsistency
   - **Solution**: Implement conflict resolution strategy

4. **Ignoring RLS Policies**
   - **Problem**: Users can access others' data
   - **Solution**: Always enable RLS, write comprehensive policies

5. **Assuming Timestamps are Unique**
   - **Problem**: Two edits at same millisecond → conflict undetected
   - **Solution**: Use version field + timestamp

6. **Not Testing Concurrent Edits**
   - **Problem**: Conflicts discovered in production
   - **Solution**: Automated tests with multiple clients

7. **Blocking UI on Sync**
   - **Problem**: Poor user experience
   - **Solution**: Always sync in background, update UI optimistically

8. **Not Indexing Sync Fields**
   - **Problem**: Slow sync queries as data grows
   - **Solution**: Add indexes on `updated_at`, `deleted`

9. **Trusting Client Timestamps**
   - **Problem**: Clients can have wrong system time
   - **Solution**: Use server-side `now()` for timestamps

10. **Over-Engineering Conflict Resolution**
    - **Problem**: Complexity without benefit
    - **Solution**: Start with LWW, add complexity only if needed

---

## Recommended Approach for HSA Songbook

### Analysis

**Project Requirements**:
- PWA with offline-first capability (already implemented in Phase 2)
- Multi-device sync (Phase 5)
- User authentication with Supabase (Phase 5)
- Primarily single-user editing (users manage their own setlists)
- Occasional collaboration (shared setlists in future)

**Data Model**:
- Songs (read-only for most users)
- Arrangements (read-only for most users)
- Setlists (user-specific, low conflict potential)
- User preferences (user-specific, no conflicts)

### Recommendation: RxDB + Supabase Plugin

**Why RxDB over PowerSync?**

1. **Cost**: Open-source vs. commercial
2. **Control**: Full control over conflict resolution
3. **TypeScript Integration**: Excellent TypeScript support
4. **Existing IndexedDB**: Already using IndexedDB in Phase 2
5. **React Hooks**: Easy integration with existing React code
6. **Flexibility**: Can customize sync logic as needed

**Why Not Custom Implementation?**
- RxDB handles checkpointing, retry logic, and edge cases
- Saves weeks of development time
- Battle-tested in production apps

**Why Not PowerSync?**
- Cost (may be justified later if scaling issues arise)
- Less control over sync logic
- Overkill for mostly single-user data

---

### Implementation Plan for Phase 5

**Step 1: Prepare Supabase Database Schema**

```sql
-- Add sync fields to existing tables
alter table songs
  add column updated_at timestamptz default now(),
  add column deleted boolean default false,
  add column version integer default 1;

alter table arrangements
  add column updated_at timestamptz default now(),
  add column deleted boolean default false,
  add column version integer default 1;

alter table setlists
  add column updated_at timestamptz default now(),
  add column deleted boolean default false,
  add column version integer default 1;

-- Create indexes
create index songs_updated_at_idx on songs(updated_at);
create index songs_deleted_idx on songs(deleted) where deleted = false;
create index arrangements_updated_at_idx on arrangements(updated_at);
create index setlists_updated_at_idx on setlists(updated_at);

-- Create triggers for auto-update
create extension if not exists moddatetime schema extensions;

create trigger handle_songs_updated_at
before update on songs
for each row execute procedure moddatetime(updated_at);

create trigger handle_arrangements_updated_at
before update on arrangements
for each row execute procedure moddatetime(updated_at);

create trigger handle_setlists_updated_at
before update on setlists
for each row execute procedure moddatetime(updated_at);

-- Enable RLS
alter table songs enable row level security;
alter table arrangements enable row level security;
alter table setlists enable row level security;

-- RLS policies
create policy "Allow authenticated read songs"
on songs for select
to authenticated
using (deleted = false);

create policy "Users can view own setlists"
on setlists for select
to authenticated
using (user_id = auth.uid() and deleted = false);

-- Enable Realtime
alter publication supabase_realtime add table songs;
alter publication supabase_realtime add table arrangements;
alter publication supabase_realtime add table setlists;
```

---

**Step 2: Install RxDB Dependencies**

```bash
npm install rxdb rxdb-supabase @supabase/supabase-js
```

---

**Step 3: Migrate IndexedDB to RxDB**

**Current**: Custom IndexedDB wrapper (Phase 2)
**Target**: RxDB collections

```typescript
// src/features/pwa/db/rxdb-setup.ts
import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { songSchema, arrangementSchema, setlistSchema } from './schemas';

let dbPromise: Promise<RxDatabase> | null = null;

export async function initRxDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = createRxDatabase({
    name: 'hsasongbook',
    storage: getRxStorageDexie(),
  });

  const db = await dbPromise;

  await db.addCollections({
    songs: { schema: songSchema },
    arrangements: { schema: arrangementSchema },
    setlists: {
      schema: setlistSchema,
      conflictHandler: lastWriteWinsConflictHandler,
    },
  });

  return db;
}
```

---

**Step 4: Set Up Supabase Replication**

```typescript
// src/features/pwa/db/replication.ts
import { replicateSupabase } from 'rxdb-supabase';
import { createClient } from '@supabase/supabase-js';
import { initRxDatabase } from './rxdb-setup';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function startReplication() {
  const db = await initRxDatabase();

  // Replicate songs
  const songsReplication = replicateSupabase({
    tableName: 'songs',
    client: supabase,
    collection: db.songs,
    replicationIdentifier: 'songs-sync',
    live: true,
    pull: { batchSize: 50 },
    push: { batchSize: 50 },
  });

  // Replicate arrangements
  const arrangementsReplication = replicateSupabase({
    tableName: 'arrangements',
    client: supabase,
    collection: db.arrangements,
    replicationIdentifier: 'arrangements-sync',
    live: true,
    pull: { batchSize: 50 },
    push: { batchSize: 50 },
  });

  // Replicate setlists
  const setlistsReplication = replicateSupabase({
    tableName: 'setlists',
    client: supabase,
    collection: db.setlists,
    replicationIdentifier: 'setlists-sync',
    live: true,
    pull: { batchSize: 50 },
    push: { batchSize: 50 },
  });

  // Handle errors
  const replications = [
    songsReplication,
    arrangementsReplication,
    setlistsReplication,
  ];

  replications.forEach(replication => {
    replication.error$.subscribe(err => {
      console.error('[replication error]', err);
      // TODO: Show error toast to user
    });
  });

  // Wait for initial sync
  await Promise.all(
    replications.map(r => r.awaitInitialReplication())
  );

  console.log('Initial sync complete');

  return replications;
}
```

---

**Step 5: Implement Conflict Resolution**

```typescript
// src/features/pwa/db/conflict-handlers.ts
import type { RxConflictHandler } from 'rxdb';

/**
 * Last-Write-Wins conflict handler
 * Uses updated_at timestamp to determine winner
 */
export const lastWriteWinsConflictHandler: RxConflictHandler = async (conflict) => {
  const localDoc = conflict.newDocumentState;
  const remoteDoc = conflict.realMasterState;

  // Compare timestamps
  const localTime = new Date(localDoc.updated_at).getTime();
  const remoteTime = new Date(remoteDoc.updated_at).getTime();

  if (localTime > remoteTime) {
    console.log('[conflict] Local is newer, keeping local');
    return localDoc;
  } else {
    console.log('[conflict] Remote is newer, accepting remote');
    return remoteDoc;
  }
};

/**
 * Version-based conflict handler (more robust)
 * Uses version field + timestamp
 */
export const versionBasedConflictHandler: RxConflictHandler = async (conflict) => {
  const localDoc = conflict.newDocumentState;
  const remoteDoc = conflict.realMasterState;

  // Compare versions first
  if (localDoc.version > remoteDoc.version) {
    return localDoc;
  } else if (remoteDoc.version > localDoc.version) {
    return remoteDoc;
  } else {
    // Same version (shouldn't happen), fallback to timestamp
    const localTime = new Date(localDoc.updated_at).getTime();
    const remoteTime = new Date(remoteDoc.updated_at).getTime();
    return localTime > remoteTime ? localDoc : remoteDoc;
  }
};
```

---

**Step 6: Update React Hooks**

```typescript
// src/features/songs/hooks/useSongs.ts
import { useEffect, useState } from 'react';
import { initRxDatabase } from '@/features/pwa/db/rxdb-setup';

export function useSongs() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: any;

    async function setupReactiveSongs() {
      const db = await initRxDatabase();

      // Subscribe to songs collection (reactive)
      subscription = db.songs.find({
        selector: {
          deleted: false, // Only non-deleted
        },
        sort: [{ title: 'asc' }],
      }).$.subscribe(results => {
        setSongs(results);
        setLoading(false);
      });
    }

    setupReactiveSongs();

    return () => subscription?.unsubscribe();
  }, []);

  return { songs, loading };
}
```

---

**Step 7: Implement Supabase Auth**

```typescript
// src/features/auth/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { startReplication } from '@/features/pwa/db/replication';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // Start replication if logged in
      if (session?.user) {
        startReplication().catch(console.error);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);

        // Start/stop replication based on auth state
        if (session?.user) {
          startReplication().catch(console.error);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
```

---

**Step 8: Add Sync Status Indicator**

```typescript
// src/features/pwa/components/SyncStatus.tsx
import { useEffect, useState } from 'react';
import { initRxDatabase } from '../db/rxdb-setup';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function SyncStatus() {
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    async function watchSync() {
      const db = await initRxDatabase();

      // Watch all replications
      db.songs.replication?.active$.subscribe(active => {
        setSyncing(active);
      });
    }

    watchSync();

    // Listen for online/offline
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!online) {
    return (
      <div className="flex items-center gap-2 text-amber-600">
        <WifiOff size={16} />
        <span className="text-sm">Offline</span>
      </div>
    );
  }

  if (syncing) {
    return (
      <div className="flex items-center gap-2 text-blue-600">
        <RefreshCw size={16} className="animate-spin" />
        <span className="text-sm">Syncing...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-green-600">
      <Wifi size={16} />
      <span className="text-sm">Synced</span>
    </div>
  );
}
```

---

### Migration Strategy

**Phase 5.1: Foundation** (Week 1)
- Set up Supabase project
- Configure database schema (sync fields, triggers, RLS)
- Implement authentication

**Phase 5.2: RxDB Integration** (Week 2)
- Install RxDB
- Migrate IndexedDB wrapper to RxDB collections
- Test local data still works

**Phase 5.3: Replication** (Week 3)
- Set up Supabase replication plugin
- Implement conflict handlers
- Test sync with single device

**Phase 5.4: Multi-Device Testing** (Week 4)
- Test concurrent edits
- Verify conflict resolution
- Performance testing

**Phase 5.5: Polish** (Week 5)
- Sync status indicator
- Error handling and retry
- Documentation

---

## Code Examples

### Complete TypeScript Example: Song CRUD with Offline Sync

```typescript
// src/features/songs/repositories/SongRepository.ts
import { initRxDatabase } from '@/features/pwa/db/rxdb-setup';
import type { RxDocument } from 'rxdb';

export interface Song {
  id: string;
  title: string;
  artist: string;
  created_at: string;
  updated_at: string;
  deleted: boolean;
  version: number;
  user_id?: string;
}

export class SongRepository {
  /**
   * Get all non-deleted songs
   */
  static async getAll(): Promise<Song[]> {
    const db = await initRxDatabase();

    const results = await db.songs.find({
      selector: {
        deleted: false,
      },
      sort: [{ title: 'asc' }],
    }).exec();

    return results.map(doc => doc.toJSON());
  }

  /**
   * Get song by ID
   */
  static async getById(id: string): Promise<Song | null> {
    const db = await initRxDatabase();

    const doc = await db.songs.findOne(id).exec();
    return doc ? doc.toJSON() : null;
  }

  /**
   * Create new song (syncs automatically)
   */
  static async create(song: Omit<Song, 'id' | 'created_at' | 'updated_at' | 'deleted' | 'version'>): Promise<Song> {
    const db = await initRxDatabase();

    const newSong = {
      id: crypto.randomUUID(),
      ...song,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted: false,
      version: 1,
    };

    await db.songs.insert(newSong);

    // RxDB will automatically sync to Supabase
    return newSong;
  }

  /**
   * Update song (syncs automatically)
   */
  static async update(id: string, updates: Partial<Song>): Promise<Song> {
    const db = await initRxDatabase();

    const doc = await db.songs.findOne(id).exec();
    if (!doc) throw new Error('Song not found');

    await doc.update({
      $set: {
        ...updates,
        updated_at: new Date().toISOString(),
        version: doc.version + 1,
      },
    });

    // RxDB will automatically sync to Supabase
    return doc.toJSON();
  }

  /**
   * Soft delete song (syncs automatically)
   */
  static async delete(id: string): Promise<void> {
    const db = await initRxDatabase();

    const doc = await db.songs.findOne(id).exec();
    if (!doc) throw new Error('Song not found');

    await doc.update({
      $set: {
        deleted: true,
        updated_at: new Date().toISOString(),
        version: doc.version + 1,
      },
    });

    // RxDB will automatically sync to Supabase
  }

  /**
   * Search songs by title or artist
   */
  static async search(query: string): Promise<Song[]> {
    const db = await initRxDatabase();

    const results = await db.songs.find({
      selector: {
        deleted: false,
        $or: [
          { title: { $regex: new RegExp(query, 'i') } },
          { artist: { $regex: new RegExp(query, 'i') } },
        ],
      },
    }).exec();

    return results.map(doc => doc.toJSON());
  }
}
```

**Usage in React Component**:
```typescript
// src/features/songs/components/SongList.tsx
import { useEffect, useState } from 'react';
import { SongRepository } from '../repositories/SongRepository';

export function SongList() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SongRepository.getAll().then(songs => {
      setSongs(songs);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (songId: string) => {
    await SongRepository.delete(songId);
    // Refresh list
    const updatedSongs = await SongRepository.getAll();
    setSongs(updatedSongs);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {songs.map(song => (
        <div key={song.id}>
          <h3>{song.title}</h3>
          <p>{song.artist}</p>
          <button onClick={() => handleDelete(song.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

---

## Additional Resources

### Official Documentation

**Supabase**:
- Realtime Postgres Changes: https://supabase.com/docs/guides/realtime/postgres-changes
- Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Soft Deletes: https://supabase.com/docs/guides/troubleshooting/soft-deletes-with-supabase-js
- Automatic Retries: https://supabase.com/docs/guides/api/automatic-retries-in-supabase-js
- Triggers: https://supabase.com/docs/guides/database/postgres/triggers

**RxDB**:
- Supabase Replication Plugin: https://rxdb.info/replication-supabase.html
- Conflict Handling: https://rxdb.info/conflict-handling.html
- Official RxDB Docs: https://rxdb.info/

**PowerSync**:
- Supabase Integration Guide: https://docs.powersync.com/integration-guides/supabase-+-powersync
- Official PowerSync Docs: https://docs.powersync.com/

---

### GitHub Repositories

**RxDB Examples**:
- RxDB Supabase Example: https://github.com/pubkey/rxdb/tree/master/examples/supabase
- RxDB Supabase Plugin: https://github.com/marceljuenemann/rxdb-supabase

**Libraries**:
- Supabase PGQueue (retry logic): https://github.com/gc-ft/supabase-pgqueue
- SyncedDB (IndexedDB sync): https://github.com/darrachequesne/synceddb
- Dexie.Syncable: https://dexie.org/docs/Syncable/Dexie.Syncable.js.html

---

### Blog Posts & Tutorials

**Offline-First with Supabase**:
- PowerSync: Bringing Offline-First To Supabase: https://www.powersync.com/blog/bringing-offline-first-to-supabase
- Building Offline-First Apps with WatermelonDB: https://www.themorrow.digital/blog/building-an-offline-first-app-with-expo-supabase-and-watermelondb
- Updating Timestamps Automatically in Supabase: https://dev.to/paullaros/updating-timestamps-automatically-in-supabase-5f5o
- Auto-Generate Created/Updated Columns: https://jonmeyers.io/blog/automatically-generate-values-for-created-and-updated-columns-in-postgres

**Conflict Resolution**:
- RxDB Downsides of Offline-First: https://rxdb.info/downsides-of-offline-first.html

---

### Comparison Articles

- Supabase vs Firebase (2025): https://www.clickittech.com/software-development/supabase-vs-firebase/
- Supabase vs Firebase Comparison: https://www.bytebase.com/blog/supabase-vs-firebase/
- Real-Time Collaboration Tools: https://propelius.tech/blogs/real-time-collaboration-tools-supabase-vs-firebase

---

### Community Discussions

- Using Supabase Offline: https://github.com/orgs/supabase/discussions/357
- Implementing Soft Deletes: https://github.com/orgs/supabase/discussions/32523
- Automatic Created/Updated Columns: https://github.com/orgs/supabase/discussions/6741
- Offline-First Supabase vs Firebase: https://community.flutterflow.io/discussions/post/offline-first-supabase-vs-firebase-firestore-lM9ET0JcT4KG2E0

---

## Conclusion

### Key Takeaways

1. **Don't Build from Scratch**: Use PowerSync or RxDB instead of custom sync logic
2. **Start Simple**: Last-Write-Wins conflict resolution is sufficient for most use cases
3. **Plan Database Schema**: `updated_at` + `deleted` + `version` fields are essential
4. **Enable RLS**: Security and data isolation are critical for multi-user apps
5. **Test Offline Scenarios**: Concurrent edits, network failures, and edge cases
6. **Use Soft Deletes**: Hard deletes break offline sync
7. **Exponential Backoff**: Prevents server overload on retries

### Recommended Next Steps for HSA Songbook

1. **Evaluate RxDB** (Week 1):
   - Install and test RxDB locally
   - Prototype sync with a simple collection
   - Measure performance and complexity

2. **Evaluate PowerSync** (Week 1):
   - Sign up for trial
   - Test integration with HSA Songbook data model
   - Compare cost vs. time savings

3. **Make Decision** (Week 2):
   - Choose RxDB (open-source, flexible) or PowerSync (commercial, batteries-included)
   - Document decision rationale

4. **Implement Phase 5** (Weeks 3-7):
   - Follow implementation plan outlined above
   - Test thoroughly with multiple devices
   - Monitor sync performance

### Questions to Answer Before Implementation

- [ ] What is the expected number of concurrent users per setlist?
- [ ] How important is real-time collaboration (vs. eventual consistency)?
- [ ] What is the budget for third-party services (PowerSync)?
- [ ] How critical is offline functionality (vs. online-first with offline fallback)?
- [ ] What is the acceptable sync latency (seconds vs. minutes)?

---

**Document Version**: 1.0
**Last Updated**: October 14, 2025
**Next Review**: Before starting Phase 5 implementation