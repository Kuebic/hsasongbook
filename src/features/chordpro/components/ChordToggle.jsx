/**
 * ChordToggle Component
 *
 * Toggle button for showing/hiding chords in the ChordPro viewer
 * Matches existing toggle patterns in the codebase
 */

import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ChordToggle({
  showChords,
  onToggle,
  className,
  size = 'sm',
  variant = 'outline'
}) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onToggle}
      className={cn('chord-toggle-button', className)}
      aria-label={showChords ? 'Hide chords' : 'Show chords'}
      aria-pressed={showChords}
    >
      {showChords ? (
        <>
          <EyeOff className="mr-2 h-4 w-4" />
          Hide Chords
        </>
      ) : (
        <>
          <Eye className="mr-2 h-4 w-4" />
          Show Chords
        </>
      )}
    </Button>
  )
}