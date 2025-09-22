// IndexedDB setup with idb library for HSA Songbook PWA
import { openDB } from 'idb';
import { runMigrations } from './migrations.js';

const DB_NAME = 'HSASongbookDB';
const CURRENT_VERSION = 3;

let dbInstance = null;

// Database schema interface for TypeScript-like documentation
/**
 * HSASongbookDB Schema:
 *
 * songs: {
 *   key: string (id)
 *   value: Song object
 *   indexes: by-title, by-artist, by-sync-status, by-updated, by-popularity
 * }
 *
 * arrangements: {
 *   key: string (id)
 *   value: Arrangement object
 *   indexes: by-song, by-key, by-rating, by-popularity, by-sync-status, by-song-rating, by-song-popularity
 * }
 *
 * setlists: {
 *   key: string (id)
 *   value: Setlist object
 *   indexes: by-name, by-sync-status, by-updated, by-performance-date
 * }
 *
 * syncQueue: {
 *   key: string (id)
 *   value: SyncQueueItem object
 *   indexes: by-type, by-timestamp, by-retry-count
 * }
 *
 * preferences: {
 *   key: string
 *   value: { key: string, value: any, updatedAt: Date }
 * }
 */

/**
 * Initialize the IndexedDB database with proper schema and migrations
 * @returns {Promise<IDBDatabase>} Database instance
 */
export async function initDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await openDB(DB_NAME, CURRENT_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Migrating HSA Songbook database from v${oldVersion} to v${newVersion}`);
        runMigrations(db, oldVersion, newVersion, transaction);
      },

      blocked() {
        console.warn('Database upgrade blocked. Please close other tabs and try again.');
        // Notify user to close other tabs
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('db-blocked', {
            detail: { message: 'Database upgrade blocked. Please close other tabs.' }
          }));
        }
      },

      blocking() {
        console.warn('This connection is blocking a database upgrade. Closing...');
        // Close and reopen connection
        if (dbInstance) {
          dbInstance.close();
          dbInstance = null;
        }
      },

      terminated() {
        console.error('Database connection terminated unexpectedly');
        dbInstance = null;
        // Attempt reconnection
        setTimeout(() => initDatabase(), 1000);
      }
    });

    console.log('HSA Songbook database initialized successfully');
    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get the current database instance
 * @returns {Promise<IDBDatabase>} Database instance
 */
export async function getDatabase() {
  if (!dbInstance) {
    return await initDatabase();
  }
  return dbInstance;
}

/**
 * Close the database connection
 */
export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Check database health and storage quota
 * @returns {Promise<Object>} Storage health metrics
 */
export async function checkStorageHealth() {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: estimate.quota || 0,
        percentage: (estimate.usage || 0) / (estimate.quota || 1) * 100,
        healthy: (estimate.usage || 0) / (estimate.quota || 1) < 0.8 // Under 80% usage
      };
    }
    return { used: 0, available: 0, percentage: 0, healthy: true };
  } catch (error) {
    console.error('Error checking storage health:', error);
    return { used: 0, available: 0, percentage: 0, healthy: false };
  }
}

/**
 * Clear all data from the database (for testing/development)
 * @returns {Promise<void>}
 */
export async function clearDatabase() {
  const db = await getDatabase();
  const stores = ['songs', 'arrangements', 'setlists', 'syncQueue', 'preferences'];

  const tx = db.transaction(stores, 'readwrite');

  await Promise.all(stores.map(storeName => {
    if (db.objectStoreNames.contains(storeName)) {
      return tx.objectStore(storeName).clear();
    }
    return Promise.resolve();
  }));

  await tx.done;
  console.log('Database cleared successfully');
}

/**
 * Get database statistics
 * @returns {Promise<Object>} Database statistics
 */
export async function getDatabaseStats() {
  const db = await getDatabase();
  const stores = ['songs', 'arrangements', 'setlists', 'syncQueue'];
  const stats = {};

  for (const storeName of stores) {
    if (db.objectStoreNames.contains(storeName)) {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const count = await store.count();
      stats[storeName] = count;
    } else {
      stats[storeName] = 0;
    }
  }

  return stats;
}