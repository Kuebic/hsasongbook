// Storage management utilities for PWA
// Handles quota checking, monitoring, and cleanup strategies

import { STORAGE_CONFIG } from '../config/storage';
import logger from '@/lib/logger';

/**
 * Storage quota information interface
 */
export interface StorageQuotaSupported {
  supported: true;
  quota: number;
  usage: number;
  percentage: number;
  usageDetails: Record<string, number>;
  available: number;
  status: StorageStatus;
  formattedUsage: string;
  formattedQuota: string;
  formattedAvailable: string;
}

export interface StorageQuotaUnsupported {
  supported: false;
  message?: string;
  error?: string;
}

export type StorageQuota = StorageQuotaSupported | StorageQuotaUnsupported;

/**
 * Storage status type
 */
export type StorageStatus = 'healthy' | 'warning' | 'critical';

/**
 * Result of checking quota before write operation
 */
export interface QuotaCheckResultSupported {
  canWrite: boolean;
  currentPercentage: number;
  projectedPercentage: number;
  shouldWarn: boolean;
  availableSpace: number;
  requiredSpace: number;
  status: StorageStatus;
  reason?: never;
}

export interface QuotaCheckResultUnsupported {
  canWrite: boolean;
  reason: string;
  currentPercentage?: never;
  projectedPercentage?: never;
  shouldWarn?: never;
  availableSpace?: never;
  requiredSpace?: never;
  status?: never;
}

export type QuotaCheckResult = QuotaCheckResultSupported | QuotaCheckResultUnsupported;

/**
 * Storage event for monitoring
 */
export interface StorageEvent {
  type: 'storage-change';
  usage: number;
  quota: number;
  percentage: number;
  status: StorageStatus;
  previousStatus: StorageStatus;
  timestamp: number;
}

/**
 * Storage event listener callback
 */
export type StorageEventCallback = (event: StorageEvent) => void;

/**
 * Database statistics interface
 */
export interface DatabaseStats {
  syncQueue?: number;
  [key: string]: number | undefined;
}

/**
 * Storage report interface
 */
export interface StorageReport {
  timestamp: string;
  quota: StorageQuota;
  isPersisted: boolean;
  databaseStats: DatabaseStats | null;
  recommendations: string[];
  config: {
    warningThreshold: number;
    criticalThreshold: number;
    autoCleanupEnabled: boolean;
  };
}

/**
 * StorageManager provides centralized storage quota management
 */
export class StorageManager {
  private readonly STORAGE_THRESHOLD_WARNING: number;
  private readonly STORAGE_THRESHOLD_CRITICAL: number;
  private readonly CLEANUP_BATCH_SIZE: number;
  private readonly listeners: Set<StorageEventCallback>;
  private _isSupported: boolean | null;

  constructor() {
    this.STORAGE_THRESHOLD_WARNING = STORAGE_CONFIG.WARNING_THRESHOLD;
    this.STORAGE_THRESHOLD_CRITICAL = STORAGE_CONFIG.CRITICAL_THRESHOLD;
    this.CLEANUP_BATCH_SIZE = STORAGE_CONFIG.CLEANUP_BATCH_SIZE;
    this.listeners = new Set<StorageEventCallback>();
    this._isSupported = null;
  }

  /**
   * Check if Storage API is supported
   * @returns True if supported
   */
  isSupported(): boolean {
    if (this._isSupported === null) {
      this._isSupported = 'storage' in navigator && 'estimate' in navigator.storage;
    }
    return this._isSupported;
  }

