# IndexedDB Schema and Migration Patterns
## For HSA Songbook PWA Implementation

---

## Database Schema Design

### TypeScript Interfaces
```typescript
// Core entity interfaces aligned with data model
interface Song {
  id: string;
  title: string;
  artist: string;
  slug: string;
  compositionYear?: number;
  themes: string[];
  source?: string;
  notes?: string;
  metadata: {
    createdBy: string;
    lastModifiedBy: string;
    isPublic: boolean;
    ratings: { average: number; count: number };
    views: number;
    popularity: number;
  };
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'synced' | 'pending' | 'conflict';
  version: number;
}

interface Arrangement {
  id: string;
  songId: string;
  name: string;
  slug: string;
  chordData: string; // ChordPro format
  key: 'C' | 'C#' | 'Db' | 'D' | 'D#' | 'Eb' | 'E' | 'F' | 'F#' | 'Gb' | 'G' | 'G#' | 'Ab' | 'A' | 'A#' | 'Bb' | 'B';
  tempo?: number; // 40-240 BPM
  timeSignature?: '4/4' | '3/4' | '6/8' | '2/4';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  capo?: number;
  tags: string[];
  description?: string;
  metadata: {
    isMashup: boolean;
    mashupSections?: Array<{ songId: string; section: string }>;
    isPublic: boolean;
    ratings: { average: number; count: number };
    views: number;
    popularity: number;
  };
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'synced' | 'pending' | 'conflict';
  version: number;
}

interface Setlist {
  id: string;
  name: string;
  description?: string;
  songs: Array<{
    songId: string;
    arrangementId: string;
    customKey?: string;
    order: number;
    notes?: string;
  }>;
  metadata: {
    isPublic: boolean;
    sharedWith: string[];
    performanceDate?: Date;
    venue?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'synced' | 'pending' | 'conflict';
  version: number;
}

interface SyncQueueItem {
  id: string;
  type: 'song' | 'arrangement' | 'setlist';
  operation: 'create' | 'update' | 'delete';
  entityId: string;
  data?: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
}
```

### IndexedDB Schema with idb Library
```typescript
import { DBSchema } from 'idb';

interface HSASongbookDB extends DBSchema {
  songs: {
    key: string;
    value: Song;
    indexes: {
      'by-title': string;
      'by-artist': string;
      'by-sync-status': 'synced' | 'pending' | 'conflict';
      'by-updated': Date;
      'by-popularity': number;
    };
  };

  arrangements: {
    key: string;
    value: Arrangement;
    indexes: {
      'by-song': string;
      'by-key': string;
      'by-rating': number;
      'by-popularity': number;
      'by-sync-status': 'synced' | 'pending' | 'conflict';
      'by-song-rating': [string, number]; // Compound index
      'by-song-popularity': [string, number]; // Compound index
    };
  };

  setlists: {
    key: string;
    value: Setlist;
    indexes: {
      'by-name': string;
      'by-sync-status': 'synced' | 'pending' | 'conflict';
      'by-updated': Date;
      'by-performance-date': Date;
    };
  };

  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      'by-type': 'song' | 'arrangement' | 'setlist';
      'by-timestamp': Date;
      'by-retry-count': number;
    };
  };

  preferences: {
    key: string;
    value: {
      key: string;
      value: any;
      updatedAt: Date;
    };
  };
}
```

## Migration Strategy

### Version Management
```typescript
const DB_NAME = 'HSASongbookDB';
const CURRENT_VERSION = 3;

// Migration history
const MIGRATIONS = {
  1: 'Initial schema',
  2: 'Add sync queue and compound indexes',
  3: 'Add popularity tracking and preferences'
};
```

