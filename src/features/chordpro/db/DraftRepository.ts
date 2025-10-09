/**
 * DraftRepository - Auto-save draft storage for ChordPro editor
 *
 * Extends BaseRepository to provide draft-specific functionality
 * with automatic cleanup and version management
 */

import { IDBPDatabase } from 'idb';
import { getDatabase, checkQuotaBeforeWrite, getStorageManager } from '../../pwa/db/database';
import { StorageQuotaExceededError } from '../../pwa/utils/storageManager';
import { chordproConfig } from '@/lib/config';
import logger from '@/lib/logger';
import type { HSASongbookDB, Draft } from '@/types';

interface StorageStats {
  totalDrafts: number;
  expiredDrafts: number;
  autoSaveDrafts: number;
  manualDrafts: number;
  totalSize: number;
  oldestDraft: string | null;
  newestDraft: string | null;
}

/**
 * ChordPro Draft Repository
 * Manages auto-save drafts with automatic cleanup and version control
 */
class DraftRepository {
  private storeName: keyof HSASongbookDB = 'chordproDrafts';
  private config: typeof chordproConfig.editor.autoSave;

  constructor() {
    this.config = chordproConfig.editor.autoSave;
  }

  async getDB(): Promise<IDBPDatabase<HSASongbookDB>> {
    return await getDatabase();
  }