  /**
   * Get current storage quota and usage
   * @returns Storage quota information
   */
  async getStorageQuota(): Promise<StorageQuota> {
    if (!this.isSupported()) {
      return {
        supported: false,
        message: 'Storage API not supported in this browser'
      };
    }

    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? usage / quota : 0;

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
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error getting storage quota:', error);
      }
      return {
        supported: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if there's enough quota for a write operation
   * @param estimatedSize - Estimated size in bytes
   * @returns Write permission status
   */
  async checkQuotaBeforeWrite(estimatedSize: number): Promise<QuotaCheckResult> {
    const quota = await this.getStorageQuota();

    if (!quota.supported) {
      // If Storage API not supported, allow write
      return {
        canWrite: true,
        reason: 'Storage API not supported, assuming sufficient space'
      };
    }

    const projectedUsage = quota.usage + estimatedSize;
    const projectedPercentage = projectedUsage / quota.quota;

    return {
      canWrite: projectedPercentage < this.STORAGE_THRESHOLD_CRITICAL,
      currentPercentage: quota.percentage,
      projectedPercentage,
      shouldWarn: projectedPercentage > this.STORAGE_THRESHOLD_WARNING,
      availableSpace: quota.available,
      requiredSpace: estimatedSize,
      status: this.getStorageStatus(projectedPercentage)
    };
  }

  /**
   * Request persistent storage permission
   * @returns True if granted
   */
  async requestPersistentStorage(): Promise<boolean> {
    if (!STORAGE_CONFIG.ENABLE_PERSISTENT_STORAGE) {
      return false;
    }

    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const isPersisted = await navigator.storage.persist();
        if (isPersisted) {
          logger.warn('Storage will not be cleared automatically');
        }
        return isPersisted;
      } catch (error) {
        logger.error('Error requesting persistent storage:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Check if storage is persisted
   * @returns True if persisted
   */
  async isStoragePersisted(): Promise<boolean> {
    if ('storage' in navigator && 'persisted' in navigator.storage) {
      try {
        return await navigator.storage.persisted();
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Get storage status based on percentage
   * @param percentage - Usage percentage (0-1)
   * @returns Status: healthy, warning, or critical
   */
  getStorageStatus(percentage: number): StorageStatus {
    if (percentage < this.STORAGE_THRESHOLD_WARNING) return 'healthy';
    if (percentage < this.STORAGE_THRESHOLD_CRITICAL) return 'warning';
    return 'critical';
  }

  /**
   * Get storage recommendations based on usage
   * @param percentage - Usage percentage
   * @param stats - Database statistics
   * @returns Recommendations
   */
  getStorageRecommendations(percentage: number, stats: DatabaseStats = {}): string[] {
    const recommendations: string[] = [];

    if (percentage > this.STORAGE_THRESHOLD_WARNING) {
      recommendations.push('Consider clearing old cached data');
      recommendations.push('Remove offline content for unused songs');
    }

    if (percentage > 0.90) {
      recommendations.push('Clear unused arrangements');
      recommendations.push('Remove old sync queue items');
    }

    if (percentage > this.STORAGE_THRESHOLD_CRITICAL) {
      recommendations.push('CRITICAL: Immediate cleanup required');
      recommendations.push('App may become unstable if storage fills completely');
      recommendations.push('Consider clearing all cache and reloading essential data');
    }

    // Add specific recommendations based on stats
    if (stats.syncQueue && stats.syncQueue > 100) {
      recommendations.push(`Large sync queue (${stats.syncQueue} items) - consider cleanup`);
    }

    return recommendations;
  }

  /**
   * Format bytes for human reading
   * @param bytes - Number of bytes
   * @returns Formatted string
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Estimate size of an object in bytes
   * @param obj - Object to estimate
   * @returns Estimated size in bytes
   */
  estimateObjectSize(obj: unknown): number {
    try {
      // Convert to JSON and multiply by 2 for UTF-16 encoding
      const jsonString = JSON.stringify(obj);
      return jsonString.length * 2;
    } catch {
      // If can't serialize, return a default estimate
      return 1024; // 1KB default
    }
  }

  /**
   * Subscribe to storage events
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  subscribeToStorageEvents(callback: StorageEventCallback): () => void {
    if (!STORAGE_CONFIG.ENABLE_STORAGE_EVENTS) {
      return () => {};
    }

    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of storage change
   * @param event - Storage event
   */
  notifyStorageChange(event: StorageEvent): void {
    if (!STORAGE_CONFIG.ENABLE_STORAGE_EVENTS) return;

    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error in storage event listener:', error);
        }
      }
    });
  }

  /**
   * Monitor storage changes
   * @param interval - Check interval in ms
   * @returns Stop monitoring function
   */
  startMonitoring(interval: number = STORAGE_CONFIG.STORAGE_CHECK_INTERVAL): () => void {
    let lastUsage = 0;
    let lastStatus: StorageStatus = 'healthy';

    const checkStorage = async (): Promise<void> => {
      const quota = await this.getStorageQuota();

      if (quota.supported) {
        const currentStatus = quota.status;

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
          });

          lastUsage = quota.usage;
          lastStatus = currentStatus;
        }
      }
    };

    // Initial check
    checkStorage();

    // Set up interval
    const intervalId = setInterval(checkStorage, interval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }

  /**
   * Get comprehensive storage report
   * @returns Storage report
   */
  async getStorageReport(): Promise<StorageReport> {
    const quota = await this.getStorageQuota();
    const isPersisted = await this.isStoragePersisted();

    // Get database stats if available
    let dbStats: DatabaseStats | null = null;
    try {
      // Use dynamic import to avoid bundling issues
      const { getDatabaseStats } = await import('../db/database');
      dbStats = await getDatabaseStats();
    } catch {
      // Database module not available
      dbStats = null;
    }

    return {
      timestamp: new Date().toISOString(),
      quota,
      isPersisted,
      databaseStats: dbStats,
      recommendations: quota.supported ?
        this.getStorageRecommendations(quota.percentage, dbStats || {}) : [],
      config: {
        warningThreshold: this.STORAGE_THRESHOLD_WARNING,
        criticalThreshold: this.STORAGE_THRESHOLD_CRITICAL,
        autoCleanupEnabled: STORAGE_CONFIG.ENABLE_AUTO_CLEANUP
      }
    };
  }

  /**
   * Check if cleanup is needed
   * @returns True if cleanup needed
   */
  async isCleanupNeeded(): Promise<boolean> {
    const quota = await this.getStorageQuota();
    return quota.supported && quota.percentage > this.STORAGE_THRESHOLD_CRITICAL;
  }

  /**
   * Check if warning should be shown
   * @returns True if warning needed
   */
  async isWarningNeeded(): Promise<boolean> {
    const quota = await this.getStorageQuota();
    return quota.supported && quota.percentage > this.STORAGE_THRESHOLD_WARNING;
  }
}

// Export singleton instance
export const storageManager = new StorageManager();

// Export storage error class
export class StorageQuotaExceededError extends Error {
  public readonly details: Record<string, unknown>;

  constructor(message: string = 'Storage quota exceeded', details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'StorageQuotaExceededError';
    this.details = details;
  }
}