### Migration Implementation
```typescript
import { openDB, IDBPDatabase } from 'idb';

async function openDatabase(): Promise<IDBPDatabase<HSASongbookDB>> {
  return openDB<HSASongbookDB>(DB_NAME, CURRENT_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`Migrating database from v${oldVersion} to v${newVersion}`);

      // Run migrations sequentially
      for (let version = oldVersion + 1; version <= newVersion; version++) {
        migrationHandlers[version]?.(db, transaction);
      }
    },

    blocked() {
      console.warn('Database upgrade blocked');
      // Notify user to close other tabs
    },

    blocking() {
      console.warn('This connection is blocking a database upgrade');
      // Close and reopen connection
    },

    terminated() {
      console.error('Database connection terminated unexpectedly');
      // Attempt reconnection
    }
  });
}

const migrationHandlers = {
  1: (db: IDBPDatabase<HSASongbookDB>) => {
    // Version 1: Initial schema
    if (!db.objectStoreNames.contains('songs')) {
      const songsStore = db.createObjectStore('songs', { keyPath: 'id' });
      songsStore.createIndex('by-title', 'title');
      songsStore.createIndex('by-artist', 'artist');
      songsStore.createIndex('by-sync-status', 'syncStatus');
    }

    if (!db.objectStoreNames.contains('arrangements')) {
      const arrangementsStore = db.createObjectStore('arrangements', { keyPath: 'id' });
      arrangementsStore.createIndex('by-song', 'songId');
      arrangementsStore.createIndex('by-key', 'key');
      arrangementsStore.createIndex('by-rating', ['metadata', 'ratings', 'average']);
    }

    if (!db.objectStoreNames.contains('setlists')) {
      const setlistsStore = db.createObjectStore('setlists', { keyPath: 'id' });
      setlistsStore.createIndex('by-name', 'name');
      setlistsStore.createIndex('by-updated', 'updatedAt');
    }
  },

  2: async (db: IDBPDatabase<HSASongbookDB>, transaction: any) => {
    // Version 2: Add sync queue and compound indexes
    if (!db.objectStoreNames.contains('syncQueue')) {
      const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
      syncQueueStore.createIndex('by-type', 'type');
      syncQueueStore.createIndex('by-timestamp', 'timestamp');
      syncQueueStore.createIndex('by-retry-count', 'retryCount');
    }

    // Add compound indexes for better query performance
    const arrangementsStore = transaction.objectStore('arrangements');
    if (!arrangementsStore.indexNames.contains('by-song-rating')) {
      arrangementsStore.createIndex('by-song-rating', ['songId', 'metadata.ratings.average']);
    }

    // Migrate existing data to add sync status
    await migrateExistingDataForSyncStatus(transaction);
  },

  3: (db: IDBPDatabase<HSASongbookDB>, transaction: any) => {
    // Version 3: Add popularity tracking and preferences
    if (!db.objectStoreNames.contains('preferences')) {
      db.createObjectStore('preferences', { keyPath: 'key' });
    }

    // Add popularity indexes
    const songsStore = transaction.objectStore('songs');
    if (!songsStore.indexNames.contains('by-popularity')) {
      songsStore.createIndex('by-popularity', 'metadata.popularity');
    }

    const arrangementsStore = transaction.objectStore('arrangements');
    if (!arrangementsStore.indexNames.contains('by-popularity')) {
      arrangementsStore.createIndex('by-popularity', 'metadata.popularity');
    }
    if (!arrangementsStore.indexNames.contains('by-song-popularity')) {
      arrangementsStore.createIndex('by-song-popularity', ['songId', 'metadata.popularity']);
    }

    // Add performance date index for setlists
    const setlistsStore = transaction.objectStore('setlists');
    if (!setlistsStore.indexNames.contains('by-performance-date')) {
      setlistsStore.createIndex('by-performance-date', 'metadata.performanceDate');
    }
  }
};

async function migrateExistingDataForSyncStatus(transaction: any): Promise<void> {
  // Migrate songs
  const songsStore = transaction.objectStore('songs');
  const songsCursor = await songsStore.openCursor();

  if (songsCursor) {
    for await (const cursor of songsCursor) {
      if (!cursor.value.syncStatus) {
        const updated = {
          ...cursor.value,
          syncStatus: 'synced',
          version: 1
        };
        await cursor.update(updated);
      }
    }
  }

  // Similar for arrangements and setlists...
}
```

## Data Operations

