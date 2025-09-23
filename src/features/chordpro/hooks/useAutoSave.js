/**
 * useAutoSave Hook
 *
 * Provides auto-save functionality with debouncing and error handling
 * Integrates with DraftRepository for persistent storage
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { draftRepository } from '../db/DraftRepository'
import { chordproConfig } from '@/lib/config'
import logger from '@/lib/logger'

/**
 * Auto-save status constants
 */
export const AUTO_SAVE_STATUS = {
  IDLE: 'idle',
  SAVING: 'saving',
  SAVED: 'saved',
  ERROR: 'error',
  DISABLED: 'disabled'
}

/**
 * useAutoSave Hook
 *
 * @param {string} content - Content to auto-save
 * @param {Object} options - Auto-save configuration
 * @param {string} options.arrangementId - Arrangement ID for draft storage
 * @param {Function} options.onSave - Callback when save completes
 * @param {number} options.debounceMs - Debounce delay in milliseconds
 * @param {number} options.idleTimeoutMs - Idle timeout before forced save
 * @param {boolean} options.enabled - Whether auto-save is enabled
 * @param {boolean} options.enablePeriodicSave - Enable periodic saves
 * @returns {Object} Auto-save state and utilities
 */
export function useAutoSave(content, options = {}) {
  const {
    arrangementId,
    onSave,
    debounceMs = chordproConfig.editor.autoSave.debounceMs,
    idleTimeoutMs = chordproConfig.editor.autoSave.idleTimeoutMs,
    enabled = chordproConfig.editor.autoSave.enablePeriodicSave,
    enablePeriodicSave = true
  } = options

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState(
    enabled ? AUTO_SAVE_STATUS.IDLE : AUTO_SAVE_STATUS.DISABLED
  )
  const [lastSaved, setLastSaved] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [isDirty, setIsDirty] = useState(false)

  // Refs for managing timers and state
  const debounceTimerRef = useRef(null)
  const idleTimerRef = useRef(null)
  const lastContentRef = useRef(content)
  const lastSaveContentRef = useRef('')
  const savingRef = useRef(false)

  // Update enabled state when prop changes
  useEffect(() => {
    setSaveStatus(enabled ? AUTO_SAVE_STATUS.IDLE : AUTO_SAVE_STATUS.DISABLED)
  }, [enabled])

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
    }
  }, [])

  /**
   * Perform the actual save operation
   */
  const performSave = useCallback(async (isManual = false) => {
    if (!enabled || !arrangementId || savingRef.current) {
      return false
    }

    const currentContent = lastContentRef.current

    // Don't save if content hasn't changed
    if (currentContent === lastSaveContentRef.current) {
      return false
    }

    // Don't save empty content unless it's a manual save
    if (!currentContent.trim() && !isManual) {
      return false
    }

    savingRef.current = true
    setSaveStatus(AUTO_SAVE_STATUS.SAVING)
    setSaveError(null)

    try {
      logger.debug('Auto-saving content', {
        arrangementId,
        contentLength: currentContent.length,
        isManual
      })

      const draft = await draftRepository.saveDraft(
        arrangementId,
        currentContent,
        !isManual // isAutoSave = !isManual
      )

      lastSaveContentRef.current = currentContent
      setLastSaved(new Date(draft.savedAt))
      setSaveStatus(AUTO_SAVE_STATUS.SAVED)
      setIsDirty(false)

      // Call external save callback
      if (onSave) {
        onSave(draft)
      }

      logger.debug('Auto-save completed successfully', {
        draftId: draft.id,
        savedAt: draft.savedAt
      })

      return true
    } catch (error) {
      logger.error('Auto-save failed:', error)
      setSaveStatus(AUTO_SAVE_STATUS.ERROR)
      setSaveError(error.message || 'Failed to save draft')
      return false
    } finally {
      savingRef.current = false
    }
  }, [enabled, arrangementId, onSave])

  /**
   * Debounced save function
   */
  const debouncedSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      performSave(false)
    }, debounceMs)
  }, [performSave, debounceMs])

  /**
   * Force save immediately (manual save)
   */
  const forceSave = useCallback(() => {
    // Clear any pending debounced saves
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }

    return performSave(true)
  }, [performSave])

  /**
   * Setup idle timer for forced save
   */
  const setupIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }

    if (enabled && enablePeriodicSave && idleTimeoutMs > 0) {
      idleTimerRef.current = setTimeout(() => {
        if (isDirty && lastContentRef.current !== lastSaveContentRef.current) {
          logger.debug('Idle timeout reached, forcing auto-save')
          performSave(false)
        }
      }, idleTimeoutMs)
    }
  }, [enabled, enablePeriodicSave, idleTimeoutMs, isDirty, performSave])

  // Handle content changes
  useEffect(() => {
    const currentContent = content || ''
    const hasChanged = currentContent !== lastContentRef.current

    lastContentRef.current = currentContent

    if (hasChanged) {
      const isNowDirty = currentContent !== lastSaveContentRef.current
      setIsDirty(isNowDirty)

      if (enabled && isNowDirty) {
        // Update status to indicate changes are pending
        if (saveStatus === AUTO_SAVE_STATUS.SAVED || saveStatus === AUTO_SAVE_STATUS.IDLE) {
          setSaveStatus(AUTO_SAVE_STATUS.IDLE)
        }

        // Start debounced save
        debouncedSave()

        // Setup idle timer
        setupIdleTimer()
      }
    }
  }, [content, enabled, saveStatus, debouncedSave, setupIdleTimer])

  // Handle window beforeunload for immediate save
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (enabled && isDirty && lastContentRef.current !== lastSaveContentRef.current) {
        // Attempt synchronous save (may not complete before unload)
        forceSave()

        // Show confirmation dialog
        const message = 'You have unsaved changes. Are you sure you want to leave?'
        event.preventDefault()
        event.returnValue = message
        return message
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [enabled, isDirty, forceSave])

  // Handle page visibility change for save on focus loss
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && enabled && isDirty) {
        logger.debug('Page hidden, forcing auto-save')
        forceSave()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [enabled, isDirty, forceSave])

  /**
   * Get the latest draft for the current arrangement
   */
  const getLatestDraft = useCallback(async () => {
    if (!arrangementId) return null

    try {
      return await draftRepository.getLatestDraft(arrangementId)
    } catch (error) {
      logger.error('Failed to get latest draft:', error)
      return null
    }
  }, [arrangementId])

  /**
   * Delete all drafts for the current arrangement
   */
  const clearDrafts = useCallback(async () => {
    if (!arrangementId) return false

    try {
      await draftRepository.deleteDraftsByArrangement(arrangementId)
      setLastSaved(null)
      setIsDirty(false)
      lastSaveContentRef.current = ''
      return true
    } catch (error) {
      logger.error('Failed to clear drafts:', error)
      return false
    }
  }, [arrangementId])

  /**
   * Check if there are unsaved changes
   */
  const hasUnsavedChanges = lastContentRef.current !== lastSaveContentRef.current

  return {
    // Status and state
    saveStatus,
    lastSaved,
    saveError,
    isDirty,
    hasUnsavedChanges,
    enabled,

    // Actions
    forceSave,
    getLatestDraft,
    clearDrafts,

    // Utilities
    isAutoSaving: saveStatus === AUTO_SAVE_STATUS.SAVING,
    isError: saveStatus === AUTO_SAVE_STATUS.ERROR,
    isSaved: saveStatus === AUTO_SAVE_STATUS.SAVED && !hasUnsavedChanges
  }
}

/**
 * Default export for convenient importing
 */
export default useAutoSave