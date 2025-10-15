# Supabase Offline Sync - Quick Reference

**For**: HSA Songbook Phase 5 Implementation
**See Full Docs**: `supabase-offline-sync-patterns.md`

---

## TL;DR - What You Need to Know

### Recommended Approach: RxDB + Supabase Plugin

**Why?**
- Open-source (free)
- Full control over conflict resolution
- Excellent TypeScript support
- Works with existing IndexedDB infrastructure
- Saves weeks vs. custom implementation

**Alternative**: PowerSync (commercial, batteries-included, easier but costs money)

---

## Essential Database Schema Changes

```sql
-- Add to ALL synced tables
alter table your_table
  add column updated_at timestamptz default now(),
  add column deleted boolean default false,
  add column version integer default 1;

-- Auto-update trigger (use moddatetime extension)
create extension if not exists moddatetime schema extensions;

create trigger handle_updated_at
before update on your_table
for each row execute procedure moddatetime(updated_at);

-- Enable RLS
alter table your_table enable row level security;

-- Enable Realtime
alter publication supabase_realtime add table your_table;
```

---

## Minimal RxDB Setup

```typescript
// 1. Install
npm install rxdb rxdb-supabase @supabase/supabase-js

// 2. Create database
import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

const db = await createRxDatabase({
  name: 'hsasongbook',
  storage: getRxStorageDexie(),
});

// 3. Add collection
await db.addCollections({
  songs: { schema: songSchema },
});

// 4. Start replication
import { replicateSupabase } from 'rxdb-supabase';

const replication = replicateSupabase({
  tableName: 'songs',
  client: supabaseClient,
  collection: db.songs,
  replicationIdentifier: 'songs-sync',
  live: true,
});

// Done! Sync happens automatically
```

---

## Conflict Resolution (Last-Write-Wins)

```typescript
await db.addCollections({
  songs: {
    schema: songSchema,
    conflictHandler: async (conflict) => {
      const local = conflict.newDocumentState;
      const remote = conflict.realMasterState;

      // Compare timestamps
      return local.updated_at > remote.updated_at ? local : remote;
    },
  },
});
```

---

## Critical Rules

1. **ALWAYS use soft deletes** (never hard delete)
   - Add `deleted` boolean field
   - Update to `deleted = true` instead of DELETE

2. **ALWAYS auto-update `updated_at`** (use database trigger)
   - Don't rely on client timestamps
   - Use `moddatetime` extension

3. **ALWAYS enable RLS**
   - Prevents data leakage
   - Ensures users only sync their data

4. **ALWAYS use exponential backoff** for retries
   - `Math.min(1000 * 2^attempt, 30000)`

5. **NEVER trust client timestamps** for sync
   - Use server-side `now()` in triggers

---

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Forgetting to update `updated_at` | Use database trigger (automatic) |
| Hard deleting records | Use soft deletes (`deleted = true`) |
| No conflict resolution | Implement LWW or version-based handler |
| Ignoring RLS | Always enable RLS with proper policies |
| Blocking UI on sync | Sync in background, update UI optimistically |

---

## Testing Checklist

- [ ] Test offline edits sync when back online
- [ ] Test concurrent edits from 2 devices (conflict resolution)
- [ ] Test network failure mid-sync (retry logic)
- [ ] Test soft delete syncs correctly
- [ ] Verify RLS policies work (users can't see others' data)
- [ ] Check sync queue doesn't grow unbounded
- [ ] Test app works completely offline

---

## Performance Tips

```sql
-- Index sync fields (essential!)
create index songs_updated_at_idx on songs(updated_at);
create index songs_deleted_idx on songs(deleted) where deleted = false;
```

```typescript
// Batch sync operations
pull: { batchSize: 50 },
push: { batchSize: 50 },
```

---

## Links

**Full Documentation**: `PRPs/ai_docs/supabase-offline-sync-patterns.md`

**Official Docs**:
- RxDB Supabase Plugin: https://rxdb.info/replication-supabase.html
- Supabase Realtime: https://supabase.com/docs/guides/realtime/postgres-changes
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security

**GitHub**:
- RxDB Example: https://github.com/pubkey/rxdb/tree/master/examples/supabase
- RxDB Plugin: https://github.com/marceljuenemann/rxdb-supabase

---

## Phase 5 Implementation Timeline

**Week 1**: Supabase setup + schema migration
**Week 2**: RxDB integration + local testing
**Week 3**: Replication setup + conflict handlers
**Week 4**: Multi-device testing
**Week 5**: Polish + error handling

---

**Last Updated**: October 14, 2025