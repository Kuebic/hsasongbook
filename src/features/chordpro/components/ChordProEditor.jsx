/**
 * ChordProEditor Component
 *
 * Main editor component wrapping CodeMirror with toolbar and auto-save
 * Integrates all ChordPro editor functionality with mobile optimization
 */

import { useRef, useEffect, useState, useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useChordProEditor } from '../hooks/useChordProEditor'
import { useAutoSave } from '../hooks/useAutoSave'
import EditorToolbar from './EditorToolbar'
import AutoSaveIndicator from './AutoSaveIndicator'
import { chordProStyles } from '../language/chordProHighlight'

export default function ChordProEditor({
  value = '',
  onChange,
  onSave,
  disabled = false,
  placeholder = 'Enter ChordPro content...',
  arrangementId,
  autoSave = true,
  showToolbar = true,
  showAutoSaveIndicator = true,
  className,
  editorConfig = {}
}) {
  // Refs for editor management
  const editorViewRef = useRef(null)
  const containerRef = useRef(null)
  const [isMounted, setIsMounted] = useState(false)

  // Editor state management
  const editor = useChordProEditor({
    value,
    onChange,
    disabled,
    autoSave,
    placeholder,
    editorConfig
  })

  // Auto-save functionality
  const autoSaveState = useAutoSave(editor.content, {
    arrangementId,
    onSave,
    enabled: autoSave && !!arrangementId
  })

  // Track mount state for SSR compatibility
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Note: Editor view reference is managed internally by @uiw/react-codemirror
  // For advanced operations, we can use the editor utilities with the ref when needed

  // Inject custom CSS for ChordPro syntax highlighting
  useEffect(() => {
    const styleId = 'chordpro-editor-styles'

    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = chordProStyles
      document.head.appendChild(style)
    }

    return () => {
      // Cleanup on unmount if this is the last editor instance
      // (In practice, we keep the styles for performance)
    }
  }, [])

  // Handle content change
  const handleChange = useCallback((newValue) => {
    if (onChange) {
      onChange(newValue)
    }
  }, [onChange])

  // Force save handler
  const handleForceSave = useCallback(async () => {
    if (autoSaveState.forceSave) {
      const success = await autoSaveState.forceSave()
      if (success && onSave) {
        onSave(editor.content)
      }
      return success
    }
    return false
  }, [autoSaveState, onSave, editor.content])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+S / Cmd+S for manual save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        handleForceSave()
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('keydown', handleKeyDown)
      return () => {
        container.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [handleForceSave])

  // Container classes for responsive design
  const containerClasses = cn(
    'chordpro-editor',
    'relative',
    'w-full',
    className
  )

  // Don't render until mounted (SSR compatibility)
  if (!isMounted) {
    return (
      <Card className={containerClasses}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Loading editor...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={containerClasses} ref={containerRef}>
      <CardContent className="p-0">
        {/* Toolbar */}
        {showToolbar && (
          <div className="border-b">
            <EditorToolbar
              editorView={editorViewRef.current}
              disabled={disabled}
              className="border-none"
            />
          </div>
        )}

        {/* Editor container */}
        <div className="relative">
          {/* CodeMirror Editor */}
          <div className="chordpro-editor-container">
            <CodeMirror
              value={editor.content}
              placeholder={placeholder}
              extensions={editor.editorProps.extensions}
              editable={!disabled}
              onChange={handleChange}
              height="calc(100vh - 20rem)"
              minHeight="400px"
              maxHeight="calc(100vh - 10rem)"
              className={cn(
                'chordpro-codemirror',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              basicSetup={editor.editorProps.basicSetup}
              theme="light"
              data-testid="chordpro-editor"
            />
          </div>

          {/* Auto-save indicator */}
          {showAutoSaveIndicator && autoSave && arrangementId && (
            <div className="absolute top-3 right-3 z-10">
              <AutoSaveIndicator
                status={autoSaveState.saveStatus}
                lastSaved={autoSaveState.lastSaved}
                saveError={autoSaveState.saveError}
                hasUnsavedChanges={autoSaveState.hasUnsavedChanges}
                enabled={autoSaveState.enabled}
                compact={true}
              />
            </div>
          )}

          {/* Error state overlay */}
          {editor.hasErrors && editor.error && (
            <div className="absolute inset-x-3 top-3 z-20">
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <p className="text-sm text-destructive font-medium">
                  ChordPro Syntax Error
                </p>
                <p className="text-xs text-destructive/80 mt-1">
                  {editor.error}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="border-t bg-muted/30 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {/* Cursor position */}
            <span>
              Line {editor.cursorPosition ?
                editor.content.slice(0, editor.cursorPosition).split('\n').length : 1
              }
            </span>

            {/* Character count */}
            <span>
              {editor.content.length} characters
            </span>

            {/* Chord count */}
            {editor.hasChords && (
              <span>
                {(editor.content.match(/\[[^\]]+\]/g) || []).length} chords
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Auto-save status (text version for desktop) */}
            {showAutoSaveIndicator && autoSave && arrangementId && (
              <div className="hidden sm:block">
                <AutoSaveIndicator
                  status={autoSaveState.saveStatus}
                  lastSaved={autoSaveState.lastSaved}
                  saveError={autoSaveState.saveError}
                  hasUnsavedChanges={autoSaveState.hasUnsavedChanges}
                  enabled={autoSaveState.enabled}
                  compact={false}
                />
              </div>
            )}

            {/* Manual save shortcut hint */}
            <span className="hidden sm:inline opacity-75">
              {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+S to save
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Simplified ChordPro Editor without toolbar for embedding
 */
export function SimpleChordProEditor({
  value,
  onChange,
  disabled = false,
  placeholder = 'Enter ChordPro content...',
  className,
  height = '300px'
}) {
  const [isMounted, setIsMounted] = useState(false)

  const editor = useChordProEditor({
    value,
    onChange,
    disabled,
    placeholder,
    autoSave: false
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className={cn('border rounded-md p-4 bg-muted', className)}>
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          Loading editor...
        </div>
      </div>
    )
  }

  return (
    <div className={cn('chordpro-simple-editor border rounded-md overflow-hidden', className)}>
      <CodeMirror
        value={editor.content}
        placeholder={placeholder}
        extensions={editor.editorProps.extensions}
        editable={!disabled}
        onChange={onChange}
        height={height}
        className={cn(disabled && 'opacity-50 cursor-not-allowed')}
        basicSetup={editor.editorProps.basicSetup}
        theme="light"
      />
    </div>
  )
}