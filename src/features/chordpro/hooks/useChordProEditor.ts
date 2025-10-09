/**
 * useChordProEditor Hook
 *
 * Main editor state management hook with CodeMirror 6 integration
 * Maintains compatibility with existing useChordSheet hook interface
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { EditorView, keymap } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { bracketMatching, indentOnInput } from '@codemirror/language'
import { chordproConfig } from '@/lib/config'
import chordProLanguage from '../language/chordProLanguage'
import { createChordProHighlighting } from '../language/chordProHighlight'
import { useChordSheet } from './useChordSheet'
import type { UseChordProEditorOptions, UseChordProEditorReturn, EditorSelection } from '../types'

/**
 * useChordProEditor Hook
 *
 * @param options - Editor configuration options
 * @returns Editor state and configuration
 */
export function useChordProEditor(options: UseChordProEditorOptions = {}): UseChordProEditorReturn {
  const {
    value = '',
    onChange,
    disabled = false,
    placeholder = 'Enter ChordPro content...',
    editorConfig = {}
  } = options

  // Get configuration with overrides
  const config = useMemo(() => ({
    ...chordproConfig.editor,
    ...editorConfig
  }), [editorConfig])

  // Editor state
  const [content, setContent] = useState<string>(value)
  const [isDirty, setIsDirty] = useState<boolean>(false)
  const [hasErrors, setHasErrors] = useState<boolean>(false)
  const [cursorPosition, setCursorPosition] = useState<number>(0)
  const [selection, setSelection] = useState<EditorSelection | null>(null)

  // Refs for editor management
  const editorViewRef = useRef<EditorView | null>(null)

  // Integrate with existing ChordSheet parsing for compatibility
  const chordSheetResult = useChordSheet(content, true)

  // Sync with external value prop
  useEffect(() => {
    if (value !== content) {
      setContent(value)
      setIsDirty(false)
    }
  }, [value, content])

  // Handle content changes
  const handleChange = useCallback((newContent: string): void => {
    setContent(newContent)
    setIsDirty(newContent !== value)

    // Update cursor position and selection if editor view exists
    if (editorViewRef.current) {
      const state = editorViewRef.current.state
      setCursorPosition(state.selection.main.head)
      setSelection(
        state.selection.main.empty
          ? null
          : { from: state.selection.main.from, to: state.selection.main.to }
      )
    }

    // Call external onChange handler
    if (onChange) {
      onChange(newContent)
    }
  }, [value, onChange])

  // Create editor extensions
  const extensions = useMemo(() => {
    const baseExtensions = [
      // Language support
      chordProLanguage,
      createChordProHighlighting(),

      // Note: Autocomplete disabled - bracket auto-closing handled by language config
      // See chordProLanguage.js: closeBrackets: { brackets: ['[', '{'] }

      // Basic editing features
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),

      // Language features
      bracketMatching(),
      indentOnInput(),

      // Editor configuration
      EditorView.lineWrapping,
      EditorState.allowMultipleSelections.of(false),

      // Mobile optimizations
      EditorView.theme({
        '&': {
          fontSize: '16px', // Prevent zoom on iOS
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
        },
        '.cm-content': {
          padding: '12px',
          minHeight: config.editor.minHeight,
          maxHeight: config.editor.maxHeight,
          lineHeight: '1.6'
        },
        '.cm-focused': {
          outline: 'none'
        },
        '.cm-editor.cm-focused': {
          outline: 'none'
        },
        // Mobile cursor optimization
        '.cm-cursor': {
          borderLeftWidth: '2px'
        },
        '@media (max-width: 768px)': {
          '&': {
            fontSize: '16px'
          },
          '.cm-content': {
            padding: '16px'
          },
          '.cm-cursor': {
            borderLeftWidth: '3px'
          }
        }
      }),

      // Content attributes
      EditorView.contentAttributes.of({
        spellcheck: config.editor.spellcheck ? 'true' : 'false',
        autocapitalize: 'off',
        autocorrect: 'off'
      }),

      // Update listener for React synchronization
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newContent = update.state.doc.toString()
          handleChange(newContent)
        }

        if (update.selectionSet) {
          const state = update.state
          setCursorPosition(state.selection.main.head)
          setSelection(
            state.selection.main.empty
              ? null
              : { from: state.selection.main.from, to: state.selection.main.to }
          )
        }
      })
    ]

    // Line numbers are handled in basicSetup configuration

    // Disable editor if disabled prop is true
    if (disabled) {
      baseExtensions.push(EditorState.readOnly.of(true))
    }

    return baseExtensions
  }, [config, disabled, handleChange])

  // Editor configuration for @uiw/react-codemirror
  const editorProps = useMemo(() => ({
    value: content,
    placeholder,
    extensions,
    editable: !disabled,
    autoFocus: false,
    basicSetup: {
      lineNumbers: config.editor.lineNumbers,
      highlightActiveLine: true,
      highlightSelectionMatches: false,
      searchKeymap: true,
      bracketMatching: true,
      autocompletion: false, // Disabled - no completion source provided
      rectangularSelection: false,
      history: true
    },
    onChange: handleChange
  }), [content, placeholder, extensions, disabled, config.editor.lineNumbers, handleChange])

  // Expose editor view for toolbar integration
  const setEditorView = useCallback((view: EditorView | null): void => {
    editorViewRef.current = view
  }, [])

  // Editor utility functions
  const insertText = useCallback((text: string, position: number | null = null): void => {
    if (!editorViewRef.current) return

    const view = editorViewRef.current
    const pos = position ?? view.state.selection.main.head

    view.dispatch({
      changes: { from: pos, insert: text },
      selection: { anchor: pos + text.length }
    })
  }, [])

  const insertChord = useCallback((chord: string): void => {
    insertText(`[${chord}]`)
  }, [insertText])

  const insertDirective = useCallback((directive: string, argument: string = ''): void => {
    const text = argument ? `{${directive}: ${argument}}` : `{${directive}}`
    insertText(text)
  }, [insertText])

  const getSelectedText = useCallback((): string => {
    if (!editorViewRef.current || !selection) return ''

    const state = editorViewRef.current.state
    return state.doc.sliceString(selection.from, selection.to)
  }, [selection])

  const replaceSelection = useCallback((text: string): void => {
    if (!editorViewRef.current) return

    const view = editorViewRef.current
    const selection = view.state.selection.main

    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: text },
      selection: { anchor: selection.from + text.length }
    })
  }, [])

  const focusEditor = useCallback((): void => {
    if (editorViewRef.current) {
      editorViewRef.current.focus()
    }
  }, [])

  // Validation state based on ChordSheet parsing
  useEffect(() => {
    setHasErrors(!!chordSheetResult.error)
  }, [chordSheetResult.error])

  // Return editor state and utilities
  return {
    // Editor configuration for @uiw/react-codemirror
    editorProps,
    setEditorView,

    // Editor state
    content,
    isDirty,
    hasErrors,
    cursorPosition,
    selection,

    // ChordSheet integration (maintains compatibility)
    ...chordSheetResult,

    // Editor utilities
    insertText,
    insertChord,
    insertDirective,
    getSelectedText,
    replaceSelection,
    focusEditor,

    // Configuration
    config
  }
}

/**
 * Default export for convenient importing
 */
export default useChordProEditor