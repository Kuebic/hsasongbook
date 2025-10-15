// Database schema migrations for HSA Songbook IndexedDB
// Based on patterns from PRPs/ai_docs/indexeddb-schema-migrations.md

import { IDBPDatabase, IDBPTransaction } from 'idb';
import logger from '@/lib/logger';
import type { HSASongbookDB } from '@/types/Database.types';

// Migration history
const MIGRATIONS: Record<number, string> = {
  1: 'Initial schema with songs, arrangements, and setlists',
  2: 'Add sync queue and compound indexes for better performance',
  3: 'Add popularity tracking, preferences store, and performance date index',
  4: 'Add chordproDrafts store for ChordPro editor auto-save',
  5: 'Add slug indexes for URL-friendly song and arrangement slugs',
  6: 'Add lastAccessedAt indexes for recent views tracking',
  7: 'Add sessions store for Supabase auth session persistence (Phase 5)'
};

/**
 * Get the current database version
 */
export function getCurrentVersion(): number {
  return 7;
}

/**
 * Run database migrations sequentially
 */
export function runMigrations(
  db: IDBPDatabase<HSASongbookDB>,
  oldVersion: number,
  newVersion: number | null,
  transaction: IDBPTransaction<HSASongbookDB, ArrayLike<keyof HSASongbookDB>, 'versionchange'>
): void {
  logger.log(`Running migrations from v${oldVersion} to v${newVersion ?? 'unknown'}`);

  // Run migrations sequentially
  const targetVersion = newVersion ?? getCurrentVersion();
  for (let version = oldVersion + 1; version <= targetVersion; version++) {
    const migrationHandler = migrationHandlers[version];
    if (migrationHandler) {
      logger.log(`Applying migration v${version}: ${MIGRATIONS[version]}`);
      migrationHandler(db, transaction);
    } else {
      logger.warn(`No migration handler found for version ${version}`);
    }
  }
}

type MigrationHandler = (
  db: IDBPDatabase<HSASongbookDB>,
  transaction: IDBPTransaction<HSASongbookDB, ArrayLike<keyof HSASongbookDB>, 'versionchange'>
) => void;

/**
 * Migration handlers for each version
 */
const migrationHandlers: Record<number, MigrationHandler> = {
  1: createInitialSchema,
  2: addSyncQueueAndIndexes,
  3: addPopularityAndPreferences,
  4: createChordproDraftsStore,
  5: addSlugIndexes,
  6: addLastAccessedIndexes,
  7: createSessionsStore
};

/**
 * Version 1: Initial schema with songs, arrangements, and setlists
 */
function createInitialSchema(db: IDBPDatabase<HSASongbookDB>): void {
  // Songs store
  if (!db.objectStoreNames.contains('songs')) {
    const songsStore = db.createObjectStore('songs', { keyPath: 'id' });
    songsStore.createIndex('by-title', 'title', { unique: false });
    songsStore.createIndex('by-artist', 'artist', { unique: false });
    songsStore.createIndex('by-sync-status', 'syncStatus', { unique: false });
    songsStore.createIndex('by-updated', 'updatedAt', { unique: false });
  }

  // Arrangements store
  if (!db.objectStoreNames.contains('arrangements')) {
    const arrangementsStore = db.createObjectStore('arrangements', { keyPath: 'id' });
    arrangementsStore.createIndex('by-song', 'songId', { unique: false });
    arrangementsStore.createIndex('by-key', 'key', { unique: false });
    arrangementsStore.createIndex('by-rating', 'rating', { unique: false });
    arrangementsStore.createIndex('by-sync-status', 'syncStatus', { unique: false });
  }

  // Setlists store
  if (!db.objectStoreNames.contains('setlists')) {
    const setlistsStore = db.createObjectStore('setlists', { keyPath: 'id' });
    setlistsStore.createIndex('by-name', 'name', { unique: false });
    setlistsStore.createIndex('by-updated', 'updatedAt', { unique: false });
    setlistsStore.createIndex('by-sync-status', 'syncStatus', { unique: false });
  }
}

/**
 * Version 2: Add sync queue and compound indexes for better performance
 */
