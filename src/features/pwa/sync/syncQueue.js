// Sync queue for managing offline operations
// Based on patterns from PRPs/ai_docs/offline-sync-patterns.md

import { getDatabase } from '../db/database.js';

/**
 * SyncQueue manages operations that need to be synchronized when online
 */
export class SyncQueue {
  constructor() {
    this.processing = false;
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 second
    this.maxDelay = 30000; // 30 seconds
  }

  /**
   * Add an operation to the sync queue
   * @param {Object} item - Sync item
   * @param {string} item.type - Entity type (songs, arrangements, setlists)
   * @param {string} item.operation - Operation type (create, update, delete)
   * @param {string} item.entityId - Entity ID
   * @param {Object} item.data - Entity data
   * @returns {Promise<string>} Sync item ID
   */
  async enqueue(item) {
    const db = await getDatabase();
    const syncItem = {
      id: this.generateSyncId(item),
      type: item.type,
      operation: item.operation,
      entityId: item.entityId,
      data: item.data || null,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: this.maxRetries,
      lastError: null,
      status: 'pending' // pending, processing, completed, failed
    };

    await db.put('syncQueue', syncItem);
    console.log(`Queued ${item.operation} operation for ${item.type}:${item.entityId}`);

    // Trigger processing if online (don't await to avoid blocking)
    if (navigator.onLine) {
      this.processQueue().catch(error => {
        console.error('Error processing sync queue:', error);
      });
    }

    return syncItem.id;
  }

