// IndexedDB setup with idb library for HSA Songbook PWA
import { IDBPDatabase, openDB } from 'idb';
import { HSASongbookDB } from '@/types/Database.types';
import { runMigrations } from './migrations.js';
import logger from '@/lib/logger';
import { StorageManager } from '../utils/storageManager.js';
import { getConfig } from '@/lib/config/environment.js';

const config = getConfig();
const DB_NAME = config.database.name;
const CURRENT_VERSION = config.database.version;

let dbInstance: IDBPDatabase<HSASongbookDB> | null = null;
const storageManager = new StorageManager();

/**
 * Database statistics interface
 */
export interface DatabaseStats {
  songs: number;
  arrangements: number;
  setlists: number;
  syncQueue: number;
  [key: string]: number;
}

/**
 * Storage health information interface
 */
export interface StorageHealthInfo {
  supported: boolean;
  used: number;
  available: number;
  percentage: number;
  healthy: boolean;
  status?: string;
  databaseRecords?: DatabaseStats;
  recommendations?: string[];
  formattedUsage?: string;
  formattedQuota?: string;
  formattedAvailable?: string;
  message?: string;
  error?: string;
}

/**
 * Initialize the IndexedDB database with proper schema and migrations
 */
export async function initDatabase(): Promise<IDBPDatabase<HSASongbookDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await openDB<HSASongbookDB>(DB_NAME, CURRENT_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        logger.log(`Migrating HSA Songbook database from v${oldVersion} to v${newVersion}`);
        runMigrations(db, oldVersion, newVersion, transaction);
      },

      blocked() {
        logger.warn('Database upgrade blocked. Please close other tabs and try again.');
        // Notify user to close other tabs
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('db-blocked', {
            detail: { message: 'Database upgrade blocked. Please close other tabs.' }
          }));
        }
      },

      blocking() {
        logger.warn('This connection is blocking a database upgrade. Closing...');
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
        setTimeout(() => initDatabase(), config.database.reconnectionDelay);
      }
    });

    logger.log('HSA Songbook database initialized successfully');
    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get the current database instance
 */
export async function getDatabase(): Promise<IDBPDatabase<HSASongbookDB>> {
  if (!dbInstance) {
    return await initDatabase();
  }
  return dbInstance;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Check database health and storage quota
 */
export async function checkStorageHealth(): Promise<StorageHealthInfo> {
  try {
    const quota = await storageManager.getStorageQuota();
    const stats = await getDatabaseStats();

    if (!quota.supported) {
      return {
        supported: false,
        used: 0,
        available: 0,
        percentage: 0,
        healthy: true,
        message: 'Storage API not supported'
      };
    }

    return {
      supported: true,
      used: quota.usage,
      available: quota.available,
      percentage: quota.percentage * 100,
      healthy: quota.status !== 'critical',
      status: quota.status,
      databaseRecords: stats,
      recommendations: storageManager.getStorageRecommendations(quota.percentage, stats),
      formattedUsage: quota.formattedUsage,
      formattedQuota: quota.formattedQuota,
      formattedAvailable: quota.formattedAvailable
    };
  } catch (error) {
    logger.error('Error checking storage health:', error);
    return {
      supported: false,
      used: 0,
      available: 0,
      percentage: 0,
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Clear all data from the database (for testing/development)
 */
export async function clearDatabase(): Promise<void> {
  const db = await getDatabase();
  const stores: Array<keyof HSASongbookDB> = ['songs', 'arrangements', 'setlists', 'syncQueue', 'preferences'];

  const tx = db.transaction(stores, 'readwrite');

  await Promise.all(stores.map(storeName => {
    if (db.objectStoreNames.contains(storeName as string)) {
      return tx.objectStore(storeName).clear();
    }
    return Promise.resolve();
  }));

  await tx.done;
  logger.log('Database cleared successfully');
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<DatabaseStats> {
  const db = await getDatabase();
  const stores = ['songs', 'arrangements', 'setlists', 'syncQueue'] as const;
  const stats: DatabaseStats = {
    songs: 0,
    arrangements: 0,
    setlists: 0,
    syncQueue: 0
  };

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

/**
 * Check if there's enough quota before a write operation
 */
export async function checkQuotaBeforeWrite(estimatedSize: number) {
  return await storageManager.checkQuotaBeforeWrite(estimatedSize);
}

/**
 * Request persistent storage
 */
export async function requestPersistentStorage(): Promise<boolean> {
  return await storageManager.requestPersistentStorage();
}

/**
 * Get storage manager instance
 */
export function getStorageManager(): StorageManager {
  return storageManager;
}