// Storage management utilities for PWA
// Handles quota checking, monitoring, and cleanup strategies

import { STORAGE_CONFIG } from '../config/storage.js';
import logger from '@/lib/logger';

/**
 * StorageManager provides centralized storage quota management
 */
export class StorageManager {
  constructor() {
    this.STORAGE_THRESHOLD_WARNING = STORAGE_CONFIG.WARNING_THRESHOLD
    this.STORAGE_THRESHOLD_CRITICAL = STORAGE_CONFIG.CRITICAL_THRESHOLD
    this.CLEANUP_BATCH_SIZE = STORAGE_CONFIG.CLEANUP_BATCH_SIZE
    this.listeners = new Set()
    this._isSupported = null
  }

  /**
   * Check if Storage API is supported
   * @returns {boolean} True if supported
   */
  isSupported() {
    if (this._isSupported === null) {
      this._isSupported = 'storage' in navigator && 'estimate' in navigator.storage
    }
    return this._isSupported
  }

  /**
   * Get current storage quota and usage
   * @returns {Promise<Object>} Storage quota information
   */
  async getStorageQuota() {
    if (!this.isSupported()) {
      return {
        supported: false,
        message: 'Storage API not supported in this browser'
      }
    }

    try {
      const estimate = await navigator.storage.estimate()
      const usage = estimate.usage || 0
      const quota = estimate.quota || 0
      const percentage = quota > 0 ? usage / quota : 0

      return {
        supported: true,
        quota,
        usage,
        percentage,
        usageDetails: estimate.usageDetails || {},
        available: quota - usage,
        status: this.getStorageStatus(percentage),
        formattedUsage: this.formatBytes(usage),
        formattedQuota: this.formatBytes(quota),
        formattedAvailable: this.formatBytes(quota - usage)
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error getting storage quota:', error)
      }
      return {
        supported: false,
        error: error.message
      }
    }
  }

  /**
   * Check if there's enough quota for a write operation
   * @param {number} estimatedSize - Estimated size in bytes
   * @returns {Promise<Object>} Write permission status
   */
  async checkQuotaBeforeWrite(estimatedSize) {
    const quota = await this.getStorageQuota()

    if (!quota.supported) {
      // If Storage API not supported, allow write
      return {
        canWrite: true,
        reason: 'Storage API not supported, assuming sufficient space'
      }
    }

    const projectedUsage = quota.usage + estimatedSize
    const projectedPercentage = projectedUsage / quota.quota

    return {
      canWrite: projectedPercentage < this.STORAGE_THRESHOLD_CRITICAL,
      currentPercentage: quota.percentage,
      projectedPercentage,
      shouldWarn: projectedPercentage > this.STORAGE_THRESHOLD_WARNING,
      availableSpace: quota.available,
      requiredSpace: estimatedSize,
      status: this.getStorageStatus(projectedPercentage)
    }
  }

