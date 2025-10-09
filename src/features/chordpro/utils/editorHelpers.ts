/**
 * ChordPro Editor Helper Utilities
 *
 * Utility functions for editor operations and ChordPro text manipulation
 * Works with CodeMirror EditorView API for text manipulation
 */

import type { EditorView } from '@codemirror/view';
import logger from '@/lib/logger';

export interface LineInfo {
  text: string;
  from: number;
  to: number;
  number: number;
}

export interface CursorPosition {
  pos: number;
  line: number;
  column: number;
}

export interface ChordInfo {
  chord: string;
  fullMatch: string;
  start: number;
  end: number;
}

export interface DirectiveInfo {
  name: string;
  argument: string | null;
  fullMatch: string;
  start: number;
  end: number;
}

export interface SyntaxError {
  line: number;
  type: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: SyntaxError[];
}

/**
 * Insert text at a specific position in the editor
 * @param editorView - CodeMirror editor view
 * @param text - Text to insert
 * @param position - Position to insert at (null for current cursor)
 * @returns Success status
 */
export function insertText(
  editorView: EditorView | null,
  text: string,
  position: number | null = null
): boolean {
  if (!editorView) {
    logger.warn('insertText: editorView is required');
    return false;
  }

  try {
    const pos = position ?? editorView.state.selection.main.head;

    editorView.dispatch({
      changes: { from: pos, insert: text },
      selection: { anchor: pos + text.length }
    });

    logger.debug('Text inserted:', { text, position: pos });
    return true;
  } catch (error) {
    logger.error('Failed to insert text:', error);
    return false;
  }
}


/**
 * Get the currently selected text
 * @param editorView - CodeMirror editor view
 * @returns Selected text or empty string
 */
export function getSelectedText(editorView: EditorView | null): string {
  if (!editorView) {
    return '';
  }

  const selection = editorView.state.selection.main;
  if (selection.empty) {
    return '';
  }

  return editorView.state.doc.sliceString(selection.from, selection.to);
}

/**
 * Replace the current selection with new text
 * @param editorView - CodeMirror editor view
 * @param text - Text to replace selection with
 * @returns Success status
 */
export function replaceSelection(editorView: EditorView | null, text: string): boolean {
  if (!editorView) {
    logger.warn('replaceSelection: editorView is required');
    return false;
  }

  try {
    const selection = editorView.state.selection.main;

    editorView.dispatch({
      changes: { from: selection.from, to: selection.to, insert: text },
      selection: { anchor: selection.from + text.length }
    });

    logger.debug('Selection replaced:', { text, from: selection.from, to: selection.to });
    return true;
  } catch (error) {
    logger.error('Failed to replace selection:', error);
    return false;
  }
}

/**
 * Wrap selected text with chord notation
 * @param editorView - CodeMirror editor view
 * @param chord - Chord to wrap with
 * @returns Success status
 */
export function wrapSelectionWithChord(editorView: EditorView | null, chord: string): boolean {
  const selectedText = getSelectedText(editorView);
  if (!selectedText) {
    // No selection, insert chord at cursor
    const chordText = `[${chord}]`;
    return insertText(editorView, chordText);
  }

  const wrappedText = `[${chord}]${selectedText}`;
  return replaceSelection(editorView, wrappedText);
}

/**
 * Get the current line content
 * @param editorView - CodeMirror editor view
 * @returns Line information
 */
export function getCurrentLine(editorView: EditorView | null): LineInfo {
  if (!editorView) {
    return { text: '', from: 0, to: 0, number: 0 };
  }

  const pos = editorView.state.selection.main.head;
  const line = editorView.state.doc.lineAt(pos);

  return {
    text: line.text,
    from: line.from,
    to: line.to,
    number: line.number
  };
}

/**
 * Get cursor position information
 * @param editorView - CodeMirror editor view
 * @returns Cursor position info
 */
export function getCursorPosition(editorView: EditorView | null): CursorPosition {
  if (!editorView) {
    return { pos: 0, line: 0, column: 0 };
  }

  const pos = editorView.state.selection.main.head;
  const line = editorView.state.doc.lineAt(pos);

  return {
    pos,
    line: line.number,
    column: pos - line.from
  };
}

/**
 * Move cursor to a specific position
 * @param editorView - CodeMirror editor view
 * @param position - Position to move to
 * @returns Success status
 */
