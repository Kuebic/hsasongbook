/**
 * useArrangementSave Hook
 *
 * Main hook for saving drafts to arrangements with conflict detection
 * Completes the save cycle from temporary drafts to persistent storage
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { persistenceService } from '../services/PersistenceService'
import { chordproConfig } from '@/lib/config'
import logger from '@/lib/logger'
import type {
  SaveStatus,
  ConflictData,
  SaveResult,
  UseArrangementSaveOptions,
  UseArrangementSaveReturn
} from '../types'

/**
 * Save status types (for backwards compatibility)
 */
export const SAVE_STATUS: Record<string, SaveStatus> = {
  IDLE: 'idle',
  SAVING: 'saving',
  SAVED: 'saved',
  ERROR: 'error',
  CONFLICT: 'conflict',
  DIRTY: 'dirty'
}

/**
 * useArrangementSave Hook
 *
 * @param arrangementId - Arrangement ID
 * @param content - Current content
 * @param options - Save options
 * @returns Save state and operations
 */
export function useArrangementSave(
  arrangementId: string | null,
  content: string,
  options: UseArrangementSaveOptions = {}
): UseArrangementSaveReturn {
  const {
    onSaveSuccess,
    onSaveError,
    onConflict,
    currentVersion = null
  } = options

  const config = chordproConfig.persistence.save

  // Save state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(SAVE_STATUS.IDLE)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [conflictData, setConflictData] = useState<ConflictData | null>(null)

  // Track last saved content for dirty state
  const lastSavedContentRef = useRef<string>('')
  const savingRef = useRef<boolean>(false)
  const savedVersionRef = useRef<number | null>(currentVersion)

  /**
   * Check if content has unsaved changes
   */
  const isDirty = content !== lastSavedContentRef.current

  /**
   * Update dirty state when content or status changes
   */
  useEffect(() => {
    if (isDirty && saveStatus === SAVE_STATUS.SAVED) {
      setSaveStatus(SAVE_STATUS.DIRTY)
    }
  }, [isDirty, saveStatus])

  /**
   * Perform save operation to arrangement
   */
  const saveToArrangement = useCallback(async (): Promise<SaveResult> => {
    if (!arrangementId || savingRef.current) {
      return {
        success: false,
        error: new Error('Save already in progress or no arrangement ID')
      }
    }

    // Don't save if content hasn't changed
    if (content === lastSavedContentRef.current) {
      logger.debug('Content unchanged, skipping save')
      return {
        success: true,
        unchanged: true
      }
    }

    savingRef.current = true
    setSaveStatus(SAVE_STATUS.SAVING)
    setSaveError(null)
    setConflictData(null)

    try {
      logger.debug('Saving to arrangement:', {
        arrangementId,
        contentLength: content.length,
        version: savedVersionRef.current
      })

      const startTime = performance.now()

      // Save via PersistenceService
      const result = await persistenceService.saveToArrangement(
        arrangementId,
        content,
        savedVersionRef.current
      )

      const saveTime = performance.now() - startTime

      if (config.performanceTarget && saveTime > config.performanceTarget) {
        logger.warn(`Save took ${saveTime}ms, exceeds target of ${config.performanceTarget}ms`)
      }

      if (result.conflictDetected) {
        // Handle conflict
        setSaveStatus(SAVE_STATUS.CONFLICT)
        setConflictData(result.conflictData)

        if (onConflict) {
          onConflict(result.conflictData)
        }

        logger.warn('Save conflict detected:', result.conflictData)

        return result
      }

      if (result.success) {
        // Update save state
        lastSavedContentRef.current = content
        savedVersionRef.current = result.arrangement.version
        setLastSaved(result.timestamp)
        setSaveStatus(SAVE_STATUS.SAVED)

        logger.debug('Save successful:', {
          version: result.arrangement.version,
          saveTime: `${saveTime}ms`
        })

        if (onSaveSuccess) {
          onSaveSuccess(result)
        }

        return result
      }

      // Save failed
      setSaveStatus(SAVE_STATUS.ERROR)
      setSaveError(result.error?.message || 'Save failed')

      if (onSaveError) {
        onSaveError(result.error)
      }

      logger.error('Save failed:', result.error)

      return result
    } catch (error) {
      logger.error('Save exception:', error)

      setSaveStatus(SAVE_STATUS.ERROR)
      setSaveError(error.message || 'Save failed')

      if (onSaveError) {
        onSaveError(error)
      }

      return {
        success: false,
        error,
        timestamp: new Date()
      }
    } finally {
      savingRef.current = false
    }
  }, [arrangementId, content, onSaveSuccess, onSaveError, onConflict, config.performanceTarget])

  /**
   * Retry save after error
   */
  const retrySave = useCallback(async (): Promise<SaveResult | undefined> => {
    if (saveStatus !== SAVE_STATUS.ERROR) {
      return
    }

    logger.debug('Retrying save after error')
    return await saveToArrangement()
  }, [saveStatus, saveToArrangement])

  /**
   * Resolve conflict by choosing local or remote
   */
  const resolveConflict = useCallback(async (resolution: 'local' | 'remote' = 'local'): Promise<SaveResult> => {
    if (saveStatus !== SAVE_STATUS.CONFLICT || !conflictData) {
      return {
        success: false,
        error: new Error('No conflict to resolve')
      }
    }

    logger.debug('Resolving conflict with strategy:', resolution)

    const mergeResult = persistenceService.mergeChanges(
      conflictData.local,
      conflictData.remote,
      resolution
    )

    if (mergeResult.success) {
      // Update content reference and retry save
      lastSavedContentRef.current = ''
      savedVersionRef.current = conflictData.remoteVersion

      return await saveToArrangement()
    }

    return mergeResult
  }, [saveStatus, conflictData, saveToArrangement])

  /**
   * Handle Ctrl+S / Cmd+S keyboard shortcut
   */
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        saveToArrangement()
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [saveToArrangement])

  /**
   * Update saved version when currentVersion prop changes
   */
  useEffect(() => {
    if (currentVersion !== null) {
      savedVersionRef.current = currentVersion
    }
  }, [currentVersion])

  /**
   * Reset state when arrangement changes
   */
  useEffect(() => {
    if (arrangementId) {
      lastSavedContentRef.current = ''
      savedVersionRef.current = currentVersion
      setSaveStatus(SAVE_STATUS.IDLE)
      setSaveError(null)
      setConflictData(null)
      setLastSaved(null)
    }
  }, [arrangementId, currentVersion])

  return {
    // Save state
    saveStatus,
    lastSaved,
    saveError,
    isDirty,
    conflictData,

    // Save operations
    saveToArrangement,
    retrySave,
    resolveConflict,

    // Status helpers
    isSaving: saveStatus === SAVE_STATUS.SAVING,
    isSaved: saveStatus === SAVE_STATUS.SAVED && !isDirty,
    hasError: saveStatus === SAVE_STATUS.ERROR,
    hasConflict: saveStatus === SAVE_STATUS.CONFLICT,

    // Version tracking
    currentSavedVersion: savedVersionRef.current
  }
}

/**
 * Default export for convenient importing
 */
export default useArrangementSave