function addSyncQueueAndIndexes(
  db: IDBPDatabase<HSASongbookDB>,
  transaction: IDBPTransaction<HSASongbookDB, ArrayLike<keyof HSASongbookDB>, 'versionchange'>
): void {
  // Create sync queue store
  if (!db.objectStoreNames.contains('syncQueue')) {
    const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
    syncQueueStore.createIndex('by-type', 'type', { unique: false });
    syncQueueStore.createIndex('by-timestamp', 'timestamp', { unique: false });
    syncQueueStore.createIndex('by-retry-count', 'retryCount', { unique: false });
  }

  // Add compound indexes for better query performance
  const arrangementsStore = transaction.objectStore('arrangements');
  if (!arrangementsStore.indexNames.contains('by-song-rating')) {
    // Use array for compound index: [songId, rating]
    arrangementsStore.createIndex('by-song-rating', ['songId', 'rating'], { unique: false });
  }

  // Migrate existing data to add sync status
  migrateExistingDataForSyncStatus(transaction);
}

/**
 * Version 3: Add popularity tracking, preferences store, and performance date index
 */
function addPopularityAndPreferences(
  db: IDBPDatabase<HSASongbookDB>,
  transaction: IDBPTransaction<HSASongbookDB, ArrayLike<keyof HSASongbookDB>, 'versionchange'>
): void {
  // Create preferences store
  if (!db.objectStoreNames.contains('preferences')) {
    db.createObjectStore('preferences', { keyPath: 'key' });
  }

  // Add popularity indexes to songs
  const songsStore = transaction.objectStore('songs');
  if (!songsStore.indexNames.contains('by-popularity')) {
    songsStore.createIndex('by-popularity', 'popularity', { unique: false });
  }

  // Add popularity indexes to arrangements
  const arrangementsStore = transaction.objectStore('arrangements');
  if (!arrangementsStore.indexNames.contains('by-popularity')) {
    arrangementsStore.createIndex('by-popularity', 'favorites', { unique: false });
  }
  if (!arrangementsStore.indexNames.contains('by-song-popularity')) {
    arrangementsStore.createIndex('by-song-popularity', ['songId', 'favorites'], { unique: false });
  }

  // Add performance date index for setlists
  const setlistsStore = transaction.objectStore('setlists');
  if (!setlistsStore.indexNames.contains('by-performance-date')) {
    setlistsStore.createIndex('by-performance-date', 'performanceDate', { unique: false });
  }

  // Migrate existing arrangements data to include popularity from favorites
  migrateExistingDataForPopularity(transaction);
}

/**
 * Migrate existing data to add sync status (for v2 migration)
 */
function migrateExistingDataForSyncStatus(
  transaction: IDBPTransaction<HSASongbookDB, ArrayLike<keyof HSASongbookDB>, 'versionchange'>
): void {
  const stores: Array<'songs' | 'arrangements' | 'setlists'> = ['songs', 'arrangements', 'setlists'];

  for (const storeName of stores) {
    try {
      const store = transaction.objectStore(storeName);
      const request = store.openCursor();

      request.onsuccess = function(event: Event) {
        const target = event.target as IDBRequest;
        const cursor = target.result as IDBCursorWithValue | null;
        if (cursor) {
          const item = cursor.value;
          if (!item.syncStatus) {
            const updated = {
              ...item,
              syncStatus: 'synced',
              version: 1,
              updatedAt: item.updatedAt || new Date().toISOString()
            };
            cursor.update(updated);
          }
          cursor.continue();
        }
      };
    } catch (error) {
      console.error(`Error migrating ${storeName} data:`, error);
    }
  }
}

/**
 * Migrate existing arrangements to include popularity from favorites (for v3 migration)
 */
function migrateExistingDataForPopularity(
  transaction: IDBPTransaction<HSASongbookDB, ArrayLike<keyof HSASongbookDB>, 'versionchange'>
): void {
  try {
    const arrangementsStore = transaction.objectStore('arrangements');
    const request = arrangementsStore.openCursor();

    request.onsuccess = function(event: Event) {
      const target = event.target as IDBRequest;
      const cursor = target.result as IDBCursorWithValue | null;
      if (cursor) {
        const arrangement = cursor.value;
        // Use favorites as popularity if not already set
        if (typeof arrangement.popularity === 'undefined' && typeof arrangement.favorites === 'number') {
          const updated = {
            ...arrangement,
            popularity: arrangement.favorites
          };
          cursor.update(updated);
        }
        cursor.continue();
      }
    };
  } catch (error) {
    console.error('Error migrating arrangements popularity data:', error);
  }
}

