/**
 * ChordPro Syntax Highlighting Rules
 *
 * Defines highlighting styles for ChordPro language tokens
 * Supports both light and dark themes with CSS custom properties
 */

import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { tags as t } from '@lezer/highlight';

/**
 * ChordPro highlight style definition
 * Maps token types to visual styles using CSS custom properties for theme compatibility
 */
export const chordProHighlight = HighlightStyle.define([
  // Chord notation - bold blue with background
  {
    tag: t.special(t.string),
    class: 'cm-chord'
  },

  // Directive names - purple/violet
  {
    tag: t.keyword,
    class: 'cm-directive-name'
  },

  // Directive arguments - green/teal
  {
    tag: t.string,
    class: 'cm-directive-arg'
  },

  // Directive brackets and separators - muted
  {
    tag: t.bracket,
    class: 'cm-directive-bracket'
  },

  {
    tag: t.operator,
    class: 'cm-directive-separator'
  },

  // Comments - muted gray, italic
  {
    tag: t.lineComment,
    class: 'cm-comment'
  },

  // Section markers - red/orange for environment directives
  {
    tag: t.labelName,
    class: 'cm-section-marker'
  },

  // Lyrics - default text color
  {
    tag: t.content,
    class: 'cm-lyrics'
  },

  // Invalid/error syntax - red
  {
    tag: t.invalid,
    class: 'cm-chord-invalid'
  },

  // Partial chords (for completion) - muted chord style
  {
    tag: t.special(t.variableName),
    class: 'cm-chord-partial'
  },

  // Rhythm brackets - chord notation with rhythm markers
  {
    tag: t.special(t.emphasis),
    class: 'cm-rhythm-bracket'
  }
]);

/**
 * CSS styles for ChordPro syntax highlighting
 * Uses CSS custom properties to support light/dark theme switching
 */
export const chordProStyles = `
/* Light theme styles (default) */
.cm-editor {
  --chord-color: #0066cc;
  --chord-bg: rgba(0, 102, 204, 0.1);
  --directive-name-color: #7c3aed;
  --directive-arg-color: #059669;
  --directive-bracket-color: #6b7280;
  --comment-color: #6b7280;
  --section-marker-color: #dc2626;
  --lyrics-color: #111827;
  --error-color: #dc2626;
  --error-bg: rgba(220, 38, 38, 0.1);
}

/* Dark theme styles - uses .dark class on html element from ThemeProvider */
.dark .cm-editor {
  --chord-color: #60a5fa;
  --chord-bg: rgba(96, 165, 250, 0.15);
  --directive-name-color: #a78bfa;
  --directive-arg-color: #34d399;
  --directive-bracket-color: #9ca3af;
  --comment-color: #9ca3af;
  --section-marker-color: #f87171;
  --lyrics-color: #f9fafb;
  --error-color: #f87171;
  --error-bg: rgba(248, 113, 113, 0.15);
}

/* Chord notation styles */
/* Uses box-shadow instead of padding/margin to avoid layout shifts when highlighting changes */
.cm-chord {
  color: var(--chord-color);
  font-weight: bold;
  background-color: var(--chord-bg);
  border-radius: 3px;
  padding: 0;
  margin: 0;
  box-shadow: -3px 0 0 var(--chord-bg), 3px 0 0 var(--chord-bg);
}

/* Mobile optimization for chords */
@media (max-width: 768px) {
  .cm-chord {
    font-size: 1.05em;
    box-shadow: -4px 0 0 var(--chord-bg), 4px 0 0 var(--chord-bg);
  }
}

/* Directive name styles */
.cm-directive-name {
  color: var(--directive-name-color);
  font-weight: 600;
}

/* Directive argument styles */
.cm-directive-arg {
  color: var(--directive-arg-color);
  font-style: italic;
}

/* Directive bracket and separator styles */
.cm-directive-bracket,
.cm-directive-separator {
  color: var(--directive-bracket-color);
  font-weight: normal;
}

/* Comment styles */
.cm-comment {
  color: var(--comment-color);
  font-style: italic;
  opacity: 0.8;
}

/* Section marker styles */
.cm-section-marker {
  color: var(--section-marker-color);
  font-weight: 600;
  background-color: rgba(220, 38, 38, 0.05);
  border-radius: 2px;
  padding: 0 2px;
}

/* Lyrics styles (default text) */
.cm-lyrics {
  color: var(--lyrics-color);
}

/* Error/invalid syntax styles */
/* Uses box-shadow instead of padding to avoid layout shifts */
.cm-chord-invalid {
  color: var(--error-color);
  background-color: var(--error-bg);
  border-radius: 3px;
  padding: 0;
  box-shadow: -3px 0 0 var(--error-bg), 3px 0 0 var(--error-bg);
  text-decoration: underline wavy var(--error-color);
}

/* Partial chord styles (for auto-completion) */
/* Uses box-shadow instead of padding to avoid layout shifts */
.cm-chord-partial {
  color: var(--chord-color);
  opacity: 0.7;
  background-color: var(--chord-bg);
  border-radius: 3px;
  padding: 0;
  box-shadow: -3px 0 0 var(--chord-bg), 3px 0 0 var(--chord-bg);
  outline: 1px dashed var(--chord-color);
  outline-offset: 0;
}

/* Rhythm bracket styles - [D / / / | A/C# / / / |] */
/* Uses box-shadow instead of padding to avoid layout shifts */
.cm-rhythm-bracket {
  color: var(--chord-color);
  font-weight: bold;
  background-color: var(--chord-bg);
  border-radius: 3px;
  padding: 0;
  box-shadow: -4px 0 0 var(--chord-bg), 4px 0 0 var(--chord-bg);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

/* CodeMirror bracket matching - override defaults to avoid layout shifts */
.cm-editor .cm-matchingBracket {
  background-color: transparent !important;
  outline: 2px solid var(--chord-color);
  outline-offset: -1px;
  border-radius: 2px;
}

.cm-editor .cm-nonmatchingBracket {
  background-color: transparent !important;
  outline: 2px solid var(--error-color);
  outline-offset: -1px;
  border-radius: 2px;
}

/* Additional editor optimizations */
.cm-editor .cm-content {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.6;
}

/* Mobile font size optimization - prevent zoom on iOS */
@media (max-width: 768px) {
  .cm-editor .cm-content {
    font-size: 16px;
  }
}

/* Focus styles for better accessibility */
.cm-editor.cm-focused .cm-activeLine {
  background-color: rgba(0, 0, 0, 0.02);
}

.dark .cm-editor.cm-focused .cm-activeLine {
  background-color: rgba(255, 255, 255, 0.02);
}

/* Selection styles */
.cm-editor .cm-selectionBackground {
  background-color: rgba(0, 123, 255, 0.3);
}

/* Cursor styles - thicker for mobile */
.cm-editor .cm-cursor {
  border-left-width: 2px;
  border-color: var(--lyrics-color);
}

@media (max-width: 768px) {
  .cm-editor .cm-cursor {
    border-left-width: 3px;
  }
}
`;

/**
 * Create ChordPro syntax highlighting extension
 * @returns CodeMirror extension for ChordPro highlighting
 */
export function createChordProHighlighting(): Extension {
  return syntaxHighlighting(chordProHighlight);
}

/**
 * Default export for convenient importing
 */
export default chordProHighlight;
