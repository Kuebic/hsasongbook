/**
 * PersistenceService - Bridge between DraftRepository and ArrangementRepository
 *
 * Centralized service for managing the save flow from temporary drafts
 * to persistent arrangements with conflict detection and cleanup
 */

import { draftRepository } from '../db/DraftRepository';
import { ArrangementRepository } from '../../pwa/db/repository';
import logger from '@/lib/logger';
import type { Arrangement, Draft } from '@/types';
import type { SaveResult, ConflictData } from '../types/ChordSheet.types';

/**
 * Merge strategy for conflict resolution
 */
type MergeStrategy = 'local' | 'remote' | 'manual';

/**
 * Result of merge operation
 */
type MergeResult =
  | {
      success: true;
      content: string;
      strategy: 'local' | 'remote';
    }
  | {
      success: false;
      requiresManualResolution: true;
      localContent: string;
      remoteContent: string;
    };

/**
 * Draft comparison result from persistence service
 */
interface ComparisonResult {
  hasDraft: boolean;
  hasArrangement: boolean;
  draftContent?: string;
  arrangementContent?: string;
  draftTimestamp?: Date;
  arrangementTimestamp?: Date;
  isDraftNewer?: boolean;
  contentDiffers?: boolean;
  error?: string;
}

/**
 * Persistence Service for ChordPro editor
 * Bridges temporary draft storage with persistent arrangement storage
 */
class PersistenceService {
  private arrangementRepo: ArrangementRepository;

  constructor() {
    this.arrangementRepo = new ArrangementRepository();
  }

  /**
   * Save content from draft to arrangement
   * @param arrangementId - Arrangement ID
   * @param content - ChordPro content to save
   * @param localVersion - Local version number for conflict detection
   * @returns Save operation result
   */
  async saveToArrangement(
    arrangementId: string,
    content: string,
    localVersion: number | null = null
  ): Promise<SaveResult> {
    const timestamp = new Date();

    try {
      logger.debug('Saving content to arrangement:', {
        arrangementId,
        contentLength: content.length,
        localVersion
      });

      // Get current arrangement for conflict detection
      const currentArrangement = await this.arrangementRepo.getById(arrangementId);

      if (!currentArrangement) {
        return {
          success: false,
          error: new Error('Arrangement not found'),
          timestamp
        };
      }

      // Check for version conflicts
      if (localVersion !== null && currentArrangement.version !== undefined && currentArrangement.version > localVersion) {
        logger.warn('Version conflict detected:', {
          localVersion,
          remoteVersion: currentArrangement.version
        });

        const conflictData: ConflictData = {
          local: content,
          remote: currentArrangement.chordProContent,
          localVersion,
          remoteVersion: currentArrangement.version,
          timestamp
        };

        return {
          success: false,
          conflictDetected: true,
          conflictData,
          error: new Error('Version conflict detected'),
          timestamp
        };
      }

      // Update chordProContent field
      const updatedArrangement: Arrangement = {
        ...currentArrangement,
        chordProContent: content,
        updatedAt: timestamp.toISOString()
      };

      // Save via ArrangementRepository (handles sync queue automatically)
      const savedArrangement = await this.arrangementRepo.save(updatedArrangement);

      logger.debug('Arrangement saved successfully:', {
        arrangementId: savedArrangement.id,
        version: savedArrangement.version
      });

      // Cleanup: Remove drafts after successful save (non-blocking, optional)
      // Don't await - run in background, don't block save success
      this.cleanupDrafts(arrangementId).catch(err => {
        logger.debug('Draft cleanup failed (non-critical):', (err as Error).message);
      });

      return {
        success: true,
        arrangement: savedArrangement,
        timestamp
      };
    } catch (error) {
      logger.error('Failed to save arrangement:', error);

      return {
        success: false,
        error: error as Error,
        timestamp
      };
    }
  }

  /**
   * Load arrangement from persistent storage
   * @param arrangementId - Arrangement ID
   * @returns Arrangement or null
   */
  async loadArrangement(arrangementId: string): Promise<Arrangement | null> {
    try {
      const arrangement = await this.arrangementRepo.getById(arrangementId);

      if (arrangement) {
        logger.debug('Arrangement loaded:', {
          id: arrangement.id,
          version: arrangement.version,
          contentLength: arrangement.chordProContent?.length || 0
        });
      }

      return arrangement;
    } catch (error) {
      logger.error('Failed to load arrangement:', error);
      return null;
    }
  }

