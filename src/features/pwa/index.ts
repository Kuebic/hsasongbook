// Main PWA feature exports
// This file provides a clean API for importing PWA functionality

// Database layer
export {
  initDatabase,
  getDatabase,
  checkStorageHealth,
  requestPersistentStorage,
  getStorageManager
} from './db/database';
export { SongRepository, ArrangementRepository, SetlistRepository } from './db/repository';

// Storage management
export { StorageManager, storageManager, StorageQuotaExceededError } from './utils/storageManager';
export { CleanupManager, cleanupManager } from './db/cleanupManager';
export { STORAGE_CONFIG } from './config/storage';

// Hooks
export { usePWA } from './hooks/usePWA';
export { useOnlineStatus } from './hooks/useOnlineStatus';
export { useStorageQuota } from './hooks/useStorageQuota';

// Components
export { UpdateNotification } from './components/UpdateNotification';
export { OfflineIndicator } from './components/OfflineIndicator';

// Re-export database migrations for manual control if needed
export { runMigrations, getCurrentVersion } from './db/migrations';

// Data migration utilities
export { DataMigration, importMockData, importMockDataIfNeeded, getMigrationStatus, validateImportedData } from './db/dataMigration';

// Type exports for external use
export type { StorageQuota, StorageStatus, QuotaCheckResult, StorageEvent, DatabaseStats, StorageReport } from './utils/storageManager';
export type { DatabaseStats as DBStats, StorageHealthInfo } from './db/database';
export type { SaveResult, DeleteResult, StorageQuotaInfo, PWAUpdateStatus, OnlineStatus } from './types';
export type { HSASongbookDB, BaseEntity, Draft, Setlist, SetlistSong, SyncQueueItem, PreferenceValue } from '@/types/Database.types';
