/**
 * useUndoRedo Hook
 *
 * Visual undo/redo state management with CodeMirror 6 integration
 * Exposes undo/redo functionality for toolbar buttons
 */

import { useState, useEffect, useCallback } from 'react'
import { EditorView } from '@codemirror/view'
import { undo, redo, undoDepth, redoDepth } from '@codemirror/commands'
import logger from '@/lib/logger'
import type { UndoRedoState, UseUndoRedoReturn } from '../types'

/**
 * useUndoRedo Hook
 *
 * @param editorView - CodeMirror EditorView instance
 * @returns Undo/redo state and operations
 */
export function useUndoRedo(editorView: EditorView | null): UseUndoRedoReturn {
  const [undoRedoState, setUndoRedoState] = useState<UndoRedoState>({
    canUndo: false,
    canRedo: false,
    undoCount: 0,
    redoCount: 0
  })

  /**
   * Update undo/redo state from EditorView
   */
  const updateState = useCallback((): void => {
    if (!editorView) return

    try {
      const state = editorView.state

      const newState: UndoRedoState = {
        canUndo: undoDepth(state) > 0,
        canRedo: redoDepth(state) > 0,
        undoCount: undoDepth(state),
        redoCount: redoDepth(state)
      }

      setUndoRedoState(newState)

      logger.debug('Undo/redo state updated:', newState)
    } catch (error) {
      logger.error('Failed to update undo/redo state:', error)
    }
  }, [editorView])

  /**
   * Execute undo command
   */
  const executeUndo = useCallback((): boolean => {
    if (!editorView || !undoRedoState.canUndo) {
      logger.debug('Undo not available')
      return false
    }

    try {
      const result = undo(editorView)
      updateState()
      logger.debug('Undo executed:', result)
      return result
    } catch (error) {
      logger.error('Undo failed:', error)
      return false
    }
  }, [editorView, undoRedoState.canUndo, updateState])

  /**
   * Execute redo command
   */
  const executeRedo = useCallback((): boolean => {
    if (!editorView || !undoRedoState.canRedo) {
      logger.debug('Redo not available')
      return false
    }

    try {
      const result = redo(editorView)
      updateState()
      logger.debug('Redo executed:', result)
      return result
    } catch (error) {
      logger.error('Redo failed:', error)
      return false
    }
  }, [editorView, undoRedoState.canRedo, updateState])

  /**
   * Monitor editor changes to update state
   */
  useEffect(() => {
    if (!editorView) return

    // Update state immediately
    updateState()

    // Note: CodeMirror 6 update listeners are managed by the view configuration
    // We manually update state on each docChanged event through the parent component
    // The listener will be garbage collected with the view

    return () => {
      // Cleanup if needed
      logger.debug('Undo/redo hook cleanup')
    }
  }, [editorView, updateState])

  /**
   * Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
   * Note: These are already handled by CodeMirror's historyKeymap
   * This hook just exposes the state and manual trigger functions
   */

  return {
    // State
    ...undoRedoState,

    // Operations
    executeUndo,
    executeRedo,

    // Refresh state manually
    updateState
  }
}

/**
 * Default export for convenient importing
 */
export default useUndoRedo