/**
 * Version 4: Add chordproDrafts store for ChordPro editor auto-save
 */
function createChordproDraftsStore(db: IDBPDatabase<HSASongbookDB>): void {
  // Create chordproDrafts store for editor auto-save functionality
  if (!db.objectStoreNames.contains('chordproDrafts')) {
    const draftsStore = db.createObjectStore('chordproDrafts', { keyPath: 'id' });
    // Index for querying drafts by arrangement ID
    draftsStore.createIndex('arrangementId', 'arrangementId', { unique: false });
    logger.log('Created chordproDrafts object store with arrangementId index');
  }
}

/**
 * Version 5: Add slug indexes for URL-friendly slugs
 */
function addSlugIndexes(
  db: IDBPDatabase<HSASongbookDB>,
  transaction: IDBPTransaction<HSASongbookDB, ArrayLike<keyof HSASongbookDB>, 'versionchange'>
): void {
  // Add slug index to songs store
  const songsStore = transaction.objectStore('songs');
  if (!songsStore.indexNames.contains('by-slug')) {
    songsStore.createIndex('by-slug', 'slug', { unique: true });
    logger.log('Created by-slug index on songs store');
  }

  // Add slug index to arrangements store
  const arrangementsStore = transaction.objectStore('arrangements');
  if (!arrangementsStore.indexNames.contains('by-slug')) {
    arrangementsStore.createIndex('by-slug', 'slug', { unique: true });
    logger.log('Created by-slug index on arrangements store');
  }

  logger.log('Slug indexes added successfully');
}

/**
 * Version 6: Add lastAccessedAt indexes for recent views tracking
 */
function addLastAccessedIndexes(
  db: IDBPDatabase<HSASongbookDB>,
  transaction: IDBPTransaction<HSASongbookDB, ArrayLike<keyof HSASongbookDB>, 'versionchange'>
): void {
  // Add lastAccessedAt index to songs store
  const songsStore = transaction.objectStore('songs');
  if (!songsStore.indexNames.contains('by-last-accessed')) {
    songsStore.createIndex('by-last-accessed', 'lastAccessedAt', { unique: false });
    logger.log('Created by-last-accessed index on songs store');
  }

  // Add lastAccessedAt index to arrangements store
  const arrangementsStore = transaction.objectStore('arrangements');
  if (!arrangementsStore.indexNames.contains('by-last-accessed')) {
    arrangementsStore.createIndex('by-last-accessed', 'lastAccessedAt', { unique: false });
    logger.log('Created by-last-accessed index on arrangements store');
  }

  logger.log('lastAccessedAt indexes added successfully');
}

/**
 * Version 7: Add sessions store for Supabase auth session persistence (Phase 5)
 */
function createSessionsStore(
  db: IDBPDatabase<HSASongbookDB>,
  transaction: IDBPTransaction<HSASongbookDB, ArrayLike<keyof HSASongbookDB>, 'versionchange'>
): void {
  // Create sessions store for Supabase auth session persistence
  if (!db.objectStoreNames.contains('sessions')) {
    db.createObjectStore('sessions');
    logger.log('Created sessions object store for auth session persistence');
  }

  // Update preferences store to add userId index (Phase 5)
  // Note: Preferences store was created in v3 but without the userId index
  const preferencesStore = transaction.objectStore('preferences');
  if (!preferencesStore.indexNames.contains('by-user-id')) {
    preferencesStore.createIndex('by-user-id', 'userId', { unique: false });
    logger.log('Created by-user-id index on preferences store');
  }
}

/**
 * Validate database schema after migration
 */
export function validateSchema(db: IDBPDatabase<HSASongbookDB>): boolean {
  const requiredStores = ['songs', 'arrangements', 'setlists', 'syncQueue', 'preferences', 'chordproDrafts', 'sessions'];

  // Check all required stores exist
  for (const storeName of requiredStores) {
    if (!db.objectStoreNames.contains(storeName)) {
      console.error(`Missing required store: ${storeName}`);
      return false;
    }
  }

  // Note: Index validation would need to be done in a transaction
  // This is a basic store validation only
  logger.log('Database schema validation passed (stores only)');
  return true;
}
