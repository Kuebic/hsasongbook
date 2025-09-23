/**
 * AutoSaveIndicator Component
 *
 * Visual feedback component for auto-save status with animations
 * Shows saving state, saved confirmation, and error states
 */

import { useEffect, useState } from 'react'
import { Check, AlertTriangle, Loader2, Clock, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AUTO_SAVE_STATUS } from '../hooks/useAutoSave'

/**
 * Format time since last save for display
 * @param {Date|null} lastSaved - Last save timestamp
 * @returns {string} Formatted time string
 */
function formatTimeSince(lastSaved) {
  if (!lastSaved) return ''

  const now = new Date()
  const diff = Math.floor((now - lastSaved) / 1000) // seconds

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function AutoSaveIndicator({
  status = AUTO_SAVE_STATUS.IDLE,
  lastSaved = null,
  saveError = null,
  hasUnsavedChanges = false,
  enabled = true,
  className,
  compact = false
}) {
  const [visible, setVisible] = useState(false)
  const [showTime, setShowTime] = useState(false)

  // Control visibility based on status
  useEffect(() => {
    const shouldShow = status !== AUTO_SAVE_STATUS.IDLE || saveError || !enabled

    if (shouldShow) {
      setVisible(true)
    } else {
      // Hide after delay when returning to idle
      const timer = setTimeout(() => setVisible(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [status, saveError, enabled])

  // Toggle time display on click/hover
  const handleToggleTime = () => {
    setShowTime(!showTime)
  }

  // Don't render if disabled and no error
  if (!enabled && !saveError) {
    return null
  }

  // Don't render if idle and no unsaved changes
  if (!visible && status === AUTO_SAVE_STATUS.IDLE && !hasUnsavedChanges) {
    return null
  }

  // Determine icon and styling based on status
  const getStatusConfig = () => {
    switch (status) {
      case AUTO_SAVE_STATUS.SAVING:
        return {
          icon: Loader2,
          iconClass: 'animate-spin text-blue-500',
          text: 'Saving...',
          bgClass: 'bg-blue-50 border-blue-200',
          textClass: 'text-blue-700'
        }

      case AUTO_SAVE_STATUS.SAVED:
        return {
          icon: Check,
          iconClass: 'text-green-500',
          text: showTime && lastSaved ? formatTimeSince(lastSaved) : 'Saved',
          bgClass: 'bg-green-50 border-green-200',
          textClass: 'text-green-700'
        }

      case AUTO_SAVE_STATUS.ERROR:
        return {
          icon: AlertTriangle,
          iconClass: 'text-red-500',
          text: saveError || 'Save failed',
          bgClass: 'bg-red-50 border-red-200',
          textClass: 'text-red-700'
        }

      case AUTO_SAVE_STATUS.DISABLED:
        return {
          icon: WifiOff,
          iconClass: 'text-gray-400',
          text: 'Auto-save off',
          bgClass: 'bg-gray-50 border-gray-200',
          textClass: 'text-gray-600'
        }

      default:
        if (hasUnsavedChanges) {
          return {
            icon: Clock,
            iconClass: 'text-amber-500',
            text: 'Unsaved changes',
            bgClass: 'bg-amber-50 border-amber-200',
            textClass: 'text-amber-700'
          }
        }
        return {
          icon: Wifi,
          iconClass: 'text-gray-400',
          text: 'Auto-save on',
          bgClass: 'bg-gray-50 border-gray-200',
          textClass: 'text-gray-600'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  // Compact version for mobile
  if (compact) {
    return (
      <div
        className={cn(
          'auto-save-indicator inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs transition-all duration-200',
          config.bgClass,
          config.textClass,
          'cursor-pointer',
          className
        )}
        onClick={handleToggleTime}
        title={`Last saved: ${lastSaved ? lastSaved.toLocaleString() : 'Never'}`}
      >
        <Icon className={cn('h-3 w-3', config.iconClass)} />
        {status === AUTO_SAVE_STATUS.SAVING && (
          <span className="sr-only">Saving...</span>
        )}
      </div>
    )
  }

  // Full version with text
  return (
    <div
      className={cn(
        'auto-save-indicator inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-all duration-200',
        config.bgClass,
        config.textClass,
        'cursor-pointer select-none',
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        className
      )}
      onClick={handleToggleTime}
      title={
        lastSaved
          ? `Last saved: ${lastSaved.toLocaleString()}`
          : 'No saves yet'
      }
    >
      <Icon className={cn('h-4 w-4 flex-shrink-0', config.iconClass)} />

      <span className="font-medium whitespace-nowrap">
        {config.text}
      </span>

      {/* Additional status info */}
      {status === AUTO_SAVE_STATUS.SAVED && lastSaved && !showTime && (
        <span className="text-xs opacity-75 hidden sm:inline">
          ({formatTimeSince(lastSaved)})
        </span>
      )}

      {/* Error details on hover/click */}
      {status === AUTO_SAVE_STATUS.ERROR && saveError && showTime && (
        <span className="text-xs opacity-75 max-w-[200px] truncate">
          {saveError}
        </span>
      )}

      {/* Accessibility */}
      <span className="sr-only">
        Auto-save status: {status}
        {lastSaved && `, last saved ${formatTimeSince(lastSaved)}`}
        {saveError && `, error: ${saveError}`}
      </span>
    </div>
  )
}

/**
 * Simplified status dot indicator for minimal UI
 */
export function AutoSaveStatusDot({
  status = AUTO_SAVE_STATUS.IDLE,
  hasUnsavedChanges = false,
  className
}) {
  const getStatusColor = () => {
    switch (status) {
      case AUTO_SAVE_STATUS.SAVING:
        return 'bg-blue-500 animate-pulse'
      case AUTO_SAVE_STATUS.SAVED:
        return hasUnsavedChanges ? 'bg-amber-500' : 'bg-green-500'
      case AUTO_SAVE_STATUS.ERROR:
        return 'bg-red-500'
      case AUTO_SAVE_STATUS.DISABLED:
        return 'bg-gray-300'
      default:
        return hasUnsavedChanges ? 'bg-amber-500' : 'bg-gray-300'
    }
  }

  const getStatusLabel = () => {
    switch (status) {
      case AUTO_SAVE_STATUS.SAVING:
        return 'Saving'
      case AUTO_SAVE_STATUS.SAVED:
        return hasUnsavedChanges ? 'Unsaved changes' : 'Saved'
      case AUTO_SAVE_STATUS.ERROR:
        return 'Save failed'
      case AUTO_SAVE_STATUS.DISABLED:
        return 'Auto-save disabled'
      default:
        return hasUnsavedChanges ? 'Unsaved changes' : 'No changes'
    }
  }

  return (
    <div
      className={cn(
        'auto-save-dot h-2 w-2 rounded-full transition-colors duration-200',
        getStatusColor(),
        className
      )}
      title={getStatusLabel()}
      aria-label={getStatusLabel()}
    />
  )
}