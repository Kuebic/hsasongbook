/**
 * PersistenceService - Bridge between DraftRepository and ArrangementRepository
 *
 * Centralized service for managing the save flow from temporary drafts
 * to persistent arrangements with conflict detection and cleanup
 */

import { draftRepository } from '../db/DraftRepository.js'
import { ArrangementRepository } from '../../pwa/db/repository.js'
import logger from '@/lib/logger'

/**
 * Save operation result
 * @typedef {Object} SaveResult
 * @property {boolean} success - Whether save was successful
 * @property {Object} [arrangement] - Saved arrangement
 * @property {Error} [error] - Error if save failed
 * @property {Date} timestamp - When save was attempted
 * @property {boolean} [conflictDetected] - Whether a conflict was detected
 * @property {Object} [conflictData] - Data for conflict resolution
 */

/**
 * Persistence Service for ChordPro editor
 * Bridges temporary draft storage with persistent arrangement storage
 */
class PersistenceService {
  constructor() {
    this.arrangementRepo = new ArrangementRepository()
  }

  /**
   * Save content from draft to arrangement
   * @param {string} arrangementId - Arrangement ID
   * @param {string} content - ChordPro content to save
   * @param {number} [localVersion] - Local version number for conflict detection
   * @returns {Promise<SaveResult>} Save operation result
   */
  async saveToArrangement(arrangementId, content, localVersion = null) {
    const timestamp = new Date()

    try {
      logger.debug('Saving content to arrangement:', {
        arrangementId,
        contentLength: content.length,
        localVersion
      })

      // Get current arrangement for conflict detection
      const currentArrangement = await this.arrangementRepo.getById(arrangementId)

      if (!currentArrangement) {
        return {
          success: false,
          error: new Error('Arrangement not found'),
          timestamp
        }
      }

      // Check for version conflicts
      if (localVersion !== null && currentArrangement.version > localVersion) {
        logger.warn('Version conflict detected:', {
          localVersion,
          remoteVersion: currentArrangement.version
        })

        return {
          success: false,
          conflictDetected: true,
          conflictData: {
            local: content,
            remote: currentArrangement.chordProContent,
            localVersion,
            remoteVersion: currentArrangement.version
          },
          timestamp
        }
      }

      // Update chordProContent field
      const updatedArrangement = {
        ...currentArrangement,
        chordProContent: content,
        updatedAt: timestamp.toISOString()
      }

      // Save via ArrangementRepository (handles sync queue automatically)
      const savedArrangement = await this.arrangementRepo.save(updatedArrangement)

      logger.debug('Arrangement saved successfully:', {
        arrangementId: savedArrangement.id,
        version: savedArrangement.version
      })

      // Cleanup: Remove drafts after successful save
      await this.cleanupDrafts(arrangementId)

      return {
        success: true,
        arrangement: savedArrangement,
        timestamp
      }
    } catch (error) {
      logger.error('Failed to save arrangement:', error)

      return {
        success: false,
        error,
        timestamp
      }
    }
  }

  /**
   * Load arrangement from persistent storage
   * @param {string} arrangementId - Arrangement ID
   * @returns {Promise<Object|null>} Arrangement or null
   */
  async loadArrangement(arrangementId) {
    try {
      const arrangement = await this.arrangementRepo.getById(arrangementId)

      if (arrangement) {
        logger.debug('Arrangement loaded:', {
          id: arrangement.id,
          version: arrangement.version,
          contentLength: arrangement.chordProContent?.length || 0
        })
      }

      return arrangement
    } catch (error) {
      logger.error('Failed to load arrangement:', error)
      return null
    }
  }

  /**
   * Check if arrangement has been modified elsewhere
   * @param {string} arrangementId - Arrangement ID
   * @param {number} localVersion - Local version number
   * @returns {Promise<boolean>} True if conflict exists
   */
  async detectConflict(arrangementId, localVersion) {
    try {
      const currentArrangement = await this.arrangementRepo.getById(arrangementId)

      if (!currentArrangement) {
        return false
      }

      const hasConflict = currentArrangement.version > localVersion

      if (hasConflict) {
        logger.warn('Conflict detected:', {
          arrangementId,
          localVersion,
          remoteVersion: currentArrangement.version
        })
      }

      return hasConflict
    } catch (error) {
      logger.error('Failed to detect conflict:', error)
      return false
    }
  }

  /**
   * Merge conflicting changes
   * @param {string} localContent - Local content
   * @param {string} remoteContent - Remote content
   * @param {string} strategy - Merge strategy: 'local' | 'remote' | 'manual'
   * @returns {Object} Merge result
   */
  mergeChanges(localContent, remoteContent, strategy = 'manual') {
    logger.debug('Merging changes with strategy:', strategy)

    switch (strategy) {
      case 'local':
        // Keep local changes
        return {
          success: true,
          content: localContent,
          strategy: 'local'
        }

      case 'remote':
        // Accept remote changes
        return {
          success: true,
          content: remoteContent,
          strategy: 'remote'
        }

      case 'manual':
      default:
        // Require manual resolution
        return {
          success: false,
          requiresManualResolution: true,
          localContent,
          remoteContent
        }
    }
  }

  /**
   * Clean up drafts after successful save
   * @param {string} arrangementId - Arrangement ID
   * @returns {Promise<boolean>} True if cleanup succeeded
   */
  async cleanupDrafts(arrangementId) {
    try {
      await draftRepository.deleteDraftsByArrangement(arrangementId)
      logger.debug('Drafts cleaned up for arrangement:', arrangementId)
      return true
    } catch (error) {
      logger.error('Failed to cleanup drafts:', error)
      return false
    }
  }

  /**
   * Get latest draft for an arrangement
   * @param {string} arrangementId - Arrangement ID
   * @returns {Promise<Object|null>} Latest draft or null
   */
  async getLatestDraft(arrangementId) {
    try {
      return await draftRepository.getLatestDraft(arrangementId)
    } catch (error) {
      logger.error('Failed to get latest draft:', error)
      return null
    }
  }

  /**
   * Compare draft content with arrangement content
   * @param {string} arrangementId - Arrangement ID
   * @returns {Promise<Object>} Comparison result
   */
  async compareDraftToArrangement(arrangementId) {
    try {
      const [arrangement, draft] = await Promise.all([
        this.loadArrangement(arrangementId),
        this.getLatestDraft(arrangementId)
      ])

      if (!arrangement) {
        return {
          hasDraft: false,
          hasArrangement: false
        }
      }

      if (!draft) {
        return {
          hasDraft: false,
          hasArrangement: true,
          arrangementContent: arrangement.chordProContent
        }
      }

      const draftDate = new Date(draft.savedAt)
      const arrangementDate = new Date(arrangement.updatedAt)
      const isDraftNewer = draftDate > arrangementDate

      return {
        hasDraft: true,
        hasArrangement: true,
        draftContent: draft.content,
        arrangementContent: arrangement.chordProContent,
        draftTimestamp: draftDate,
        arrangementTimestamp: arrangementDate,
        isDraftNewer,
        contentDiffers: draft.content !== arrangement.chordProContent
      }
    } catch (error) {
      logger.error('Failed to compare draft to arrangement:', error)
      return {
        hasDraft: false,
        hasArrangement: false,
        error: error.message
      }
    }
  }
}

// Export singleton instance
export const persistenceService = new PersistenceService()

// Named export for testing/injection
export { PersistenceService }

/**
 * Default export
 */
export default persistenceService