  /**
   * Request persistent storage permission
   * @returns {Promise<boolean>} True if granted
   */
  async requestPersistentStorage() {
    if (!STORAGE_CONFIG.ENABLE_PERSISTENT_STORAGE) {
      return false
    }

    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const isPersisted = await navigator.storage.persist()
        if (isPersisted) {
          logger.warn('Storage will not be cleared automatically')
        }
        return isPersisted
      } catch (error) {
        logger.error('Error requesting persistent storage:', error)
        return false
      }
    }
    return false
  }

  /**
   * Check if storage is persisted
   * @returns {Promise<boolean>} True if persisted
   */
  async isStoragePersisted() {
    if ('storage' in navigator && 'persisted' in navigator.storage) {
      try {
        return await navigator.storage.persisted()
      } catch {
        return false
      }
    }
    return false
  }

  /**
   * Get storage status based on percentage
   * @param {number} percentage - Usage percentage (0-1)
   * @returns {string} Status: healthy, warning, or critical
   */
  getStorageStatus(percentage) {
    if (percentage < this.STORAGE_THRESHOLD_WARNING) return 'healthy'
    if (percentage < this.STORAGE_THRESHOLD_CRITICAL) return 'warning'
    return 'critical'
  }

  /**
   * Get storage recommendations based on usage
   * @param {number} percentage - Usage percentage
   * @param {Object} stats - Database statistics
   * @returns {Array<string>} Recommendations
   */
  getStorageRecommendations(percentage, stats = {}) {
    const recommendations = []

    if (percentage > this.STORAGE_THRESHOLD_WARNING) {
      recommendations.push('Consider clearing old cached data')
      recommendations.push('Remove offline content for unused songs')
    }

    if (percentage > 0.90) {
      recommendations.push('Clear unused arrangements')
      recommendations.push('Remove old sync queue items')
    }

    if (percentage > this.STORAGE_THRESHOLD_CRITICAL) {
      recommendations.push('CRITICAL: Immediate cleanup required')
      recommendations.push('App may become unstable if storage fills completely')
      recommendations.push('Consider clearing all cache and reloading essential data')
    }

    // Add specific recommendations based on stats
    if (stats.syncQueue && stats.syncQueue > 100) {
      recommendations.push(`Large sync queue (${stats.syncQueue} items) - consider cleanup`)
    }

    return recommendations
  }

  /**
   * Format bytes for human reading
   * @param {number} bytes - Number of bytes
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Estimate size of an object in bytes
   * @param {any} obj - Object to estimate
   * @returns {number} Estimated size in bytes
   */
  estimateObjectSize(obj) {
    try {
      // Convert to JSON and multiply by 2 for UTF-16 encoding
      const jsonString = JSON.stringify(obj)
      return jsonString.length * 2
    } catch {
      // If can't serialize, return a default estimate
      return 1024 // 1KB default
    }
  }

  /**
   * Subscribe to storage events
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToStorageEvents(callback) {
    if (!STORAGE_CONFIG.ENABLE_STORAGE_EVENTS) {
      return () => {}
    }

    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Notify all listeners of storage change
   * @param {Object} event - Storage event
   */
  notifyStorageChange(event) {
    if (!STORAGE_CONFIG.ENABLE_STORAGE_EVENTS) return

    this.listeners.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error in storage event listener:', error)
        }
      }
    })
  }

  /**
   * Monitor storage changes
   * @param {number} interval - Check interval in ms
   * @returns {Function} Stop monitoring function
   */
  startMonitoring(interval = STORAGE_CONFIG.STORAGE_CHECK_INTERVAL) {
    let lastUsage = 0
    let lastStatus = 'healthy'

    const checkStorage = async () => {
      const quota = await this.getStorageQuota()

      if (quota.supported) {
        const currentStatus = quota.status

        // Notify if usage changed significantly (>1%) or status changed
        if (Math.abs(quota.usage - lastUsage) > quota.quota * 0.01 ||
            currentStatus !== lastStatus) {

          this.notifyStorageChange({
            type: 'storage-change',
            usage: quota.usage,
            quota: quota.quota,
            percentage: quota.percentage,
            status: currentStatus,
            previousStatus: lastStatus,
            timestamp: Date.now()
          })

          lastUsage = quota.usage
          lastStatus = currentStatus
        }
      }
    }

    // Initial check
    checkStorage()

    // Set up interval
    const intervalId = setInterval(checkStorage, interval)

    // Return cleanup function
    return () => clearInterval(intervalId)
  }

  /**
   * Get comprehensive storage report
   * @returns {Promise<Object>} Storage report
   */
  async getStorageReport() {
    const quota = await this.getStorageQuota()
    const isPersisted = await this.isStoragePersisted()

    // Get database stats if available
    let dbStats = null
    try {
      // Use static import to avoid bundling issues
      const { getDatabaseStats } = await import('../db/database.js')
      dbStats = await getDatabaseStats()
    } catch {
      // Database module not available
      dbStats = null
    }

    return {
      timestamp: new Date().toISOString(),
      quota,
      isPersisted,
      databaseStats: dbStats,
      recommendations: quota.supported ?
        this.getStorageRecommendations(quota.percentage, dbStats) : [],
      config: {
        warningThreshold: this.STORAGE_THRESHOLD_WARNING,
        criticalThreshold: this.STORAGE_THRESHOLD_CRITICAL,
        autoCleanupEnabled: STORAGE_CONFIG.ENABLE_AUTO_CLEANUP
      }
    }
  }

  /**
   * Check if cleanup is needed
   * @returns {Promise<boolean>} True if cleanup needed
   */
  async isCleanupNeeded() {
    const quota = await this.getStorageQuota()
    return quota.supported && quota.percentage > this.STORAGE_THRESHOLD_CRITICAL
  }

  /**
   * Check if warning should be shown
   * @returns {Promise<boolean>} True if warning needed
   */
  async isWarningNeeded() {
    const quota = await this.getStorageQuota()
    return quota.supported && quota.percentage > this.STORAGE_THRESHOLD_WARNING
  }
}

// Export singleton instance
export const storageManager = new StorageManager()

// Export storage error class
export class StorageQuotaExceededError extends Error {
  constructor(message = 'Storage quota exceeded', details = {}) {
    super(message)
    this.name = 'StorageQuotaExceededError'
    this.details = details
  }
}