  /**
   * Generate a unique draft ID
   * @param arrangementId - Parent arrangement ID
   * @returns Unique draft ID
   */
  generateDraftId(arrangementId: string): string {
    return `draft_${arrangementId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save a draft for an arrangement
   * @param arrangementId - Parent arrangement ID
   * @param content - ChordPro content
   * @param isAutoSave - Whether this is an auto-save operation
   * @returns Saved draft or null if store unavailable
   */
  async saveDraft(arrangementId: string, content: string, isAutoSave: boolean = true): Promise<Draft | null> {
    const db = await this.getDB();

    // Check if the object store exists (handles migration timing issues)
    if (!db.objectStoreNames.contains(this.storeName)) {
      logger.info(`Draft store not yet available. Skipping draft save.`);
      return null;
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + (this.config.cleanupIntervalHours * 60 * 60 * 1000)
    );

    const draft: Draft = {
      id: this.generateDraftId(arrangementId),
      arrangementId,
      content,
      savedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isAutoSave,
      version: 1,
      syncStatus: 'draft', // Special status for drafts
      lastAccessedAt: Date.now()
    };

    // Check storage quota before write
    const storageManager = getStorageManager();
    const estimatedSize = storageManager.estimateObjectSize(draft);
    const quotaCheck = await checkQuotaBeforeWrite(estimatedSize);

    if (!quotaCheck.canWrite) {
      // Try emergency cleanup of old drafts
      const cleaned = await this.cleanupExpiredDrafts();
      if (!cleaned) {
        throw new StorageQuotaExceededError(
          'Storage quota exceeded. Unable to save draft.',
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
      logger.warn(`Storage warning: ${quotaCheck.currentPercentage}% used`);
    }

    try {
      // Clean up old drafts for this arrangement to maintain limit
      await this.cleanupOldDrafts(arrangementId);

      // Save the new draft
      await db.put(this.storeName, draft);

      logger.debug(`Draft saved for arrangement ${arrangementId}:`, {
        draftId: draft.id,
        contentLength: content.length,
        isAutoSave
      });

      return draft;
    } catch (error) {
      // Handle NotFoundError gracefully (store doesn't exist yet)
      if ((error as Error).name === 'NotFoundError') {
        logger.info(`Draft store not available: ${(error as Error).message}`);
        return null;
      }
      // Handle QuotaExceededError specifically
      if ((error as Error).name === 'QuotaExceededError' || (error as Error).name === 'DOMException') {
        await this.cleanupExpiredDrafts();
        // Try one more time after cleanup
        await db.put(this.storeName, draft);
        return draft;
      }
      throw error;
    }
  }

  /**
   * Get all drafts for a specific arrangement
   * @param arrangementId - Arrangement ID
   * @returns Array of drafts, sorted by savedAt descending
   */
  async getDraftsByArrangement(arrangementId: string): Promise<Draft[]> {
    const db = await this.getDB();

    try {
      // Check if the object store exists (handles migration timing issues)
      if (!db.objectStoreNames.contains(this.storeName)) {
        logger.info(`Draft store not yet available (database migration pending). Drafts will be available after closing all browser tabs.`);
        return [];
      }

      // Get all drafts for this arrangement
      const drafts = await db.getAllFromIndex(this.storeName, 'arrangementId', arrangementId);

      // Filter out expired drafts and sort by savedAt (newest first)
      const now = new Date();
      const validDrafts = drafts
        .filter(draft => new Date(draft.expiresAt) > now)
        .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

      // Update lastAccessedAt for retrieved drafts
      const currentTime = Date.now();
      await Promise.all(
        validDrafts.map(async (draft) => {
          draft.lastAccessedAt = currentTime;
          await db.put(this.storeName, draft);
        })
      );

      return validDrafts;
    } catch (error) {
      // Handle NotFoundError gracefully (store doesn't exist yet)
      if ((error as Error).name === 'NotFoundError') {
        logger.info(`Draft store not available: ${(error as Error).message}`);
        return [];
      }
      logger.error('Failed to get drafts by arrangement:', error);
      return [];
    }
  }

  /**
   * Get the most recent draft for an arrangement
   * @param arrangementId - Arrangement ID
   * @returns Most recent draft or null
   */
  async getLatestDraft(arrangementId: string): Promise<Draft | null> {
    const drafts = await this.getDraftsByArrangement(arrangementId);
    return drafts.length > 0 ? drafts[0] : null;
  }

  /**
   * Delete a specific draft
   * @param draftId - Draft ID to delete
   * @returns Promise that resolves when deletion is complete
   */
  async deleteDraft(draftId: string): Promise<void> {
    const db = await this.getDB();
    await db.delete(this.storeName, draftId);
    logger.debug(`Draft deleted: ${draftId}`);
  }

  /**
   * Delete all drafts for an arrangement
   * @param arrangementId - Arrangement ID
   * @returns Promise that resolves when all deletions are complete
   */
  async deleteDraftsByArrangement(arrangementId: string): Promise<void> {
    const drafts = await this.getDraftsByArrangement(arrangementId);
    await Promise.all(drafts.map(draft => this.deleteDraft(draft.id)));
    logger.debug(`All drafts deleted for arrangement: ${arrangementId}`);
  }

  /**
   * Clean up old drafts for an arrangement to maintain the configured limit
   * @param arrangementId - Arrangement ID
   * @returns Number of drafts cleaned up
   */
  async cleanupOldDrafts(arrangementId: string): Promise<number> {
    const drafts = await this.getDraftsByArrangement(arrangementId);
    const maxDrafts = this.config.maxDraftsPerEntity;

    if (drafts.length >= maxDrafts) {
      // Sort by savedAt (oldest first) and remove excess
      const sorted = drafts.sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime());
      const toDelete = sorted.slice(0, drafts.length - maxDrafts + 1); // +1 to make room for new draft

      await Promise.all(toDelete.map(draft => this.deleteDraft(draft.id)));

      logger.debug(`Cleaned up ${toDelete.length} old drafts for arrangement ${arrangementId}`);
      return toDelete.length;
    }

    return 0;
  }

  /**
   * Clean up all expired drafts across all arrangements
   * @returns Number of drafts cleaned up
   */
  async cleanupExpiredDrafts(): Promise<number> {
    const db = await this.getDB();

    // Check if the object store exists
    if (!db.objectStoreNames.contains(this.storeName)) {
      logger.debug(`Draft store not available. Skipping cleanup.`);
      return 0;
    }

    const now = new Date();

    try {
      // Get all drafts
      const allDrafts = await db.getAll(this.storeName);

      // Find expired drafts
      const expiredDrafts = allDrafts.filter(draft => new Date(draft.expiresAt) <= now);

      // Delete expired drafts
      await Promise.all(expiredDrafts.map(draft => this.deleteDraft(draft.id)));

      if (expiredDrafts.length > 0) {
        logger.info(`Cleaned up ${expiredDrafts.length} expired drafts`);
      }

      return expiredDrafts.length;
    } catch (error) {
      if ((error as Error).name === 'NotFoundError') {
        logger.debug(`Draft store not available: ${(error as Error).message}`);
        return 0;
      }
      logger.error('Failed to cleanup expired drafts:', error);
      return 0;
    }
  }

  /**
   * Clean up drafts by LRU (Least Recently Used) strategy
   * @param targetCount - Target number of drafts to keep
   * @returns Number of drafts cleaned up
   */
  async cleanupByLRU(targetCount: number = 100): Promise<number> {
    const db = await this.getDB();

    try {
      const allDrafts = await db.getAll(this.storeName);

      if (allDrafts.length <= targetCount) {
        return 0; // No cleanup needed
      }

      // Sort by lastAccessedAt (oldest first)
      const sorted = allDrafts.sort((a, b) => (a.lastAccessedAt || 0) - (b.lastAccessedAt || 0));
      const toDelete = sorted.slice(0, allDrafts.length - targetCount);

      await Promise.all(toDelete.map(draft => this.deleteDraft(draft.id)));

      logger.info(`LRU cleanup: removed ${toDelete.length} least recently used drafts`);
      return toDelete.length;
    } catch (error) {
      logger.error('Failed to cleanup drafts by LRU:', error);
      return 0;
    }
  }

  /**
   * Get storage statistics for drafts
   * @returns Storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    const db = await this.getDB();
    const storageManager = getStorageManager();

    try {
      const allDrafts = await db.getAll(this.storeName);
      const now = new Date();

      const stats: StorageStats = {
        totalDrafts: allDrafts.length,
        expiredDrafts: allDrafts.filter(draft => new Date(draft.expiresAt) <= now).length,
        autoSaveDrafts: allDrafts.filter(draft => draft.isAutoSave).length,
        manualDrafts: allDrafts.filter(draft => !draft.isAutoSave).length,
        totalSize: allDrafts.reduce((acc, draft) =>
          acc + storageManager.estimateObjectSize(draft), 0
        ),
        oldestDraft: allDrafts.length > 0
          ? allDrafts.reduce((oldest, draft) =>
              new Date(draft.savedAt) < new Date(oldest.savedAt) ? draft : oldest
            ).savedAt
          : null,
        newestDraft: allDrafts.length > 0
          ? allDrafts.reduce((newest, draft) =>
              new Date(draft.savedAt) > new Date(newest.savedAt) ? draft : newest
            ).savedAt
          : null
      };

      return stats;
    } catch (error) {
      logger.error('Failed to get storage stats:', error);
      return {
        totalDrafts: 0,
        expiredDrafts: 0,
        autoSaveDrafts: 0,
        manualDrafts: 0,
        totalSize: 0,
        oldestDraft: null,
        newestDraft: null
      };
    }
  }

  /**
   * Bulk delete drafts by IDs
   * @param draftIds - Array of draft IDs to delete
   * @returns Number of drafts deleted
   */
  async bulkDeleteDrafts(draftIds: string[]): Promise<number> {
    if (!Array.isArray(draftIds) || draftIds.length === 0) {
      return 0;
    }

    await Promise.all(draftIds.map(id => this.deleteDraft(id)));
    logger.debug(`Bulk deleted ${draftIds.length} drafts`);
    return draftIds.length;
  }
}

// Export singleton instance
export const draftRepository = new DraftRepository();

// Named export for consistency with other repository classes
export { DraftRepository };

/**
 * Default export for convenient importing
 */
export default DraftRepository;
