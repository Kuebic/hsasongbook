// Main PWA feature exports
// This file provides a clean API for importing PWA functionality

// Database layer
export { initDatabase, getDatabase } from './db/database.js';
export { SongRepository, ArrangementRepository, SetlistRepository } from './db/repository.js';

// Hooks
export { usePWA } from './hooks/usePWA.js';
export { useOnlineStatus } from './hooks/useOnlineStatus.js';

// Components
export { InstallPrompt } from './components/InstallPrompt.jsx';
export { UpdateNotification } from './components/UpdateNotification.jsx';
export { OfflineIndicator } from './components/OfflineIndicator.jsx';

// Sync functionality
export { SyncQueue } from './sync/syncQueue.js';
export { ConflictResolver } from './sync/conflictResolver.js';

// Utilities
export { CacheManager } from './utils/cacheManager.js';
export { PWAPerformance } from './utils/performance.js';
export { PWATestUtils } from './utils/pwaTest.js';

// Re-export database migrations for manual control if needed
export { runMigrations, getCurrentVersion } from './db/migrations.js';

// Data migration utilities
export { DataMigration, importMockData, importMockDataIfNeeded, getMigrationStatus, validateImportedData } from './db/dataMigration.js';