// Storage configuration constants
// Simplified configuration for Phase 2 PWA features

/**
 * Storage configuration interface
 * Defines all storage-related settings for the PWA
 */
export interface StorageConfig {
  /** Storage thresholds (as percentages 0-1) */
  /** Show warning at this threshold (0-1) */
  WARNING_THRESHOLD: number;
  /** Show critical warning at this threshold (0-1) */
  CRITICAL_THRESHOLD: number;

  /** Cleanup settings */
  /** Number of items to clean up in a single batch */
  CLEANUP_BATCH_SIZE: number;
  /** Enable automatic cleanup when storage is low */
  ENABLE_AUTO_CLEANUP: boolean;

  /** Persistent storage */
  /** Request persistent storage permission */
  ENABLE_PERSISTENT_STORAGE: boolean;

  /** Storage events */
  /** Enable storage quota event monitoring */
  ENABLE_STORAGE_EVENTS: boolean;

  /** Monitoring interval (milliseconds) */
  /** How often to check storage quota */
  STORAGE_CHECK_INTERVAL: number;

  /** Display settings */
  /** Show storage indicator in UI */
  SHOW_STORAGE_INDICATOR: boolean;
}

export const STORAGE_CONFIG: StorageConfig = {
  // Storage thresholds (as percentages 0-1)
  WARNING_THRESHOLD: 0.75,  // Show warning at 75%
  CRITICAL_THRESHOLD: 0.90, // Show critical warning at 90%

  // Cleanup settings
  CLEANUP_BATCH_SIZE: 50,
  ENABLE_AUTO_CLEANUP: true,

  // Persistent storage
  ENABLE_PERSISTENT_STORAGE: true,

  // Storage events
  ENABLE_STORAGE_EVENTS: true,

  // Monitoring interval (milliseconds)
  STORAGE_CHECK_INTERVAL: 60000, // Check every 60 seconds

  // Display settings
  SHOW_STORAGE_INDICATOR: true
};
