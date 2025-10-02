// Storage configuration constants
// Simplified configuration for Phase 2 PWA features

export const STORAGE_CONFIG = {
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
