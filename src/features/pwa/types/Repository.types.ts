/**
 * PWA feature types - Repository patterns
 *
 * Generic repository result types for CRUD operations
 */

/**
 * Result of save operations (create or update)
 */
export interface SaveResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: Error;
  timestamp: Date;
  conflictDetected?: boolean;
}

/**
 * Result of delete operations
 */
export interface DeleteResult {
  success: boolean;
  error?: Error;
  timestamp: Date;
}

/**
 * Storage quota information
 */
export interface StorageQuotaInfo {
  usage: number;
  quota: number;
  percentage: number;
  available: number;
  isLow: boolean;
  isCritical: boolean;
}

/**
 * PWA update status
 */
export interface PWAUpdateStatus {
  needRefresh: boolean;
  offlineReady: boolean;
  updateAvailable: boolean;
}

/**
 * Online status
 */
export interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  downlink?: number;
  effectiveType?: string;
}
