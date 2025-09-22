// Data cleanup utilities for managing IndexedDB storage
// Provides LRU cache eviction, old data pruning, and orphaned record cleanup

import { getDatabase } from './database.js';
import { STORAGE_CONFIG } from '../config/storage.js';
import logger from '@/lib/logger';

/**
 * CleanupManager provides utilities for cleaning up database storage
 */
export class CleanupManager {
  constructor() {
    this.MIN_ITEMS_TO_KEEP = STORAGE_CONFIG.MIN_ITEMS_TO_KEEP
    this.MAX_AGE_DAYS = STORAGE_CONFIG.MAX_DATA_AGE_DAYS
    this.BATCH_SIZE = STORAGE_CONFIG.CLEANUP_BATCH_SIZE
  }

  /**
   * Perform comprehensive cleanup of old data
   * @param {IDBDatabase} db - Database instance
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanupOldData(db) {
    if (!db) {
      db = await getDatabase()
    }

    const cutoffDate = Date.now() - (this.MAX_AGE_DAYS * 24 * 60 * 60 * 1000)
    const stores = ['songs', 'arrangements', 'setlists']
    const results = {
      totalCleaned: 0,
      byStore: {},
      errors: []
    }

    for (const storeName of stores) {
      if (!db.objectStoreNames.contains(storeName)) {
        continue
      }

      try {
        const storeResults = await this.cleanupStore(db, storeName, cutoffDate)
        results.byStore[storeName] = storeResults
        results.totalCleaned += storeResults.cleaned
      } catch (error) {
        logger.error(`Error cleaning ${storeName}:`, error)
        results.errors.push({
          store: storeName,
          error: error.message
        })
      }
    }

    logger.log(`Total items cleaned: ${results.totalCleaned}`)
    return results
  }

  /**
   * Cleanup a specific store
   * @param {IDBDatabase} db - Database instance
   * @param {string} storeName - Store to clean
   * @param {number} cutoffDate - Cutoff date timestamp
   * @returns {Promise<Object>} Store cleanup results
   */
  async cleanupStore(db, storeName, cutoffDate) {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const items = await store.getAll()

    let cleaned = 0
    let kept = 0
    let errors = []

    // Sort by last access time to keep most recent
    const sortedItems = items.sort((a, b) =>
      (b.lastAccessedAt || b.updatedAt || 0) - (a.lastAccessedAt || a.updatedAt || 0)
    )

    // Determine which items to delete
    const toDelete = []
    for (let i = 0; i < sortedItems.length; i++) {
      const item = sortedItems[i]

      // Always keep minimum number of items
      if (kept < this.MIN_ITEMS_TO_KEEP) {
        kept++
        continue
      }

      // Keep favorites and pinned items
      if (item.isFavorite || item.isPinned) {
        kept++
        continue
      }

      // Keep recently accessed items
      const lastAccessed = item.lastAccessedAt ||
                          Date.parse(item.updatedAt) ||
                          Date.parse(item.createdAt) ||
                          0

      if (lastAccessed > cutoffDate) {
        kept++
        continue
      }

      // Keep items with pending sync
      if (item.syncStatus === 'pending') {
        kept++
        continue
      }

      // Mark for deletion
      toDelete.push(item.id)
    }

    // Delete in batches
    for (let i = 0; i < toDelete.length; i += this.BATCH_SIZE) {
      const batch = toDelete.slice(i, i + this.BATCH_SIZE)
      try {
        const batchTx = db.transaction(storeName, 'readwrite')
        await Promise.all(
          batch.map(id => batchTx.objectStore(storeName).delete(id))
        )
        await batchTx.done
        cleaned += batch.length
      } catch (error) {
        logger.error(`Error deleting batch in ${storeName}:`, error)
        errors.push({
          batch: i / this.BATCH_SIZE,
          error: error.message
        })
      }
    }

    return {
      total: items.length,
      cleaned,
      kept,
      errors
    }
  }

