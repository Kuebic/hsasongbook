/**
 * ChordPro Editor Helper Utilities
 *
 * Utility functions for editor operations and ChordPro text manipulation
 * Works with CodeMirror EditorView API for text manipulation
 */

import logger from '@/lib/logger'

/**
 * Insert text at a specific position in the editor
 * @param {EditorView} editorView - CodeMirror editor view
 * @param {string} text - Text to insert
 * @param {number|null} position - Position to insert at (null for current cursor)
 * @returns {boolean} Success status
 */
export function insertText(editorView, text, position = null) {
  if (!editorView) {
    logger.warn('insertText: editorView is required')
    return false
  }

  try {
    const pos = position ?? editorView.state.selection.main.head

    editorView.dispatch({
      changes: { from: pos, insert: text },
      selection: { anchor: pos + text.length }
    })

    logger.debug('Text inserted:', { text, position: pos })
    return true
  } catch (error) {
    logger.error('Failed to insert text:', error)
    return false
  }
}


/**
 * Get the currently selected text
 * @param {EditorView} editorView - CodeMirror editor view
 * @returns {string} Selected text or empty string
 */
export function getSelectedText(editorView) {
  if (!editorView) {
    return ''
  }

  const selection = editorView.state.selection.main
  if (selection.empty) {
    return ''
  }

  return editorView.state.doc.sliceString(selection.from, selection.to)
}

/**
 * Replace the current selection with new text
 * @param {EditorView} editorView - CodeMirror editor view
 * @param {string} text - Text to replace selection with
 * @returns {boolean} Success status
 */
export function replaceSelection(editorView, text) {
  if (!editorView) {
    logger.warn('replaceSelection: editorView is required')
    return false
  }

  try {
    const selection = editorView.state.selection.main

    editorView.dispatch({
      changes: { from: selection.from, to: selection.to, insert: text },
      selection: { anchor: selection.from + text.length }
    })

    logger.debug('Selection replaced:', { text, from: selection.from, to: selection.to })
    return true
  } catch (error) {
    logger.error('Failed to replace selection:', error)
    return false
  }
}

/**
 * Wrap selected text with chord notation
 * @param {EditorView} editorView - CodeMirror editor view
 * @param {string} chord - Chord to wrap with
 * @returns {boolean} Success status
 */
export function wrapSelectionWithChord(editorView, chord) {
  const selectedText = getSelectedText(editorView)
  if (!selectedText) {
    // No selection, insert chord at cursor
    const chordText = `[${chord}]`
    return insertText(editorView, chordText)
  }

  const wrappedText = `[${chord}]${selectedText}`
  return replaceSelection(editorView, wrappedText)
}

/**
 * Get the current line content
 * @param {EditorView} editorView - CodeMirror editor view
 * @returns {Object} Line information
 */
export function getCurrentLine(editorView) {
  if (!editorView) {
    return { text: '', from: 0, to: 0, number: 0 }
  }

  const pos = editorView.state.selection.main.head
  const line = editorView.state.doc.lineAt(pos)

  return {
    text: line.text,
    from: line.from,
    to: line.to,
    number: line.number
  }
}

/**
 * Get cursor position information
 * @param {EditorView} editorView - CodeMirror editor view
 * @returns {Object} Cursor position info
 */
export function getCursorPosition(editorView) {
  if (!editorView) {
    return { pos: 0, line: 0, column: 0 }
  }

  const pos = editorView.state.selection.main.head
  const line = editorView.state.doc.lineAt(pos)

  return {
    pos,
    line: line.number,
    column: pos - line.from
  }
}

/**
 * Move cursor to a specific position
 * @param {EditorView} editorView - CodeMirror editor view
 * @param {number} position - Position to move to
 * @returns {boolean} Success status
 */
export function moveCursor(editorView, position) {
  if (!editorView || typeof position !== 'number') {
    return false
  }

  try {
    editorView.dispatch({
      selection: { anchor: position }
    })
    return true
  } catch (error) {
    logger.error('Failed to move cursor:', error)
    return false
  }
}

/**
 * Select text range
 * @param {EditorView} editorView - CodeMirror editor view
 * @param {number} from - Start position
 * @param {number} to - End position
 * @returns {boolean} Success status
 */
export function selectRange(editorView, from, to) {
  if (!editorView || typeof from !== 'number' || typeof to !== 'number') {
    return false
  }

  try {
    editorView.dispatch({
      selection: { anchor: from, head: to }
    })
    return true
  } catch (error) {
    logger.error('Failed to select range:', error)
    return false
  }
}

