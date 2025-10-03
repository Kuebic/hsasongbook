/**
 * EditorToolbar Component
 *
 * Simplified toolbar with only Save and Undo/Redo controls.
 * Chord/directive insertion removed - users type chords and metadata directly.
 * Metadata editing now done via ArrangementMetadataForm.
 */

import { cn } from '@/lib/utils'
import SaveButton from './SaveButton'
import UndoRedoControls from './UndoRedoControls'
import SaveStatusIndicator from './SaveStatusIndicator'

export default function EditorToolbar({
  className,
  // Save-related props
  saveStatus,
  onSave,
  isDirty,
  lastSaved,
  saveError,
  // Undo/redo props
  canUndo,
  canRedo,
  undoCount,
  redoCount,
  onUndo,
  onRedo,
  // Display options
  showSaveControls = true,
  showUndoRedo = true
}) {
  return (
    <div className={cn('editor-toolbar flex items-center gap-2 flex-wrap p-2 bg-muted/30 rounded-md', className)}>
      {/* Save section */}
      {showSaveControls && (
        <>
          <div className="flex items-center gap-2">
            <SaveButton
              saveStatus={saveStatus}
              onSave={onSave}
              isDirty={isDirty}
            />
            <SaveStatusIndicator
              saveStatus={saveStatus}
              lastSaved={lastSaved}
              isDirty={isDirty}
              saveError={saveError}
            />
          </div>
          <div className="h-6 w-px bg-border" />
        </>
      )}

      {/* Undo/redo section */}
      {showUndoRedo && (
        <UndoRedoControls
          canUndo={canUndo}
          canRedo={canRedo}
          undoCount={undoCount}
          redoCount={redoCount}
          onUndo={onUndo}
          onRedo={onRedo}
          showCounts={true}
        />
      )}
    </div>
  )
}