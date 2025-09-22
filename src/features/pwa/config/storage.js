// Storage configuration constants for PWA
export const STORAGE_CONFIG = {
  // Thresholds
  WARNING_THRESHOLD: 0.80,      // 80% - Show warning
  CRITICAL_THRESHOLD: 0.95,     // 95% - Force cleanup

  // Cleanup settings
  MIN_ITEMS_TO_KEEP: 50,         // Always keep at least 50 items
  MAX_SYNC_QUEUE_AGE_DAYS: 7,    // Remove sync items older than 7 days
  MAX_DATA_AGE_DAYS: 90,          // Remove unused data older than 90 days
  CLEANUP_BATCH_SIZE: 100,        // Process 100 items at a time

  // Retry settings
  MAX_CLEANUP_RETRIES: 3,
  CLEANUP_RETRY_DELAY: 1000,     // 1 second

  // UI settings
  STORAGE_CHECK_INTERVAL: 60000, // Check every minute
  SHOW_STORAGE_INDICATOR: true,

  // Feature flags
  ENABLE_AUTO_CLEANUP: true,
  ENABLE_PERSISTENT_STORAGE: true,
  ENABLE_STORAGE_EVENTS: true
}