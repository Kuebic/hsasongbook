/**
 * ChordPro Language Mode for CodeMirror 6
 *
 * Implements ChordPro syntax parsing using StreamLanguage for optimal performance
 * Based on ChordPro v6 specification and mobile optimization requirements
 */

import { StreamLanguage } from '@codemirror/language';
import type { StreamParser } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

/**
 * Parser state for ChordPro stream parsing
 */
interface ChordProState {
  inDirective: boolean;
  directiveStart: boolean;
  inComment: boolean;
  lineStart: boolean;
}

/**
 * ChordPro stream parser implementation
 * Uses regex patterns optimized for mobile performance
 */
const chordProParser: StreamParser<ChordProState> = {
  name: 'chordpro',

  startState(): ChordProState {
    return {
      inDirective: false,
      directiveStart: false,
      inComment: false,
      lineStart: true
    };
  },

  token(stream, state) {
    // Handle start of line
    if (stream.sol()) {
      state.lineStart = true;
      state.inDirective = false;
      state.directiveStart = false;
      state.inComment = false;
    }

    // Skip whitespace but track if we're still at line start
    if (stream.eatSpace()) {
      return null;
    }

    // Mark that we're no longer at line start once we hit content
    if (state.lineStart) {
      state.lineStart = false;
    }

    // Comments - entire line starting with #
    if (stream.sol() && stream.match('#')) {
      stream.skipToEnd();
      return 'comment';
    }

    // Directive start - { at beginning of line or after whitespace
    if (stream.match('{')) {
      state.inDirective = true;
      state.directiveStart = true;
      return 'directive-bracket';
    }

    // Inside directive processing
    if (state.inDirective) {
      // Directive end
      if (stream.match('}')) {
        state.inDirective = false;
        state.directiveStart = false;
        return 'directive-bracket';
      }

      // Directive separator
      if (stream.match(':')) {
        state.directiveStart = false;
        return 'directive-separator';
      }

      // Directive name (right after opening bracket)
      if (state.directiveStart && stream.match(/[a-zA-Z_][a-zA-Z0-9_-]*/)) {
        return 'directive-name';
      }

      // Directive argument (after colon)
      if (!state.directiveStart) {
        // Consume everything until closing bracket or end of line
        if (stream.match(/[^}]+/)) {
          return 'directive-arg';
        }
      }

      // Fallback: consume single character
      stream.next();
      return 'directive-content';
    }

    // Chord notation - [chord] format
    // Comprehensive regex for chord recognition
    const chordMatch = stream.match(/\[([A-G][#b]?(?:m|maj|min|dim|aug|sus[24]?|add\d+|\d+)*(?:\/[A-G][#b]?)?)\]/);
    if (chordMatch) {
      return 'chord';
    }

    // Invalid chord notation (opening bracket without proper close)
    if (stream.match(/\[[^\]]*$/)) {
      return 'chord-invalid';
    }

    // Partial chord (for auto-completion context)
    if (stream.match(/\[[A-G][#b]?[a-zA-Z0-9/]*/)) {
      return 'chord-partial';
    }

    // Environment section markers (special directives)
    if (stream.match(/\{(start_of_|end_of_|soc|eoc|sov|eov|sob|eob|sot|eot)/)) {
      return 'section-marker';
    }

    // Regular lyrics - consume until special character or end of line
    if (stream.match(/[^[{#\n]+/)) {
      return 'lyrics';
    }

    // Fallback: consume single character
    if (stream.next()) {
      return 'lyrics';
    }

    return null;
  },

  // Language configuration
  languageData: {
    commentTokens: { line: '#' },
    indentOnInput: /^\s*[})]$/,
    closeBrackets: { brackets: ['[', '{'] },
    autocomplete: true
  },

  // Token table - maps custom token names to Lezer tags for syntax highlighting
  tokenTable: {
    'lyrics': t.content,
    'chord': t.special(t.string),
    'directive-name': t.keyword,
    'directive-arg': t.string,
    'directive-bracket': t.bracket,
    'directive-separator': t.operator,
    'directive-content': t.string,
    'comment': t.lineComment,
    'section-marker': t.labelName,
    'chord-invalid': t.invalid,
    'chord-partial': t.special(t.variableName)
  }
};

/**
 * Create ChordPro language support
 * @returns CodeMirror Language instance
 */
export const chordProLanguage = StreamLanguage.define(chordProParser);

/**
 * Default export for convenient importing
 */
export default chordProLanguage;