/**
 * Focus the editor
 * @param {EditorView} editorView - CodeMirror editor view
 * @returns {boolean} Success status
 */
export function focusEditor(editorView) {
  if (!editorView) {
    return false
  }

  try {
    editorView.focus()
    return true
  } catch (error) {
    logger.error('Failed to focus editor:', error)
    return false
  }
}


/**
 * Format a single line of ChordPro text
 * @param {string} line - Line to format
 * @returns {string} Formatted line
 */
export function formatChordProLine(line) {
  if (!line || typeof line !== 'string') {
    return ''
  }

  return line
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\[\s*([^[\]]+)\s*\]/g, '[$1]') // Clean chord notation
    .replace(/\{\s*([^{}:]+)\s*:\s*([^{}]+)\s*\}/g, '{$1: $2}') // Clean directives with args
    .replace(/\{\s*([^{}:]+)\s*\}/g, '{$1}') // Clean directives without args
    .trim()
}

/**
 * Format ChordPro text (multiple lines)
 * @param {string} text - Text to format
 * @returns {string} Formatted text
 */
export function formatChordProText(text) {
  if (!text || typeof text !== 'string') {
    return ''
  }

  return text
    .split('\n')
    .map(line => formatChordProLine(line))
    .join('\n')
}

/**
 * Validate ChordPro syntax
 * @param {string} text - Text to validate
 * @returns {Object} Validation result
 */
export function validateChordProSyntax(text) {
  if (!text || typeof text !== 'string') {
    return { isValid: true, errors: [] }
  }

  const errors = []
  const lines = text.split('\n')

  lines.forEach((line, index) => {
    const lineNumber = index + 1

    // Check for unclosed chord brackets
    const openBrackets = (line.match(/\[/g) || []).length
    const closeBrackets = (line.match(/\]/g) || []).length
    if (openBrackets !== closeBrackets) {
      errors.push({
        line: lineNumber,
        type: 'chord-brackets',
        message: 'Mismatched chord brackets'
      })
    }

    // Check for unclosed directive braces
    const openBraces = (line.match(/\{/g) || []).length
    const closeBraces = (line.match(/\}/g) || []).length
    if (openBraces !== closeBraces) {
      errors.push({
        line: lineNumber,
        type: 'directive-braces',
        message: 'Mismatched directive braces'
      })
    }

    // Check for empty chord notation
    if (line.includes('[]')) {
      errors.push({
        line: lineNumber,
        type: 'empty-chord',
        message: 'Empty chord notation found'
      })
    }

    // Check for empty directive
    if (line.includes('{}')) {
      errors.push({
        line: lineNumber,
        type: 'empty-directive',
        message: 'Empty directive found'
      })
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Find all chords in the text
 * @param {string} text - Text to search
 * @returns {Array} Array of chord objects with position info
 */
export function findChords(text) {
  if (!text || typeof text !== 'string') {
    return []
  }

  const chordRegex = /\[([^\]]+)\]/g
  const chords = []
  let match

  while ((match = chordRegex.exec(text)) !== null) {
    chords.push({
      chord: match[1],
      fullMatch: match[0],
      start: match.index,
      end: match.index + match[0].length
    })
  }

  return chords
}

/**
 * Find all directives in the text
 * @param {string} text - Text to search
 * @returns {Array} Array of directive objects with position info
 */
export function findDirectives(text) {
  if (!text || typeof text !== 'string') {
    return []
  }

  const directiveRegex = /\{([^}:]+)(?:\s*:\s*([^}]+))?\}/g
  const directives = []
  let match

  while ((match = directiveRegex.exec(text)) !== null) {
    directives.push({
      name: match[1].trim(),
      argument: match[2] ? match[2].trim() : null,
      fullMatch: match[0],
      start: match.index,
      end: match.index + match[0].length
    })
  }

  return directives
}

/**
 * Convert text to title case
 * @param {string} text - Text to convert
 * @returns {string} Title case text
 */
export function toTitleCase(text) {
  if (!text || typeof text !== 'string') {
    return ''
  }

  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Default export object with all helper functions
 */
const editorHelpers = {
  insertText,
  getSelectedText,
  replaceSelection,
  wrapSelectionWithChord,
  getCurrentLine,
  getCursorPosition,
  moveCursor,
  selectRange,
  focusEditor,
  formatChordProLine,
  formatChordProText,
  validateChordProSyntax,
  findChords,
  findDirectives,
  toTitleCase
}

export default editorHelpers