  /**
   * Cleanup sync queue
   * @param {IDBDatabase} db - Database instance
   * @returns {Promise<number>} Number of items cleaned
   */
  async cleanupSyncQueue(db) {
    if (!db) {
      db = await getDatabase()
    }

    if (!db.objectStoreNames.contains('syncQueue')) {
      return 0
    }

    const tx = db.transaction('syncQueue', 'readwrite')
    const store = tx.objectStore('syncQueue')
    const items = await store.getAll()

    const maxAge = STORAGE_CONFIG.MAX_SYNC_QUEUE_AGE_DAYS * 24 * 60 * 60 * 1000
    const cutoffDate = Date.now() - maxAge
    let cleaned = 0

    // Remove old items and items with too many retries
    const toDelete = items.filter(item =>
      item.timestamp < cutoffDate ||
      (item.retryCount && item.retryCount > 5)
    )

    for (const item of toDelete) {
      await store.delete(item.id)
      cleaned++
    }

    await tx.done
    logger.log(`Cleaned ${cleaned} items from sync queue`)
    return cleaned
  }

  /**
   * Find and remove orphaned records
   * @param {IDBDatabase} db - Database instance
   * @returns {Promise<Object>} Orphaned records cleanup results
   */
  async findAndRemoveOrphanedRecords(db) {
    if (!db) {
      db = await getDatabase()
    }

    const results = {
      found: [],
      removed: 0,
      errors: []
    }

    try {
      // Check if stores exist
      if (!db.objectStoreNames.contains('arrangements') ||
          !db.objectStoreNames.contains('songs')) {
        return results
      }

      // Get all arrangements and songs
      const arrangements = await db.getAll('arrangements')
      const songs = await db.getAll('songs')
      const songIds = new Set(songs.map(s => s.id))

      // Find orphaned arrangements (arrangements without songs)
      for (const arr of arrangements) {
        if (!songIds.has(arr.songId)) {
          results.found.push({
            type: 'arrangement',
            id: arr.id,
            reason: `Song ${arr.songId} not found`
          })

          // Delete orphaned arrangement
          try {
            const tx = db.transaction('arrangements', 'readwrite')
            await tx.objectStore('arrangements').delete(arr.id)
            await tx.done
            results.removed++
          } catch (error) {
            results.errors.push({
              id: arr.id,
              error: error.message
            })
          }
        }
      }

      // Check for orphaned setlist items
      if (db.objectStoreNames.contains('setlists')) {
        const setlists = await db.getAll('setlists')
        const arrangementIds = new Set(arrangements.map(a => a.id))

        for (const setlist of setlists) {
          if (setlist.arrangementIds && Array.isArray(setlist.arrangementIds)) {
            const validArrangements = setlist.arrangementIds.filter(id =>
              arrangementIds.has(id)
            )

            // Update setlist if some arrangements were removed
            if (validArrangements.length < setlist.arrangementIds.length) {
              const orphanedCount = setlist.arrangementIds.length - validArrangements.length
              results.found.push({
                type: 'setlist-items',
                id: setlist.id,
                reason: `${orphanedCount} arrangements not found`,
                action: 'updated'
              })

              // Update the setlist
              setlist.arrangementIds = validArrangements
              const tx = db.transaction('setlists', 'readwrite')
              await tx.objectStore('setlists').put(setlist)
              await tx.done
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error finding orphaned records:', error)
      results.errors.push({
        general: error.message
      })
    }

    logger.log(`Found ${results.found.length} orphaned records, removed ${results.removed}`)
    return results
  }

  /**
   * Get LRU items from a store
   * @param {IDBDatabase} db - Database instance
   * @param {string} storeName - Store name
   * @param {number} count - Number of LRU items to get
   * @returns {Promise<Array>} LRU items
   */
  async getLRUItems(db, storeName, count) {
    if (!db) {
      db = await getDatabase()
    }

    if (!db.objectStoreNames.contains(storeName)) {
      return []
    }

    const items = await db.getAll(storeName)

    // Sort by last access time (oldest first)
    return items
      .filter(item => !item.isFavorite && !item.isPinned)
      .sort((a, b) =>
        (a.lastAccessedAt || 0) - (b.lastAccessedAt || 0)
      )
      .slice(0, count)
  }

  /**
   * Remove specific items by ID
   * @param {IDBDatabase} db - Database instance
   * @param {string} storeName - Store name
   * @param {Array} ids - Item IDs to remove
   * @returns {Promise<number>} Number of items removed
   */
  async removeItems(db, storeName, ids) {
    if (!db) {
      db = await getDatabase()
    }

    if (!db.objectStoreNames.contains(storeName) || !ids || ids.length === 0) {
      return 0
    }

    let removed = 0
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)

    for (const id of ids) {
      try {
        await store.delete(id)
        removed++
      } catch (error) {
        logger.error(`Error deleting ${id} from ${storeName}:`, error)
      }
    }

    await tx.done
    return removed
  }

  /**
   * Get cleanup recommendations based on current storage
   * @param {Object} storageQuota - Storage quota information
   * @param {Object} databaseStats - Database statistics
   * @returns {Array<Object>} Cleanup recommendations
   */
  getCleanupRecommendations(storageQuota, databaseStats) {
    const recommendations = []

    if (!storageQuota || !storageQuota.supported) {
      return recommendations
    }

    const usagePercentage = storageQuota.percentage

    // Different recommendations based on usage
    if (usagePercentage > 0.95) {
      recommendations.push({
        priority: 'critical',
        action: 'immediate-cleanup',
        message: 'Storage critically full. Immediate cleanup required.',
        estimatedGain: '10-20%'
      })
    }

    if (usagePercentage > 0.90) {
      recommendations.push({
        priority: 'high',
        action: 'cleanup-old-data',
        message: 'Remove data older than 90 days',
        estimatedGain: '5-10%'
      })
    }

    if (usagePercentage > 0.80) {
      recommendations.push({
        priority: 'medium',
        action: 'cleanup-sync-queue',
        message: 'Clear old sync queue items',
        estimatedGain: '2-5%'
      })
    }

    // Check for specific issues
    if (databaseStats) {
      if (databaseStats.syncQueue > 100) {
        recommendations.push({
          priority: 'medium',
          action: 'cleanup-sync-queue',
          message: `Large sync queue (${databaseStats.syncQueue} items)`,
          estimatedGain: '1-3%'
        })
      }

      const totalRecords = Object.values(databaseStats).reduce((a, b) => a + b, 0)
      if (totalRecords > 1000) {
        recommendations.push({
          priority: 'low',
          action: 'cleanup-unused',
          message: 'Consider removing unused songs and arrangements',
          estimatedGain: '5-15%'
        })
      }
    }

    return recommendations
  }

  /**
   * Perform automatic cleanup based on storage status
   * @param {string} status - Storage status (healthy, warning, critical)
   * @returns {Promise<Object>} Cleanup results
   */
  async performAutoCleanup(status) {
    const results = {
      performed: false,
      actions: [],
      totalCleaned: 0,
      errors: []
    }

    if (!STORAGE_CONFIG.ENABLE_AUTO_CLEANUP) {
      return results
    }

    const db = await getDatabase()

    try {
      if (status === 'critical') {
        // Aggressive cleanup
        results.performed = true

        // 1. Clean sync queue
        const syncCleaned = await this.cleanupSyncQueue(db)
        results.actions.push({
          action: 'cleanup-sync-queue',
          cleaned: syncCleaned
        })
        results.totalCleaned += syncCleaned

        // 2. Remove orphaned records
        const orphaned = await this.findAndRemoveOrphanedRecords(db)
        results.actions.push({
          action: 'remove-orphaned',
          cleaned: orphaned.removed
        })
        results.totalCleaned += orphaned.removed

        // 3. Clean old data (30 days for critical)
        const oldDataResults = await this.cleanupOldData(db)
        results.actions.push({
          action: 'cleanup-old-data',
          cleaned: oldDataResults.totalCleaned
        })
        results.totalCleaned += oldDataResults.totalCleaned

      } else if (status === 'warning') {
        // Moderate cleanup
        results.performed = true

        // 1. Clean sync queue
        const syncCleaned = await this.cleanupSyncQueue(db)
        results.actions.push({
          action: 'cleanup-sync-queue',
          cleaned: syncCleaned
        })
        results.totalCleaned += syncCleaned

        // 2. Remove orphaned records
        const orphaned = await this.findAndRemoveOrphanedRecords(db)
        results.actions.push({
          action: 'remove-orphaned',
          cleaned: orphaned.removed
        })
        results.totalCleaned += orphaned.removed
      }
    } catch (error) {
      logger.error('Error during auto cleanup:', error)
      results.errors.push(error.message)
    }

    if (results.performed) {
      logger.log(`Auto cleanup completed: ${results.totalCleaned} items removed`)
    }

    return results
  }
}

// Export singleton instance
export const cleanupManager = new CleanupManager()