/**
 * UndoRedoControls Component
 *
 * Visual undo/redo buttons for toolbar with disabled states
 */

import { Button } from '@/components/ui/button'
import { Undo2, Redo2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UndoRedoControlsProps {
  canUndo?: boolean;
  canRedo?: boolean;
  undoCount?: number;
  redoCount?: number;
  onUndo?: () => void;
  onRedo?: () => void;
  showCounts?: boolean;
  className?: string;
}

export default function UndoRedoControls({
  canUndo,
  canRedo,
  undoCount,
  redoCount,
  onUndo,
  onRedo,
  showCounts = false,
  className
}: UndoRedoControlsProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onUndo}
        disabled={!canUndo}
        className="h-10 px-3 min-w-[44px]"
        aria-label={`Undo (${undoCount} available)`}
        title={`Undo${undoCount && undoCount > 0 ? ` (${undoCount})` : ''} - Ctrl+Z`}
      >
        <Undo2 className="h-4 w-4" />
        {showCounts && undoCount && undoCount > 0 && (
          <span className="ml-1 text-xs text-muted-foreground hidden sm:inline">
            {undoCount}
          </span>
        )}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onRedo}
        disabled={!canRedo}
        className="h-10 px-3 min-w-[44px]"
        aria-label={`Redo (${redoCount} available)`}
        title={`Redo${redoCount && redoCount > 0 ? ` (${redoCount})` : ''} - Ctrl+Y`}
      >
        <Redo2 className="h-4 w-4" />
        {showCounts && redoCount && redoCount > 0 && (
          <span className="ml-1 text-xs text-muted-foreground hidden sm:inline">
            {redoCount}
          </span>
        )}
      </Button>
    </div>
  )
}
