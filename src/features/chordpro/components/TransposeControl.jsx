/**
 * TransposeControl Component
 *
 * Simple transposition controls with up/down buttons
 * Mobile-optimized with large touch targets for responsive design
 */

import { Button } from '@/components/ui/button'
import { ChevronUp, ChevronDown, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function TransposeControl({
  currentKey = 'C',
  onTranspose,
  onReset,
  transpositionOffset = 0,
  disabled = false,
  className
}) {
  // Check if we're transposed
  const isTransposed = transpositionOffset !== 0

  // Can we transpose further?
  const canTransposeUp = transpositionOffset < 11
  const canTransposeDown = transpositionOffset > -11

  // Handle transpose up/down
  const handleTransposeUp = () => {
    if (canTransposeUp) {
      onTranspose?.(1)
    }
  }

  const handleTransposeDown = () => {
    if (canTransposeDown) {
      onTranspose?.(-1)
    }
  }

  // Simple responsive control layout
  return (
    <div className={cn('transpose-control flex items-center gap-2 flex-wrap', className)}>
      {/* Down button */}
      <Button
        size="sm"
        variant="outline"
        onClick={handleTransposeDown}
        disabled={disabled || !canTransposeDown}
        className="h-9 w-9 sm:h-10 sm:w-auto sm:px-3"
        aria-label="Transpose down"
      >
        <ChevronDown className="h-4 w-4 sm:mr-1" />
        <span className="hidden sm:inline">Down</span>
      </Button>

      {/* Current key display */}
      <div className="flex items-center gap-1 px-2">
        <span className="text-sm text-muted-foreground">Key:</span>
        <span className="text-base font-semibold min-w-[2rem] text-center">{currentKey}</span>
        {isTransposed && (
          <span className="text-xs text-muted-foreground">
            ({transpositionOffset > 0 ? '+' : ''}{transpositionOffset})
          </span>
        )}
      </div>

      {/* Up button */}
      <Button
        size="sm"
        variant="outline"
        onClick={handleTransposeUp}
        disabled={disabled || !canTransposeUp}
        className="h-9 w-9 sm:h-10 sm:w-auto sm:px-3"
        aria-label="Transpose up"
      >
        <ChevronUp className="h-4 w-4 sm:mr-1" />
        <span className="hidden sm:inline">Up</span>
      </Button>

      {/* Reset button - only show when transposed */}
      {isTransposed && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onReset}
          disabled={disabled}
          className="h-9 sm:h-10"
          aria-label="Reset to original key"
        >
          <RotateCcw className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Reset</span>
        </Button>
      )}
    </div>
  )
}