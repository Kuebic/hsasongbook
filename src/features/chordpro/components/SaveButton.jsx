/**
 * SaveButton Component
 *
 * Explicit save button with loading and error states
 */

import { Button } from '@/components/ui/button'
import { Save, Loader2, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SAVE_STATUS } from '../hooks/useArrangementSave'

export default function SaveButton({
  saveStatus,
  onSave,
  isDirty,
  className,
  showText = true,
  variant = 'default'
}) {
  const getButtonContent = () => {
    switch (saveStatus) {
      case SAVE_STATUS.SAVING:
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: 'Saving...',
          variant: 'default',
          disabled: true
        }

      case SAVE_STATUS.SAVED:
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
          text: 'Saved',
          variant: 'ghost',
          disabled: !isDirty
        }

      case SAVE_STATUS.ERROR:
        return {
          icon: <AlertCircle className="h-4 w-4 text-destructive" />,
          text: 'Retry',
          variant: 'destructive',
          disabled: false
        }

      case SAVE_STATUS.CONFLICT:
        return {
          icon: <RefreshCcw className="h-4 w-4 text-amber-600" />,
          text: 'Conflict',
          variant: 'outline',
          disabled: false
        }

      case SAVE_STATUS.DIRTY:
      case SAVE_STATUS.IDLE:
      default:
        return {
          icon: <Save className="h-4 w-4" />,
          text: isDirty ? 'Save*' : 'Save',
          variant: isDirty ? variant : 'ghost',
          disabled: false
        }
    }
  }

  const content = getButtonContent()

  return (
    <Button
      variant={content.variant}
      size="sm"
      onClick={onSave}
      disabled={content.disabled}
      className={cn(
        'h-10 px-3 min-w-[44px] gap-2',
        isDirty && 'font-medium',
        className
      )}
      aria-label={`${content.text} - Ctrl+S`}
      title={`${content.text}${isDirty ? ' (unsaved changes)' : ''} - Ctrl+S`}
    >
      {content.icon}
      {showText && <span className="hidden sm:inline">{content.text}</span>}
    </Button>
  )
}
