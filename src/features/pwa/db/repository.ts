// Repository pattern for HSA Songbook data access
// Based on patterns from PRPs/ai_docs/offline-sync-patterns.md

import { IDBPDatabase } from 'idb';
import { getDatabase, checkQuotaBeforeWrite, getStorageManager } from './database.js';
import { StorageQuotaExceededError } from '../utils/storageManager.js';
import logger from '@/lib/logger';
import type { HSASongbookDB, BaseEntity } from '@/types/Database.types';
import type { Song } from '@/types/Song.types';
import type { Arrangement } from '@/types/Arrangement.types';
import type { Setlist } from '@/types/Setlist.types';

/**
 * Base repository class with common functionality
 * @template T - Entity type that extends BaseEntity
 */
abstract class BaseRepository<T extends BaseEntity> {
  protected storeName: keyof HSASongbookDB;

  constructor(storeName: keyof HSASongbookDB) {
    this.storeName = storeName;
  }

  async getDB(): Promise<IDBPDatabase<HSASongbookDB>> {
    return await getDatabase();
  }

  /**
   * Generate a unique ID for new entities
   */
  generateId(): string {
    return `${String(this.storeName)}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get entity by ID
   */
  async getById(id: string): Promise<T | undefined> {
    const db = await this.getDB();
    return await db.get(this.storeName, id) as T | undefined;
  }

  /**
   * Get all entities
   */
  async getAll(): Promise<T[]> {
    const db = await this.getDB();
    return await db.getAll(this.storeName) as T[];
  }

  /**
   * Save entity (create or update)
   */
  async save(entity: Partial<T>): Promise<T> {
    const db = await this.getDB();
    const now = new Date().toISOString();

    // Set metadata for new/updated entities
    const updatedEntity: T = {
      ...entity,
      id: entity.id || this.generateId(),
      updatedAt: now,
      syncStatus: 'pending' as const,
      version: (entity.version || 0) + 1,
      lastAccessedAt: Date.now()  // Track for LRU cleanup
    } as T;

    // Set createdAt for new entities
    if (!entity.id) {
      updatedEntity.createdAt = now;
    }

    // Check storage quota before write
    const storageManager = getStorageManager();
    const estimatedSize = storageManager.estimateObjectSize(updatedEntity);
    const quotaCheck = await checkQuotaBeforeWrite(estimatedSize);

    if (!quotaCheck.canWrite) {
      // Try emergency cleanup
      const cleaned = await this.performEmergencyCleanup();
      if (!cleaned) {
        throw new StorageQuotaExceededError(
          'Storage quota exceeded. Please free up space.',
          {
            currentPercentage: quotaCheck.currentPercentage,
            projectedPercentage: quotaCheck.projectedPercentage,
            availableSpace: quotaCheck.availableSpace,
            requiredSpace: quotaCheck.requiredSpace
          }
        );
      }
    }

    if (quotaCheck.shouldWarn) {
      this.notifyStorageWarning(quotaCheck.currentPercentage);
    }

    try {
      await db.put(this.storeName, updatedEntity);
      await this.queueForSync('update', updatedEntity.id, updatedEntity);
    } catch (error) {
      // Handle QuotaExceededError specifically
      if (error.name === 'QuotaExceededError' || error.name === 'DOMException') {
        await this.handleQuotaExceeded();
        // Try one more time after cleanup
        await db.put(this.storeName, updatedEntity);
        await this.queueForSync('update', updatedEntity.id, updatedEntity);
      } else {
        throw error;
      }
    }

    return updatedEntity;
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<void> {
    const db = await this.getDB();
    const entity = await this.getById(id);

    if (entity) {
      await db.delete(this.storeName, id);
      await this.queueForSync('delete', id, { id } as unknown);
    }
  }

  /**
   * Bulk save multiple entities
   */
  async bulkSave(entities: Partial<T>[]): Promise<T[]> {
    // Check quota for all entities first
    const storageManager = getStorageManager();
    const totalSize = entities.reduce((acc, entity) =>
      acc + storageManager.estimateObjectSize(entity), 0
    );

    const quotaCheck = await checkQuotaBeforeWrite(totalSize);

    if (!quotaCheck.canWrite) {
      // Try emergency cleanup
      const cleaned = await this.performEmergencyCleanup();
      if (!cleaned) {
        throw new StorageQuotaExceededError(
          `Cannot save ${entities.length} items: Storage quota exceeded`,
          {
            itemCount: entities.length,
            totalSize,
            availableSpace: quotaCheck.availableSpace
          }
        );
      }
    }

    if (quotaCheck.shouldWarn) {
      this.notifyStorageWarning(quotaCheck.currentPercentage);
    }

    const db = await this.getDB();
    const tx = db.transaction(this.storeName, 'readwrite');
    const now = new Date().toISOString();
    const currentTime = Date.now();

    const savedEntities = await Promise.all(
      entities.map(async (entity) => {
        const updatedEntity: T = {
          ...entity,
          id: entity.id || this.generateId(),
          updatedAt: now,
          syncStatus: 'pending' as const,
          version: (entity.version || 0) + 1,
          lastAccessedAt: currentTime
        } as T;

        if (!entity.id) {
          updatedEntity.createdAt = now;
        }

        await tx.store.put(updatedEntity);
        return updatedEntity;
      })
    );

    await tx.done;

    // Queue all for sync
    await Promise.all(
      savedEntities.map(entity =>
        this.queueForSync('update', entity.id, entity)
      )
    );

    return savedEntities;
  }

  /**
   * Search entities by a specific index
   */
  async searchByIndex(indexName: string, query: unknown): Promise<T[]> {
    const db = await this.getDB();
    return await db.getAllFromIndex(this.storeName, indexName as never, query as never) as T[];
  }

  /**
   * Queue entity for background sync
   */
  async queueForSync(operation: 'create' | 'update' | 'delete', entityId: string, data: unknown = null): Promise<void> {
    const db = await this.getDB();
    const syncItem = {
      id: `${this.storeName}-${operation}-${entityId}-${Date.now()}`,
      type: this.storeName,
      operation,
      entityId,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3
    };

    await db.put('syncQueue', syncItem);
  }

  /**
   * Mark entity as synced
   */
  async markAsSynced(id: string): Promise<void> {
    const db = await this.getDB();
    const entity = await this.getById(id);

    if (entity) {
      entity.syncStatus = 'synced';
      await db.put(this.storeName, entity as never);
    }
  }

  /**
   * Get entities that need syncing
   */
  async getUnsyncedEntities(): Promise<T[]> {
    return await this.searchByIndex('by-sync-status', 'pending');
  }

  /**
   * Perform emergency cleanup when quota is exceeded
   */
  async performEmergencyCleanup(): Promise<boolean> {
    try {
      logger.warn(`Performing emergency cleanup for ${this.storeName}`);

      // First, try to clear old sync queue items
      await this.clearOldSyncQueue();

      // Then remove least recently used items
      await this.removeLRUItems(10);

      // Check if we have enough space now
      const storageManager = getStorageManager();
      const quota = await storageManager.getStorageQuota();

      return quota.status !== 'critical';
    } catch (error) {
      logger.error('Emergency cleanup failed:', error);
      return false;
    }
  }

  /**
   * Clear old sync queue items
   */
  async clearOldSyncQueue(): Promise<number> {
    const db = await this.getDB();
    const cutoffDate = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days old
    let removed = 0;

    if (db.objectStoreNames.contains('syncQueue')) {
      const tx = db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');
      const items = await store.getAll();

      for (const item of items) {
        if (item.timestamp < cutoffDate || item.retryCount > 5) {
          await store.delete(item.id);
          removed++;
        }
      }

      await tx.done;
    }

    logger.log(`Removed ${removed} old sync queue items`);
    return removed;
  }

  /**
   * Remove least recently used items
   */
  async removeLRUItems(count: number): Promise<number> {
    const db = await this.getDB();
    const items = await this.getAll();

    // Sort by lastAccessedAt (oldest first)
    const sortedItems = items
      .filter(item => !item.isFavorite && !item.isPinned) // Don't remove favorites/pinned
      .sort((a, b) => (a.lastAccessedAt || 0) - (b.lastAccessedAt || 0));

    const toRemove = sortedItems.slice(0, count);
    let removed = 0;

    for (const item of toRemove) {
      await db.delete(this.storeName, item.id);
      removed++;
    }

    logger.log(`Removed ${removed} LRU items from ${this.storeName}`);
    return removed;
  }

  /**
   * Handle quota exceeded error
   */
  async handleQuotaExceeded(): Promise<void> {
    logger.warn('Quota exceeded, attempting recovery');

    // Try progressive cleanup
    await this.clearOldSyncQueue();
    await this.removeLRUItems(5);

    // Notify user
    this.notifyQuotaCritical();
  }

  /**
   * Notify user about storage warning
   */
  notifyStorageWarning(percentage: number): void {
    const event = new CustomEvent('storage-warning', {
      detail: {
        percentage: percentage * 100,
        message: `Storage is ${Math.round(percentage * 100)}% full. Consider clearing unused data.`
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Notify user about critical storage
   */
  notifyQuotaCritical(): void {
    const event = new CustomEvent('storage-critical', {
      detail: {
        message: 'Storage is critically full. Some features may not work correctly.'
      }
    });
    window.dispatchEvent(event);
  }
}

/**
 * Song repository with song-specific methods
 */
export class SongRepository extends BaseRepository<Song> {
  constructor() {
    super('songs');
  }

  /**
   * Search songs by title (case-insensitive)
   */
  async searchByTitle(query: string): Promise<Song[]> {
    const db = await this.getDB();
    const tx = db.transaction(this.storeName, 'readonly');
    const index = tx.store.index('by-title');
    const results = [];

    let cursor = await index.openCursor();
    while (cursor) {
      if (cursor.value.title.toLowerCase().includes(query.toLowerCase())) {
        results.push(cursor.value);
      }
      cursor = await cursor.continue();
    }

    return results;
  }

  /**
   * Get songs by artist
   */
  async getByArtist(artist: string): Promise<Song[]> {
    return await this.searchByIndex('by-artist', artist);
  }

  /**
   * Search songs by multiple criteria
   */
  async search(criteria: { title?: string; artist?: string; themes?: string[] }): Promise<Song[]> {
    const { title, artist, themes } = criteria;
    let results = await this.getAll();

    if (title) {
      results = results.filter(song =>
        song.title.toLowerCase().includes(title.toLowerCase())
      );
    }

    if (artist) {
      results = results.filter(song =>
        song.artist.toLowerCase().includes(artist.toLowerCase())
      );
    }

    if (themes && themes.length > 0) {
      results = results.filter(song =>
        themes.some(theme =>
          song.themes && song.themes.some(songTheme =>
            songTheme.toLowerCase().includes(theme.toLowerCase())
          )
        )
      );
    }

    return results;
  }

  /**
   * Get popular songs
   */
  async getPopular(limit = 10): Promise<Song[]> {
    const db = await this.getDB();
    const tx = db.transaction(this.storeName, 'readonly');
    const index = tx.store.index('by-popularity');

    // Get songs in descending order of popularity
    const songs = [];
    let cursor = await index.openCursor(null, 'prev');
    let count = 0;

    while (cursor && count < limit) {
      songs.push(cursor.value);
      cursor = await cursor.continue();
      count++;
    }

    return songs;
  }
}

/**
 * Arrangement repository with arrangement-specific methods
 */
export class ArrangementRepository extends BaseRepository<Arrangement> {
  constructor() {
    super('arrangements');
  }

  /**
   * Get arrangements for a specific song
   */
  async getBySong(songId: string): Promise<Arrangement[]> {
    return await this.searchByIndex('by-song', songId);
  }

  /**
   * Get arrangements by key
   */
  async getByKey(key: string): Promise<Arrangement[]> {
    return await this.searchByIndex('by-key', key);
  }

  /**
   * Get top-rated arrangements for a song
   */
  async getTopRatedBySong(songId: string, limit = 5): Promise<Arrangement[]> {
    const db = await this.getDB();
    const tx = db.transaction(this.storeName, 'readonly');
    const index = tx.store.index('by-song-rating');

    // Use compound index to get arrangements for song, ordered by rating
    const range = IDBKeyRange.bound([songId, 0], [songId, 5]);
    const arrangements = [];
    let cursor = await index.openCursor(range, 'prev'); // Descending order
    let count = 0;

    while (cursor && count < limit) {
      arrangements.push(cursor.value);
      cursor = await cursor.continue();
      count++;
    }

    return arrangements;
  }

  /**
   * Get most popular arrangements for a song
   */
  async getMostPopularBySong(songId: string, limit = 5): Promise<Arrangement[]> {
    const db = await this.getDB();
    const tx = db.transaction(this.storeName, 'readonly');
    const index = tx.store.index('by-song-popularity');

    // Use compound index to get arrangements for song, ordered by popularity
    const arrangements = [];
    let cursor = await index.openCursor(IDBKeyRange.lowerBound([songId]), 'prev');
    let count = 0;

    while (cursor && count < limit) {
      // Make sure we're still in the same song
      if (cursor.value.songId === songId) {
        arrangements.push(cursor.value);
        count++;
      } else {
        break;
      }
      cursor = await cursor.continue();
    }

    return arrangements;
  }

  /**
   * Sort arrangements for a song
   */
  async getSortedBySong(songId: string, sortBy: 'popular' | 'rating' | 'newest' | 'oldest' = 'popular'): Promise<Arrangement[]> {
    const arrangements = await this.getBySong(songId);

    switch (sortBy) {
      case 'popular':
        return arrangements.sort((a, b) => (b.favorites || 0) - (a.favorites || 0));
      case 'rating':
        return arrangements.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'newest':
        return arrangements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return arrangements.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      default:
        return arrangements;
    }
  }
}

/**
 * Setlist repository with setlist-specific methods
 */
export class SetlistRepository extends BaseRepository<Setlist> {
  constructor() {
    super('setlists');
  }

  /**
   * Search setlists by name
   */
  async searchByName(query: string): Promise<Setlist[]> {
    const db = await this.getDB();
    const tx = db.transaction(this.storeName, 'readonly');
    const index = tx.store.index('by-name');
    const results = [];

    let cursor = await index.openCursor();
    while (cursor) {
      if (cursor.value.name.toLowerCase().includes(query.toLowerCase())) {
        results.push(cursor.value);
      }
      cursor = await cursor.continue();
    }

    return results;
  }

  /**
   * Get setlists by performance date range
   */
  async getByDateRange(startDate: Date, endDate: Date): Promise<Setlist[]> {
    const db = await this.getDB();
    const range = IDBKeyRange.bound(startDate.toISOString(), endDate.toISOString());
    return await db.getAllFromIndex(this.storeName, 'by-performance-date', range) as Setlist[];
  }

  /**
   * Get recent setlists
   */
  async getRecent(limit = 10): Promise<Setlist[]> {
    const db = await this.getDB();
    const tx = db.transaction(this.storeName, 'readonly');
    const index = tx.store.index('by-updated');

    const setlists = [];
    let cursor = await index.openCursor(null, 'prev'); // Most recent first
    let count = 0;

    while (cursor && count < limit) {
      setlists.push(cursor.value);
      cursor = await cursor.continue();
      count++;
    }

    return setlists;
  }

  /**
   * Add song to setlist
   */
  async addSong(setlistId: string, songEntry: Partial<import('@/types/Database.types').SetlistSong>): Promise<Setlist> {
    const setlist = await this.getById(setlistId);
    if (!setlist) {
      throw new Error(`Setlist ${setlistId} not found`);
    }

    const songs = setlist.songs || [];
    const newOrder = Math.max(...songs.map(s => s.order || 0), 0) + 1;

    const newSongEntry = {
      ...songEntry,
      order: songEntry.order !== undefined ? songEntry.order : newOrder
    };

    songs.push(newSongEntry);
    setlist.songs = songs;

    return await this.save(setlist);
  }

  /**
   * Remove song from setlist
   */
  async removeSong(setlistId: string, songId: string): Promise<Setlist> {
    const setlist = await this.getById(setlistId);
    if (!setlist) {
      throw new Error(`Setlist ${setlistId} not found`);
    }

    setlist.songs = (setlist.songs || []).filter(song => song.songId !== songId);
    return await this.save(setlist);
  }

  /**
   * Reorder songs in setlist
   */
  async reorderSongs(setlistId: string, songOrder: string[]): Promise<Setlist> {
    const setlist = await this.getById(setlistId);
    if (!setlist) {
      throw new Error(`Setlist ${setlistId} not found`);
    }

    const songs = setlist.songs || [];
    const reorderedSongs = [];

    songOrder.forEach((songId, index) => {
      const song = songs.find(s => s.songId === songId);
      if (song) {
        reorderedSongs.push({ ...song, order: index + 1 });
      }
    });

    setlist.songs = reorderedSongs;
    return await this.save(setlist);
  }
}