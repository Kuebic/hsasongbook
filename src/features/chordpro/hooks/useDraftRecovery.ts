/**
 * useDraftRecovery Hook
 *
 * Draft recovery detection and management
 * Checks for newer drafts and provides comparison with arrangement content
 */

import { useState, useEffect, useCallback } from 'react'
import { persistenceService } from '../services/PersistenceService'
import { chordproConfig } from '@/lib/config'
import logger from '@/lib/logger'
import type { UseDraftRecoveryReturn, DraftPreview } from '../types'

/**
 * useDraftRecovery Hook
 *
 * @param arrangementId - Arrangement ID
 * @param enabled - Whether recovery is enabled
 * @returns Recovery state and operations
 */
export function useDraftRecovery(arrangementId: string | null, enabled: boolean = true): UseDraftRecoveryReturn {
  const config = chordproConfig.persistence.recovery

  // Recovery state
  const [hasDraft, setHasDraft] = useState<boolean>(false)
  const [draftContent, setDraftContent] = useState<string>('')
  const [arrangementContent, setArrangementContent] = useState<string>('')
  const [draftTimestamp, setDraftTimestamp] = useState<Date | null>(null)
  const [arrangementTimestamp, setArrangementTimestamp] = useState<Date | null>(null)
  const [isDraftNewer, setIsDraftNewer] = useState<boolean>(false)
  const [contentDiffers, setContentDiffers] = useState<boolean>(false)
  const [showRecoveryDialog, setShowRecoveryDialog] = useState<boolean>(false)
  const [checking, setChecking] = useState<boolean>(false)

  /**
   * Check for draft and compare with arrangement
   */
  const checkForDraft = useCallback(async (): Promise<void> => {
    if (!arrangementId || !enabled || !config.enableDraftRecovery) {
      return
    }

    try {
      setChecking(true)
      logger.debug('Checking for draft recovery:', arrangementId)

      const comparison = await persistenceService.compareDraftToArrangement(arrangementId)

      if (comparison.error) {
        logger.error('Draft comparison failed:', comparison.error)
        return
      }

      setHasDraft(comparison.hasDraft)

      if (comparison.hasDraft && comparison.contentDiffers && comparison.isDraftNewer) {
        // Found a newer draft with different content
        setDraftContent(comparison.draftContent)
        setArrangementContent(comparison.arrangementContent)
        setDraftTimestamp(comparison.draftTimestamp)
        setArrangementTimestamp(comparison.arrangementTimestamp)
        setIsDraftNewer(true)
        setContentDiffers(true)
        setShowRecoveryDialog(true)

        logger.info('Draft recovery available:', {
          draftTimestamp: comparison.draftTimestamp,
          arrangementTimestamp: comparison.arrangementTimestamp
        })
      } else {
        setShowRecoveryDialog(false)
      }
    } catch (error) {
      logger.error('Failed to check for draft:', error)
    } finally {
      setChecking(false)
    }
  }, [arrangementId, enabled, config.enableDraftRecovery])

  /**
   * Apply recovered draft content
   */
  const applyDraft = useCallback((): string | null => {
    if (!hasDraft || !draftContent) {
      return null
    }

    logger.info('Applying recovered draft')
    setShowRecoveryDialog(false)

    return draftContent
  }, [hasDraft, draftContent])

  /**
   * Discard draft and use arrangement content
   */
  const discardDraft = useCallback(async (): Promise<void> => {
    if (!arrangementId) {
      return
    }

    try {
      logger.info('Discarding draft')

      // Delete drafts for this arrangement
      await persistenceService.cleanupDrafts(arrangementId)

      setShowRecoveryDialog(false)
      setHasDraft(false)
      setDraftContent('')
    } catch (error) {
      logger.error('Failed to discard draft:', error)
    }
  }, [arrangementId])

  /**
   * Close recovery dialog without action
   */
  const closeDialog = useCallback((): void => {
    setShowRecoveryDialog(false)
  }, [])

  /**
   * Get preview of changes (first N lines)
   */
  const getPreview = useCallback((): DraftPreview => {
    if (!draftContent || !arrangementContent) {
      return {
        draftPreview: '',
        arrangementPreview: ''
      }
    }

    const previewLines = config.draftComparisonLines || 10

    const draftLines = draftContent.split('\n').slice(0, previewLines)
    const arrangementLines = arrangementContent.split('\n').slice(0, previewLines)

    return {
      draftPreview: draftLines.join('\n'),
      arrangementPreview: arrangementLines.join('\n'),
      draftHasMore: draftContent.split('\n').length > previewLines,
      arrangementHasMore: arrangementContent.split('\n').length > previewLines
    }
  }, [draftContent, arrangementContent, config.draftComparisonLines])

  /**
   * Auto-check on mount if enabled
   */
  useEffect(() => {
    if (config.checkOnMount && arrangementId && enabled) {
      checkForDraft()
    }
  }, [arrangementId, enabled, config.checkOnMount, checkForDraft])

  /**
   * Auto-dismiss dialog after timeout
   */
  useEffect(() => {
    if (showRecoveryDialog && config.recoveryDialogTimeout > 0) {
      const timer = setTimeout(() => {
        logger.debug('Recovery dialog auto-dismissed after timeout')
        closeDialog()
      }, config.recoveryDialogTimeout)

      return () => clearTimeout(timer)
    }
  }, [showRecoveryDialog, config.recoveryDialogTimeout, closeDialog])

  return {
    // State
    hasDraft,
    draftContent,
    arrangementContent,
    draftTimestamp,
    arrangementTimestamp,
    isDraftNewer,
    contentDiffers,
    showRecoveryDialog,
    checking,

    // Operations
    checkForDraft,
    applyDraft,
    discardDraft,
    closeDialog,
    getPreview
  }
}

/**
 * Default export for convenient importing
 */
export default useDraftRecovery
