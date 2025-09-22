// React hook for monitoring and managing storage quota

import { useState, useEffect, useCallback, useRef } from 'react'
import { checkStorageHealth, getStorageManager } from '../db/database'
import { CleanupManager } from '../db/cleanupManager'
import { STORAGE_CONFIG } from '../config/storage'

/**
 * Hook for monitoring storage quota and performing cleanup
 * @param {Object} options - Hook options
 * @returns {Object} Storage state and actions
 */
export function useStorageQuota(options = {}) {
  const {
    checkInterval = STORAGE_CONFIG.STORAGE_CHECK_INTERVAL,
    autoCheck = true,
    onWarning,
    onCritical,
    onCleanupComplete
  } = options

  // State
  const [storageInfo, setStorageInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [cleanupResults, setCleanupResults] = useState(null)

  // Refs for callbacks
  const onWarningRef = useRef(onWarning)
  const onCriticalRef = useRef(onCritical)
  const onCleanupCompleteRef = useRef(onCleanupComplete)

  // Update refs on prop change
  useEffect(() => {
    onWarningRef.current = onWarning
    onCriticalRef.current = onCritical
    onCleanupCompleteRef.current = onCleanupComplete
  }, [onWarning, onCritical, onCleanupComplete])

  // Check storage quota
  const checkStorage = useCallback(async () => {
    try {
      setError(null)
      const health = await checkStorageHealth()
      setStorageInfo(health)

      // Trigger callbacks based on status
      if (health.status === 'warning' && onWarningRef.current) {
        onWarningRef.current(health)
      } else if (health.status === 'critical' && onCriticalRef.current) {
        onCriticalRef.current(health)
      }

      return health
    } catch (err) {
      const errorMessage = 'Failed to check storage quota'
      setError(errorMessage)
      if (import.meta.env.DEV) {
        console.error(errorMessage, err)
      }
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Perform cleanup
  const performCleanup = useCallback(async (options = {}) => {
    const {
      cleanSyncQueue = true,
      cleanOldData = true,
      cleanOrphaned = true,
      maxAge = STORAGE_CONFIG.MAX_DATA_AGE_DAYS
    } = options

    setIsCleaningUp(true)
    setCleanupResults(null)
    setError(null)

    try {
      const cleanup = new CleanupManager()
      const results = {
        totalCleaned: 0,
        details: {}
      }

      // Clean sync queue
      if (cleanSyncQueue) {
        const syncCleaned = await cleanup.cleanupSyncQueue()
        results.details.syncQueue = syncCleaned
        results.totalCleaned += syncCleaned
      }

      // Clean old data
      if (cleanOldData) {
        // Temporarily override max age if provided
        if (maxAge !== cleanup.MAX_AGE_DAYS) {
          cleanup.MAX_AGE_DAYS = maxAge
        }

        const oldDataResults = await cleanup.cleanupOldData()
        results.details.oldData = oldDataResults
        results.totalCleaned += oldDataResults.totalCleaned
      }

      // Clean orphaned records
      if (cleanOrphaned) {
        const orphanedResults = await cleanup.findAndRemoveOrphanedRecords()
        results.details.orphaned = orphanedResults
        results.totalCleaned += orphanedResults.removed
      }

      setCleanupResults(results)

      // Refresh storage info
      await checkStorage()

      // Trigger callback
      if (onCleanupCompleteRef.current) {
        onCleanupCompleteRef.current(results)
      }

      return results
    } catch (err) {
      const errorMessage = 'Cleanup failed'
      setError(errorMessage)
      if (import.meta.env.DEV) {
        console.error(errorMessage, err)
      }
      return null
    } finally {
      setIsCleaningUp(false)
    }
  }, [checkStorage])

  // Request persistent storage
  const requestPersistentStorage = useCallback(async () => {
    try {
      const storageManager = getStorageManager()
      const granted = await storageManager.requestPersistentStorage()
      return granted
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to request persistent storage:', err)
      }
      return false
    }
  }, [])

  // Check if storage is persisted
  const isStoragePersisted = useCallback(async () => {
    try {
      const storageManager = getStorageManager()
      return await storageManager.isStoragePersisted()
    } catch {
      return false
    }
  }, [])

  // Get cleanup recommendations
  const getRecommendations = useCallback(() => {
    if (!storageInfo) return []

    const cleanup = new CleanupManager()
    return cleanup.getCleanupRecommendations(
      storageInfo,
      storageInfo.databaseRecords
    )
  }, [storageInfo])

  // Perform auto cleanup if needed
  const performAutoCleanup = useCallback(async () => {
    if (!storageInfo || !STORAGE_CONFIG.ENABLE_AUTO_CLEANUP) {
      return null
    }

    const cleanup = new CleanupManager()
    const results = await cleanup.performAutoCleanup(storageInfo.status)

    if (results.performed) {
      // Refresh storage info
      await checkStorage()

      // Trigger callback
      if (onCleanupCompleteRef.current) {
        onCleanupCompleteRef.current(results)
      }
    }

    return results
  }, [storageInfo, checkStorage])

  // Initial check
  useEffect(() => {
    if (autoCheck) {
      checkStorage()
    }
  }, [autoCheck, checkStorage])

  // Periodic check
  useEffect(() => {
    if (!autoCheck || checkInterval <= 0) return

    const intervalId = setInterval(checkStorage, checkInterval)
    return () => clearInterval(intervalId)
  }, [autoCheck, checkInterval, checkStorage])

  // Listen for storage events
  useEffect(() => {
    const handleStorageWarning = (event) => {
      checkStorage()
      if (onWarningRef.current) {
        onWarningRef.current(event.detail)
      }
    }

    const handleStorageCritical = (event) => {
      checkStorage()
      if (onCriticalRef.current) {
        onCriticalRef.current(event.detail)
      }

      // Perform auto cleanup if enabled
      if (STORAGE_CONFIG.ENABLE_AUTO_CLEANUP) {
        performAutoCleanup()
      }
    }

    window.addEventListener('storage-warning', handleStorageWarning)
    window.addEventListener('storage-critical', handleStorageCritical)

    return () => {
      window.removeEventListener('storage-warning', handleStorageWarning)
      window.removeEventListener('storage-critical', handleStorageCritical)
    }
  }, [checkStorage, performAutoCleanup])

  // Calculate derived values
  const percentage = storageInfo?.percentage || 0
  const status = storageInfo?.status || 'unknown'
  const isHealthy = status === 'healthy'
  const isWarning = status === 'warning'
  const isCritical = status === 'critical'
  const canWrite = !isCritical

  return {
    // State
    storageInfo,
    isLoading,
    error,
    isCleaningUp,
    cleanupResults,

    // Derived values
    percentage,
    status,
    isHealthy,
    isWarning,
    isCritical,
    canWrite,

    // Actions
    checkStorage,
    performCleanup,
    performAutoCleanup,
    requestPersistentStorage,
    isStoragePersisted,
    getRecommendations,

    // Utilities
    formatBytes: (bytes) => {
      const storageManager = getStorageManager()
      return storageManager.formatBytes(bytes)
    }
  }
}

export default useStorageQuota