  /**
   * Check if arrangement has been modified elsewhere
   * @param arrangementId - Arrangement ID
   * @param localVersion - Local version number
   * @returns True if conflict exists
   */
  async detectConflict(arrangementId: string, localVersion: number): Promise<boolean> {
    try {
      const currentArrangement = await this.arrangementRepo.getById(arrangementId);

      if (!currentArrangement || currentArrangement.version === undefined) {
        return false;
      }

      const hasConflict = currentArrangement.version > localVersion;

      if (hasConflict) {
        logger.warn('Conflict detected:', {
          arrangementId,
          localVersion,
          remoteVersion: currentArrangement.version
        });
      }

      return hasConflict;
    } catch (error) {
      logger.error('Failed to detect conflict:', error);
      return false;
    }
  }

  /**
   * Merge conflicting changes
   * @param localContent - Local content
   * @param remoteContent - Remote content
   * @param strategy - Merge strategy: 'local' | 'remote' | 'manual'
   * @returns Merge result
   */
  mergeChanges(localContent: string, remoteContent: string, strategy: MergeStrategy = 'manual'): MergeResult {
    logger.debug('Merging changes with strategy:', strategy);

    switch (strategy) {
      case 'local':
        // Keep local changes
        return {
          success: true,
          content: localContent,
          strategy: 'local'
        };

      case 'remote':
        // Accept remote changes
        return {
          success: true,
          content: remoteContent,
          strategy: 'remote'
        };

      case 'manual':
      default:
        // Require manual resolution
        return {
          success: false,
          requiresManualResolution: true,
          localContent,
          remoteContent
        };
    }
  }

  /**
   * Clean up drafts after successful save
   * @param arrangementId - Arrangement ID
   * @returns True if cleanup succeeded
   */
  async cleanupDrafts(arrangementId: string): Promise<boolean> {
    try {
      await draftRepository.deleteDraftsByArrangement(arrangementId);
      logger.debug('Drafts cleaned up for arrangement:', arrangementId);
      return true;
    } catch (error) {
      logger.error('Failed to cleanup drafts:', error);
      return false;
    }
  }

  /**
   * Get latest draft for an arrangement
   * @param arrangementId - Arrangement ID
   * @returns Latest draft or null
   */
  async getLatestDraft(arrangementId: string): Promise<Draft | null> {
    try {
      return await draftRepository.getLatestDraft(arrangementId);
    } catch (error) {
      logger.error('Failed to get latest draft:', error);
      return null;
    }
  }

  /**
   * Compare draft content with arrangement content
   * @param arrangementId - Arrangement ID
   * @returns Comparison result
   */
  async compareDraftToArrangement(arrangementId: string): Promise<ComparisonResult> {
    try {
      const [arrangement, draft] = await Promise.all([
        this.loadArrangement(arrangementId),
        this.getLatestDraft(arrangementId)
      ]);

      if (!arrangement) {
        return {
          hasDraft: false,
          hasArrangement: false
        };
      }

      if (!draft) {
        return {
          hasDraft: false,
          hasArrangement: true,
          arrangementContent: arrangement.chordProContent
        };
      }

      const draftDate = new Date(draft.savedAt);
      const arrangementDate = new Date(arrangement.updatedAt);
      const isDraftNewer = draftDate > arrangementDate;

      return {
        hasDraft: true,
        hasArrangement: true,
        draftContent: draft.content,
        arrangementContent: arrangement.chordProContent,
        draftTimestamp: draftDate,
        arrangementTimestamp: arrangementDate,
        isDraftNewer,
        contentDiffers: draft.content !== arrangement.chordProContent
      };
    } catch (error) {
      logger.error('Failed to compare draft to arrangement:', error);
      return {
        hasDraft: false,
        hasArrangement: false,
        error: (error as Error).message
      };
    }
  }
}

// Export singleton instance
export const persistenceService = new PersistenceService();

// Named export for testing/injection
export { PersistenceService };

/**
 * Default export
 */
export default persistenceService;