### Repository Pattern Implementation
```typescript
class SongRepository {
  constructor(private db: IDBPDatabase<HSASongbookDB>) {}

  async getById(id: string): Promise<Song | undefined> {
    return this.db.get('songs', id);
  }

  async getByArtist(artist: string): Promise<Song[]> {
    return this.db.getAllFromIndex('songs', 'by-artist', artist);
  }

  async searchByTitle(query: string): Promise<Song[]> {
    const tx = this.db.transaction('songs', 'readonly');
    const index = tx.store.index('by-title');
    const results: Song[] = [];

    // Case-insensitive search using cursor
    let cursor = await index.openCursor();
    while (cursor) {
      if (cursor.value.title.toLowerCase().includes(query.toLowerCase())) {
        results.push(cursor.value);
      }
      cursor = await cursor.continue();
    }

    return results;
  }

  async save(song: Song): Promise<void> {
    song.updatedAt = new Date();
    song.syncStatus = 'pending';
    song.version = (song.version || 0) + 1;

    await this.db.put('songs', song);
    await this.queueForSync('song', 'update', song.id);
  }

  async bulkSave(songs: Song[]): Promise<void> {
    const tx = this.db.transaction('songs', 'readwrite');

    await Promise.all(
      songs.map(song => {
        song.updatedAt = new Date();
        song.syncStatus = 'pending';
        return tx.store.put(song);
      })
    );

    await tx.done;
  }

  private async queueForSync(type: string, operation: string, entityId: string): Promise<void> {
    const syncItem: SyncQueueItem = {
      id: `${type}-${operation}-${entityId}-${Date.now()}`,
      type: type as any,
      operation: operation as any,
      entityId,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3
    };

    await this.db.put('syncQueue', syncItem);
  }
}
```

## Performance Optimizations

### Indexing Strategy
1. **Single-field indexes** for common queries (title, artist)
2. **Compound indexes** for complex queries (songId + rating)
3. **Avoid over-indexing** - each index increases write time

### Query Optimization
```typescript
// Efficient: Use index
const popularSongs = await db.getAllFromIndex('songs', 'by-popularity');

// Efficient: Use compound index for sorting
const topArrangements = await db.getAllFromIndex(
  'arrangements',
  'by-song-rating',
  IDBKeyRange.bound([songId, 0], [songId, 5])
);

// Inefficient: Avoid full table scans
// DON'T: const filtered = (await db.getAll('songs')).filter(s => s.popularity > 4);
```

### Batch Operations
```typescript
async function batchUpdate(updates: Partial<Song>[]): Promise<void> {
  const tx = db.transaction('songs', 'readwrite');
  const store = tx.store;

  // Process in parallel within transaction
  await Promise.all(
    updates.map(async update => {
      const existing = await store.get(update.id);
      if (existing) {
        await store.put({ ...existing, ...update });
      }
    })
  );

  await tx.done;
}
```

## Storage Management

### Quota Monitoring
```typescript
async function checkStorageHealth(): Promise<{
  used: number;
  available: number;
  percentage: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      available: estimate.quota || 0,
      percentage: (estimate.usage || 0) / (estimate.quota || 1) * 100
    };
  }
  return { used: 0, available: 0, percentage: 0 };
}
```

### Data Pruning Strategy
```typescript
async function pruneOldData(daysToKeep: number = 30): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const tx = db.transaction(['arrangements', 'songs'], 'readwrite');

  // Remove old arrangements not in setlists
  const arrangements = await tx.objectStore('arrangements').index('by-updated').getAll(
    IDBKeyRange.upperBound(cutoffDate)
  );

  for (const arrangement of arrangements) {
    const inSetlist = await isArrangementInAnySetlist(arrangement.id);
    if (!inSetlist) {
      await tx.objectStore('arrangements').delete(arrangement.id);
    }
  }

  await tx.done;
}
```

## Best Practices

### DO:
- ✅ Use transactions for related operations
- ✅ Create appropriate indexes for queries
- ✅ Handle migration failures gracefully
- ✅ Monitor storage quota
- ✅ Implement data pruning strategies
- ✅ Use typed schemas with TypeScript

### DON'T:
- ❌ Create too many indexes (slows writes)
- ❌ Perform large operations outside transactions
- ❌ Ignore browser storage limits
- ❌ Store large blobs without compression
- ❌ Skip error handling in migrations

## References
- [idb Library Documentation](https://github.com/jakearchibald/idb)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Storage Quotas](https://web.dev/articles/storage-for-the-web)