// Database schema migrations for HSA Songbook IndexedDB
// Based on patterns from PRPs/ai_docs/indexeddb-schema-migrations.md

// Migration history
const MIGRATIONS = {
  1: 'Initial schema with songs, arrangements, and setlists',
  2: 'Add sync queue and compound indexes for better performance',
  3: 'Add popularity tracking, preferences store, and performance date index'
};

/**
 * Get the current database version
 * @returns {number} Current version number
 */
export function getCurrentVersion() {
  return 3;
}

/**
 * Run database migrations sequentially
 * @param {IDBDatabase} db - Database instance
 * @param {number} oldVersion - Previous version
 * @param {number} newVersion - Target version
 * @param {IDBTransaction} transaction - Upgrade transaction
 */
export function runMigrations(db, oldVersion, newVersion, transaction) {
  console.log(`Running migrations from v${oldVersion} to v${newVersion}`);

  // Run migrations sequentially
  for (let version = oldVersion + 1; version <= newVersion; version++) {
    const migrationHandler = migrationHandlers[version];
    if (migrationHandler) {
      console.log(`Applying migration v${version}: ${MIGRATIONS[version]}`);
      migrationHandler(db, transaction);
    } else {
      console.warn(`No migration handler found for version ${version}`);
    }
  }
}

/**
 * Migration handlers for each version
 */
const migrationHandlers = {
  1: createInitialSchema,
  2: addSyncQueueAndIndexes,
  3: addPopularityAndPreferences
};

/**
 * Version 1: Initial schema with songs, arrangements, and setlists
 * @param {IDBDatabase} db - Database instance
 */
function createInitialSchema(db) {
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
 * @param {IDBDatabase} db - Database instance
 * @param {IDBTransaction} transaction - Upgrade transaction
 */
function addSyncQueueAndIndexes(db, transaction) {
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
 * @param {IDBDatabase} db - Database instance
 * @param {IDBTransaction} transaction - Upgrade transaction
 */
function addPopularityAndPreferences(db, transaction) {
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
 * @param {IDBTransaction} transaction - Upgrade transaction
 */
async function migrateExistingDataForSyncStatus(transaction) {
  const stores = ['songs', 'arrangements', 'setlists'];

  for (const storeName of stores) {
    try {
      const store = transaction.objectStore(storeName);
      const request = store.openCursor();

      request.onsuccess = function(event) {
        const cursor = event.target.result;
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
 * @param {IDBTransaction} transaction - Upgrade transaction
 */
async function migrateExistingDataForPopularity(transaction) {
  try {
    const arrangementsStore = transaction.objectStore('arrangements');
    const request = arrangementsStore.openCursor();

    request.onsuccess = function(event) {
      const cursor = event.target.result;
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
 * Validate database schema after migration
 * @param {IDBDatabase} db - Database instance
 * @returns {boolean} True if schema is valid
 */
export function validateSchema(db) {
  const requiredStores = ['songs', 'arrangements', 'setlists', 'syncQueue', 'preferences'];
  // const requiredIndexes = {
  //   songs: ['by-title', 'by-artist', 'by-sync-status', 'by-updated', 'by-popularity'],
  //   arrangements: ['by-song', 'by-key', 'by-rating', 'by-sync-status', 'by-popularity', 'by-song-rating', 'by-song-popularity'],
  //   setlists: ['by-name', 'by-updated', 'by-sync-status', 'by-performance-date'],
  //   syncQueue: ['by-type', 'by-timestamp', 'by-retry-count']
  // };

  // Check all required stores exist
  for (const storeName of requiredStores) {
    if (!db.objectStoreNames.contains(storeName)) {
      console.error(`Missing required store: ${storeName}`);
      return false;
    }
  }

  // Note: Index validation would need to be done in a transaction
  // This is a basic store validation only
  console.log('Database schema validation passed (stores only)');
  return true;
}