  /**
   * Process all items in the sync queue
   * @returns {Promise<void>}
   */
  async processQueue() {
    if (this.processing || !navigator.onLine) {
      return;
    }

    this.processing = true;
    console.log('Processing sync queue...');

    try {
      const items = await this.getQueueItems();
      console.log(`Found ${items.length} items to sync`);

      for (const item of items) {
        try {
          await this.processItem(item);
          await this.removeFromQueue(item.id);
          console.log(`Successfully synced ${item.type}:${item.entityId}`);
        } catch (error) {
          await this.handleSyncError(item, error);
        }
      }

      // Check if there are more items to process
      const remainingItems = await this.getQueueCount();
      if (remainingItems > 0 && navigator.onLine) {
        // Schedule next processing with exponential backoff
        const delay = this.getBackoffDelay();
        console.log(`Scheduling next sync attempt in ${delay}ms`);
        setTimeout(() => this.processQueue(), delay);
      }
    } catch (error) {
      console.error('Error processing sync queue:', error);
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process a single sync item
   * @param {Object} item - Sync item to process
   * @returns {Promise<void>}
   */
  async processItem(item) {
    // Mark as processing
    await this.updateItemStatus(item.id, 'processing');

    // Simulate API call (replace with actual API endpoints when available)
    // const endpoint = this.getApiEndpoint(item.type);

    switch (item.operation) {
      case 'create':
        await this.apiRequest();
        break;

      case 'update':
        await this.apiRequest();
        break;

      case 'delete':
        await this.apiRequest();
        break;

      default:
        throw new Error(`Unknown operation: ${item.operation}`);
    }

    // Mark as completed
    await this.updateItemStatus(item.id, 'completed');
  }

  /**
   * Make an API request (placeholder for actual implementation)
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @returns {Promise<Response>}
   */
  async apiRequest() {
    // For now, simulate API calls
    // In Phase 5, this will be replaced with actual Supabase API calls
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
      throw new Error('Simulated network error');
    }

    return { ok: true, status: 200 };
  }

  /**
   * Get API endpoint for entity type
   * @param {string} type - Entity type
   * @returns {string} API endpoint
   */
  getApiEndpoint(type) {
    const endpoints = {
      songs: '/api/songs',
      arrangements: '/api/arrangements',
      setlists: '/api/setlists'
    };
    return endpoints[type] || '/api/unknown';
  }

  /**
   * Handle sync error and implement retry logic
   * @param {Object} item - Sync item that failed
   * @param {Error} error - Error that occurred
   * @returns {Promise<void>}
   */
  async handleSyncError(item, error) {
    item.retryCount++;
    item.lastError = error.message;

    console.error(`Sync failed for ${item.type}:${item.entityId} (attempt ${item.retryCount}):`, error.message);

    if (item.retryCount >= item.maxRetries) {
      // Max retries reached - move to failed status
      console.error(`Max retries exceeded for ${item.type}:${item.entityId}`);
      await this.updateItemStatus(item.id, 'failed');
      await this.moveToDeadLetterQueue(item);
    } else {
      // Update retry count and reset to pending
      await this.updateQueueItem(item);
    }
  }

  /**
   * Move failed item to dead letter queue for manual resolution
   * @param {Object} item - Failed sync item
   * @returns {Promise<void>}
   */
  async moveToDeadLetterQueue(item) {
    const db = await getDatabase();
    const deadLetterItem = {
      ...item,
      id: `dead_${item.id}`,
      originalId: item.id,
      failedAt: new Date().toISOString(),
      status: 'dead'
    };

    // Store in preferences as dead letter queue (simple approach)
    const deadLetterQueue = await this.getDeadLetterQueue();
    deadLetterQueue.push(deadLetterItem);

    await db.put('preferences', {
      key: 'deadLetterQueue',
      value: deadLetterQueue,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Get dead letter queue items
   * @returns {Promise<Array>} Dead letter queue items
   */
  async getDeadLetterQueue() {
    const db = await getDatabase();
    const preference = await db.get('preferences', 'deadLetterQueue');
    return preference ? preference.value : [];
  }

  /**
   * Generate unique sync ID
   * @param {Object} item - Sync item
   * @returns {string} Unique sync ID
   */
  generateSyncId(item) {
    return `${item.type}-${item.operation}-${item.entityId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all pending sync queue items
   * @returns {Promise<Array>} Pending sync items
   */
  async getQueueItems() {
    const db = await getDatabase();
    const tx = db.transaction('syncQueue', 'readonly');
    const index = tx.store.index('by-timestamp');
    const items = [];

    let cursor = await index.openCursor();
    while (cursor) {
      if (cursor.value.status === 'pending') {
        items.push(cursor.value);
      }
      cursor = await cursor.continue();
    }

    return items.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Get count of items in sync queue
   * @returns {Promise<number>} Number of pending items
   */
  async getQueueCount() {
    const db = await getDatabase();
    const tx = db.transaction('syncQueue', 'readonly');
    const items = await tx.store.getAll();
    return items.filter(item => item.status === 'pending').length;
  }

  /**
   * Remove item from sync queue
   * @param {string} itemId - Sync item ID
   * @returns {Promise<void>}
   */
  async removeFromQueue(itemId) {
    const db = await getDatabase();
    await db.delete('syncQueue', itemId);
  }

  /**
   * Update sync item in queue
   * @param {Object} item - Updated sync item
   * @returns {Promise<void>}
   */
  async updateQueueItem(item) {
    const db = await getDatabase();
    await db.put('syncQueue', item);
  }

  /**
   * Update sync item status
   * @param {string} itemId - Sync item ID
   * @param {string} status - New status
   * @returns {Promise<void>}
   */
  async updateItemStatus(itemId, status) {
    const db = await getDatabase();
    const item = await db.get('syncQueue', itemId);
    if (item) {
      item.status = status;
      item.lastUpdated = new Date().toISOString();
      await db.put('syncQueue', item);
    }
  }

  /**
   * Calculate exponential backoff delay with jitter
   * @returns {number} Delay in milliseconds
   */
  getBackoffDelay() {
    const attempt = this.getAttemptCount();
    const exponentialDelay = Math.min(
      this.baseDelay * Math.pow(2, attempt),
      this.maxDelay
    );

    // Add jitter (±10%)
    const jitter = exponentialDelay * 0.1 * (Math.random() * 2 - 1);
    return Math.round(exponentialDelay + jitter);
  }

  /**
   * Get current attempt count for backoff calculation
   * @returns {number} Attempt count
   */
  getAttemptCount() {
    // Simple attempt counter - could be more sophisticated
    return Math.min(3, this.processing ? 1 : 0);
  }

  /**
   * Clear completed items from sync queue (cleanup)
   * @param {number} olderThanHours - Remove items older than this many hours
   * @returns {Promise<number>} Number of items removed
   */
  async cleanupQueue(olderThanHours = 24) {
    const db = await getDatabase();
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const tx = db.transaction('syncQueue', 'readwrite');
    const items = await tx.store.getAll();

    let removedCount = 0;
    for (const item of items) {
      const itemTime = new Date(item.timestamp);
      if (itemTime < cutoffTime && (item.status === 'completed' || item.status === 'failed')) {
        await tx.store.delete(item.id);
        removedCount++;
      }
    }

    await tx.done;
    console.log(`Cleaned up ${removedCount} old sync queue items`);
    return removedCount;
  }

  /**
   * Get sync queue statistics
   * @returns {Promise<Object>} Queue statistics
   */
  async getQueueStats() {
    const db = await getDatabase();
    const items = await db.getAll('syncQueue');

    const stats = {
      total: items.length,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      byType: {},
      byOperation: {}
    };

    items.forEach(item => {
      stats[item.status]++;

      // By type
      if (!stats.byType[item.type]) {
        stats.byType[item.type] = { total: 0, pending: 0, failed: 0 };
      }
      stats.byType[item.type].total++;
      if (item.status === 'pending') stats.byType[item.type].pending++;
      if (item.status === 'failed') stats.byType[item.type].failed++;

      // By operation
      if (!stats.byOperation[item.operation]) {
        stats.byOperation[item.operation] = { total: 0, pending: 0, failed: 0 };
      }
      stats.byOperation[item.operation].total++;
      if (item.status === 'pending') stats.byOperation[item.operation].pending++;
      if (item.status === 'failed') stats.byOperation[item.operation].failed++;
    });

    return stats;
  }

  /**
   * Retry all failed items in the queue
   * @returns {Promise<number>} Number of items retried
   */
  async retryFailedItems() {
    const db = await getDatabase();
    const tx = db.transaction('syncQueue', 'readwrite');
    const items = await tx.store.getAll();

    let retriedCount = 0;
    for (const item of items) {
      if (item.status === 'failed' && item.retryCount < item.maxRetries) {
        item.status = 'pending';
        item.retryCount = 0;
        item.lastError = null;
        await tx.store.put(item);
        retriedCount++;
      }
    }

    await tx.done;

    if (retriedCount > 0) {
      console.log(`Retrying ${retriedCount} failed sync items`);
      // Trigger processing if online
      if (navigator.onLine) {
        this.processQueue().catch(error => {
          console.error('Error processing retry queue:', error);
        });
      }
    }

    return retriedCount;
  }
}