export function moveCursor(editorView: EditorView | null, position: number): boolean {
  if (!editorView || typeof position !== 'number') {
    return false;
  }

  try {
    editorView.dispatch({
      selection: { anchor: position }
    });
    return true;
  } catch (error) {
    logger.error('Failed to move cursor:', error);
    return false;
  }
}

/**
 * Select text range
 * @param editorView - CodeMirror editor view
 * @param from - Start position
 * @param to - End position
 * @returns Success status
 */
export function selectRange(editorView: EditorView | null, from: number, to: number): boolean {
  if (!editorView || typeof from !== 'number' || typeof to !== 'number') {
    return false;
  }

  try {
    editorView.dispatch({
      selection: { anchor: from, head: to }
    });
    return true;
  } catch (error) {
    logger.error('Failed to select range:', error);
    return false;
  }
}

/**
 * Focus the editor
 * @param editorView - CodeMirror editor view
 * @returns Success status
 */
export function focusEditor(editorView: EditorView | null): boolean {
  if (!editorView) {
    return false;
  }

  try {
    editorView.focus();
    return true;
  } catch (error) {
    logger.error('Failed to focus editor:', error);
    return false;
  }
}


/**
 * Format a single line of ChordPro text
 * @param line - Line to format
 * @returns Formatted line
 */
export function formatChordProLine(line: string): string {
  if (!line || typeof line !== 'string') {
    return '';
  }

  return line
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\[\s*([^[\]]+)\s*\]/g, '[$1]') // Clean chord notation
    .replace(/\{\s*([^{}:]+)\s*:\s*([^{}]+)\s*\}/g, '{$1: $2}') // Clean directives with args
    .replace(/\{\s*([^{}:]+)\s*\}/g, '{$1}') // Clean directives without args
    .trim();
}

/**
 * Format ChordPro text (multiple lines)
 * @param text - Text to format
 * @returns Formatted text
 */
export function formatChordProText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .split('\n')
    .map(line => formatChordProLine(line))
    .join('\n');
}

/**
 * Validate ChordPro syntax
 * @param text - Text to validate
 * @returns Validation result
 */
export function validateChordProSyntax(text: string): ValidationResult {
  if (!text || typeof text !== 'string') {
    return { isValid: true, errors: [] };
  }

  const errors: SyntaxError[] = [];
  const lines = text.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Check for unclosed chord brackets
    const openBrackets = (line.match(/\[/g) || []).length;
    const closeBrackets = (line.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push({
        line: lineNumber,
        type: 'chord-brackets',
        message: 'Mismatched chord brackets'
      });
    }

    // Check for unclosed directive braces
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push({
        line: lineNumber,
        type: 'directive-braces',
        message: 'Mismatched directive braces'
      });
    }

    // Check for empty chord notation
    if (line.includes('[]')) {
      errors.push({
        line: lineNumber,
        type: 'empty-chord',
        message: 'Empty chord notation found'
      });
    }

    // Check for empty directive
    if (line.includes('{}')) {
      errors.push({
        line: lineNumber,
        type: 'empty-directive',
        message: 'Empty directive found'
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Find all chords in the text
 * @param text - Text to search
 * @returns Array of chord objects with position info
 */
export function findChords(text: string): ChordInfo[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const chordRegex = /\[([^\]]+)\]/g;
  const chords: ChordInfo[] = [];
  let match: RegExpExecArray | null;

  while ((match = chordRegex.exec(text)) !== null) {
    chords.push({
      chord: match[1],
      fullMatch: match[0],
      start: match.index,
      end: match.index + match[0].length
    });
  }

  return chords;
}

/**
 * Find all directives in the text
 * @param text - Text to search
 * @returns Array of directive objects with position info
 */
export function findDirectives(text: string): DirectiveInfo[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const directiveRegex = /\{([^}:]+)(?:\s*:\s*([^}]+))?\}/g;
  const directives: DirectiveInfo[] = [];
  let match: RegExpExecArray | null;

  while ((match = directiveRegex.exec(text)) !== null) {
    directives.push({
      name: match[1].trim(),
      argument: match[2] ? match[2].trim() : null,
      fullMatch: match[0],
      start: match.index,
      end: match.index + match[0].length
    });
  }

  return directives;
}

/**
 * Convert text to title case
 * @param text - Text to convert
 * @returns Title case text
 */
export function toTitleCase(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
};

export default editorHelpers;
