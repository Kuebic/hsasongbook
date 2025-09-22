// Storage indicator component for displaying storage status and cleanup options

import { useState, useEffect, useCallback } from 'react'
import { AlertCircle, HardDrive, Trash2, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getDatabase, checkStorageHealth, getStorageManager } from '../db/database'
import { CleanupManager } from '../db/cleanupManager'
import { STORAGE_CONFIG } from '../config/storage'

/**
 * StorageIndicator component displays storage status and provides cleanup options
 */
export function StorageIndicator({ className = '', showDetails = false }) {
  const [storageInfo, setStorageInfo] = useState(null)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [cleanupResults, setCleanupResults] = useState(null)
  const [showCleanupDialog, setShowCleanupDialog] = useState(false)
  const [error, setError] = useState(null)

  // Check storage on mount and periodically
  const checkStorage = useCallback(async () => {
    try {
      const health = await checkStorageHealth()
      setStorageInfo(health)
      setError(null)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error checking storage:', err)
      }
      setError('Unable to check storage status')
    }
  }, [])

  useEffect(() => {
    // Initial check
    checkStorage()

    // Set up periodic check if enabled
    if (STORAGE_CONFIG.SHOW_STORAGE_INDICATOR) {
      const interval = setInterval(checkStorage, STORAGE_CONFIG.STORAGE_CHECK_INTERVAL)
      return () => clearInterval(interval)
    }
  }, [checkStorage])

  // Listen for storage events
  useEffect(() => {
    const handleStorageWarning = (event) => {
      checkStorage()
      if (event.detail && event.detail.percentage > 80) {
        setShowCleanupDialog(true)
      }
    }

    const handleStorageCritical = () => {
      checkStorage()
      setShowCleanupDialog(true)
    }

    window.addEventListener('storage-warning', handleStorageWarning)
    window.addEventListener('storage-critical', handleStorageCritical)

    return () => {
      window.removeEventListener('storage-warning', handleStorageWarning)
      window.removeEventListener('storage-critical', handleStorageCritical)
    }
  }, [checkStorage])

  // Handle cleanup
  const handleCleanup = async () => {
    setIsCleaningUp(true)
    setCleanupResults(null)
    setError(null)

    try {
      const cleanup = new CleanupManager()
      const db = await getDatabase()

      // Perform comprehensive cleanup
      const results = {
        syncQueue: 0,
        oldData: { totalCleaned: 0 },
        orphaned: { removed: 0 }
      }

      // 1. Clean sync queue
      results.syncQueue = await cleanup.cleanupSyncQueue(db)

      // 2. Clean old data
      results.oldData = await cleanup.cleanupOldData(db)

      // 3. Remove orphaned records
      results.orphaned = await cleanup.findAndRemoveOrphanedRecords(db)

      const totalCleaned = results.syncQueue +
                          results.oldData.totalCleaned +
                          results.orphaned.removed

      setCleanupResults({
        success: true,
        totalCleaned,
        details: results
      })

      // Refresh storage info
      await checkStorage()

      // Show success notification
      const event = new CustomEvent('storage-cleanup-complete', {
        detail: {
          itemsRemoved: totalCleaned,
          message: `Freed up space: ${totalCleaned} items removed`
        }
      })
      window.dispatchEvent(event)

    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Cleanup failed:', err)
      }
      setError('Cleanup failed. Please try again.')
      setCleanupResults({
        success: false,
        error: err.message
      })
    } finally {
      setIsCleaningUp(false)
    }
  }

  // Request persistent storage
  const handleRequestPersistent = async () => {
    try {
      const storageManager = getStorageManager()
      const granted = await storageManager.requestPersistentStorage()

      if (granted) {
        const event = new CustomEvent('storage-persistent-granted', {
          detail: { message: 'Storage will not be cleared automatically' }
        })
        window.dispatchEvent(event)
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to request persistent storage:', err)
      }
    }
  }

  // Don't show if not supported or disabled
  if (!storageInfo || !storageInfo.supported || !STORAGE_CONFIG.SHOW_STORAGE_INDICATOR) {
    return null
  }

  const percentage = storageInfo.percentage || 0
  const status = storageInfo.status || 'healthy'

  // Only show if storage is getting full or user wants details
  if (status === 'healthy' && !showDetails && !showCleanupDialog) {
    return null
  }

  // Determine icon and color based on status
  const getStatusIcon = () => {
    switch (status) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <HardDrive className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'critical':
        return 'border-destructive bg-destructive/10'
      case 'warning':
        return 'border-yellow-600 bg-yellow-600/10'
      default:
        return 'border-border'
    }
  }

  // Simple indicator (non-detailed view)
  if (!showDetails && !showCleanupDialog) {
    return (
      <div
        className={`storage-indicator flex items-center gap-2 px-3 py-1.5 rounded-md border ${getStatusColor()} ${className}`}
        role="status"
        aria-label={`Storage ${Math.round(percentage)}% full`}
      >
        {getStatusIcon()}
        <span className="text-sm">
          {Math.round(percentage)}% storage used
        </span>
        {status === 'critical' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCleanup}
            disabled={isCleaningUp}
            className="ml-2 h-6 px-2"
          >
            {isCleaningUp ? (
              <>Cleaning...</>
            ) : (
              <>
                <Trash2 className="h-3 w-3 mr-1" />
                Free Space
              </>
            )}
          </Button>
        )}
      </div>
    )
  }

  // Detailed view / cleanup dialog
  return (
    <Card className={`storage-indicator-detailed ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <h3 className="font-semibold">Storage Status</h3>
            </div>
            {showCleanupDialog && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowCleanupDialog(false)}
              >
                Close
              </Button>
            )}
          </div>

          {/* Storage bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Used: {storageInfo.formattedUsage || 'Unknown'}</span>
              <span>Total: {storageInfo.formattedQuota || 'Unknown'}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  status === 'critical' ? 'bg-destructive' :
                  status === 'warning' ? 'bg-yellow-600' :
                  'bg-primary'
                }`}
                style={{ width: `${Math.min(100, percentage)}%` }}
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {storageInfo.formattedAvailable || '0 Bytes'} available
            </p>
          </div>

          {/* Database stats */}
          {storageInfo.databaseRecords && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Database Records:</p>
              <ul className="text-sm text-muted-foreground space-y-0.5">
                <li>Songs: {storageInfo.databaseRecords.songs || 0}</li>
                <li>Arrangements: {storageInfo.databaseRecords.arrangements || 0}</li>
                <li>Setlists: {storageInfo.databaseRecords.setlists || 0}</li>
                <li>Sync Queue: {storageInfo.databaseRecords.syncQueue || 0}</li>
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {storageInfo.recommendations && storageInfo.recommendations.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium flex items-center gap-1">
                <Info className="h-3 w-3" />
                Recommendations:
              </p>
              <ul className="text-sm text-muted-foreground space-y-0.5">
                {storageInfo.recommendations.map((rec, index) => (
                  <li key={index} className="ml-4">• {rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Cleanup results */}
          {cleanupResults && (
            <div className={`p-3 rounded-md ${
              cleanupResults.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {cleanupResults.success ? (
                <>
                  <p className="font-medium">Cleanup successful!</p>
                  <p className="text-sm mt-1">
                    Removed {cleanupResults.totalCleaned} items
                  </p>
                  {cleanupResults.details && (
                    <ul className="text-sm mt-2 space-y-0.5">
                      <li>Sync queue: {cleanupResults.details.syncQueue} items</li>
                      <li>Old data: {cleanupResults.details.oldData.totalCleaned} items</li>
                      <li>Orphaned records: {cleanupResults.details.orphaned.removed} items</li>
                    </ul>
                  )}
                </>
              ) : (
                <>
                  <p className="font-medium">Cleanup failed</p>
                  <p className="text-sm mt-1">{cleanupResults.error}</p>
                </>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-800">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleCleanup}
              disabled={isCleaningUp}
              variant={status === 'critical' ? 'destructive' : 'default'}
              size="sm"
              className="flex-1"
            >
              {isCleaningUp ? (
                <>Cleaning...</>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clean Up Storage
                </>
              )}
            </Button>
            <Button
              onClick={handleRequestPersistent}
              variant="outline"
              size="sm"
            >
              Make Persistent
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default StorageIndicator