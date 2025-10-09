/**
 * SaveStatusIndicator Component
 *
 * Enhanced save status with timestamp and dirty indicator
 */

import { Clock, Loader2, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SAVE_STATUS } from '../hooks/useArrangementSave'

interface SaveStatusIndicatorProps {
  saveStatus?: string;
  lastSaved?: Date | null;
  isDirty?: boolean;
  saveError?: string | null;
  className?: string;
  showTimestamp?: boolean;
}

export default function SaveStatusIndicator({
  saveStatus,
  lastSaved,
  isDirty,
  saveError,
  className,
  showTimestamp = true
}: SaveStatusIndicatorProps) {
  const formatTime = (date: Date | null): string => {
    if (!date) return ''
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusContent = () => {
    switch (saveStatus) {
      case SAVE_STATUS.SAVING:
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin text-blue-600" />,
          text: 'Saving...',
          color: 'text-blue-600'
        }

      case SAVE_STATUS.SAVED:
        return {
          icon: <CheckCircle2 className="h-3 w-3 text-green-600" />,
          text: lastSaved && showTimestamp
            ? `Saved at ${formatTime(lastSaved)}`
            : 'Saved',
          color: 'text-green-600'
        }

      case SAVE_STATUS.ERROR:
        return {
          icon: <AlertCircle className="h-3 w-3 text-destructive" />,
          text: saveError || 'Error - Retry',
          color: 'text-destructive'
        }

      case SAVE_STATUS.CONFLICT:
        return {
          icon: <AlertTriangle className="h-3 w-3 text-amber-600" />,
          text: 'Conflict detected',
          color: 'text-amber-600'
        }

      case SAVE_STATUS.DIRTY:
        return {
          icon: <Clock className="h-3 w-3 text-muted-foreground" />,
          text: 'Unsaved changes*',
          color: 'text-muted-foreground font-medium'
        }

      case SAVE_STATUS.IDLE:
      default:
        if (isDirty) {
          return {
            icon: <Clock className="h-3 w-3 text-muted-foreground" />,
            text: 'Unsaved changes*',
            color: 'text-muted-foreground font-medium'
          }
        }
        return null
    }
  }

  const status = getStatusContent()

  if (!status) return null

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs',
        status.color,
        className
      )}
      role="status"
      aria-live="polite"
    >
      {status.icon}
      <span>{status.text}</span>
    </div>
  )
}
