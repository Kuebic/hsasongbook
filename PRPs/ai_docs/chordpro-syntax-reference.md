# ChordPro Syntax Reference for CodeMirror Implementation

This document provides comprehensive research findings for implementing ChordPro syntax highlighting in CodeMirror 6, based on analysis of existing implementations, official specifications, and mobile optimization considerations.

## Table of Contents

1. [ChordPro Syntax Structure](#chordpro-syntax-structure)
2. [Existing Implementations](#existing-implementations)
3. [Tokenization Patterns](#tokenization-patterns)
4. [CodeMirror 6 Implementation Strategy](#codemirror-6-implementation-strategy)
5. [Color Scheme Recommendations](#color-scheme-recommendations)
6. [Mobile Optimization](#mobile-optimization)
7. [Implementation Examples](#implementation-examples)
8. [Integration Approach](#integration-approach)

## ChordPro Syntax Structure

### Core Elements to Highlight

Based on the official ChordPro specification (v6), the following elements require distinct highlighting:

#### 1. Chord Notation
- **Pattern**: `[chord]` format
- **Examples**: `[C]`, `[Am7]`, `[F#m]`, `[Bb/D]`, `[Csus4]`
- **Regex**: `/\[([A-G][#b]?(?:m|maj|min|dim|aug|sus[24]?|add\d+|\d+)*(?:\/[A-G][#b]?)?)\]/g`
- **Position**: Inline with lyrics
- **Highlighting**: Bold, distinctive color (typically blue or green)

#### 2. Directives
- **Pattern**: `{directive}` or `{directive: argument}`
- **Categories**:
  - **Metadata**: `{title: Song Name}`, `{artist: Artist Name}`, `{key: C}`, `{tempo: 120}`
  - **Environment**: `{start_of_chorus}`, `{end_of_chorus}`, `{start_of_verse}`, `{end_of_verse}`
  - **Formatting**: `{comment: Note}`, `{highlight}`, `{new_page}`
  - **Advanced**: `{define: Am base-fret 1 frets 0 2 2 1 0 0}`, `{transpose: +2}`

#### 3. Comments
- **Pattern**: Lines starting with `#`
- **Examples**: `# This is a comment`, `# Capo 2nd fret`
- **Regex**: `/^#.*$/gm`
- **Highlighting**: Muted/gray, italic

#### 4. Section Labels
- **Pattern**: Environment directive arguments
- **Examples**: `{start_of_verse: Verse 1}`, `{start_of_chorus: Chorus}`
- **Highlighting**: Medium emphasis, different from directive names

### Official Directive Reference

#### Metadata Directives
```chordpro
{title: Song Title}                # Required song title
{artist: Artist Name}              # Song artist
{composer: Composer Name}          # Song composer
{copyright: © 2024}               # Copyright notice
{key: C}                          # Song key
{tempo: 120}                      # Beats per minute
{capo: 2}                         # Capo position
{time: 4/4}                       # Time signature
```

#### Environment Directives
```chordpro
{start_of_chorus}                 # Begin chorus section
{end_of_chorus}                   # End chorus section
{start_of_verse}                  # Begin verse section
{end_of_verse}                    # End verse section
{start_of_bridge}                 # Begin bridge section
{end_of_bridge}                   # End bridge section
{start_of_tab}                    # Begin tablature section
{end_of_tab}                      # End tablature section
```

#### Formatting Directives
```chordpro
{comment: Performance note}       # Inline comment
{highlight}                       # Highlight following text
{new_page}                        # Page break
{column_break}                    # Column break
{image: src="image.jpg"}          # Image insertion
```

## Existing Implementations

### Web-Based Editors

#### 1. ChordBook Editor (CodeMirror-based)
- **Repository**: https://github.com/chordbook/editor
- **Technology**: CodeMirror with custom ChordPro mode
- **Features**:
  - Syntax highlighting
  - Error checking
  - Chord autocomplete
  - Snippets for directives
- **License**: GPL-3.0
- **Status**: Active, production-ready

#### 2. ChordProject Editor (Ace-based)
- **Repository**: https://github.com/chordproject/chordpro-editor
- **Technology**: Ace Editor with custom ChordPro mode
- **Features**:
  - Syntax highlighting
  - Code folding
  - Chord autocomplete
  - Directive snippets
- **License**: Open source
- **Status**: Active

### Native Applications

#### 3. Chord Provider (Swift/AppKit)
- **Repository**: https://github.com/Desbeers/Chord-Provider
- **Technology**: Native Swift/SwiftUI editor
- **Features**: Custom syntax highlighting, PDF export
- **Platform**: macOS/Linux

### Editor Extensions

#### 4. Emacs ChordPro Mode
- **Repository**: https://github.com/hading/chordpro-mode
- **Technology**: Emacs Lisp with font-lock
- **Features**: Comprehensive directive highlighting
- **Regex patterns**: Available for all ChordPro directives

#### 5. VS Code Extension
- **Available**: ChordPro syntax highlighting extension
- **Technology**: TextMate grammar
- **Status**: Community-maintained

## Tokenization Patterns

### Core Regex Patterns

```javascript
// Chord notation - must be precise to avoid false positives
const CHORD_PATTERN = /\[([A-G][#b]?(?:m|maj|min|dim|aug|sus[24]?|add\d+|\d+)*(?:\/[A-G][#b]?)?)\]/g;

// Directive patterns
const DIRECTIVE_START = /^\s*\{/;
const DIRECTIVE_SIMPLE = /^\s*\{([a-zA-Z_][a-zA-Z0-9_-]*)\}\s*$/;
const DIRECTIVE_WITH_ARG = /^\s*\{([a-zA-Z_][a-zA-Z0-9_-]*)\s*:\s*(.+)\}\s*$/;
const DIRECTIVE_CONDITIONAL = /^\s*\{([a-zA-Z_][a-zA-Z0-9_-]*)-([a-zA-Z0-9_-]+)(?:\s*:\s*(.+))?\}\s*$/;

// Comments
const COMMENT_LINE = /^\s*#.*$/;

// Environment sections
const START_ENV = /^\s*\{start_of_([a-zA-Z_]+)(?:\s*:\s*(.+))?\}\s*$/;
const END_ENV = /^\s*\{end_of_([a-zA-Z_]+)\}\s*$/;

// Abbreviated directives
const ABBREVIATIONS = {
  't': 'title',
  'st': 'subtitle',
  'c': 'comment',
  'soc': 'start_of_chorus',
  'eoc': 'end_of_chorus',
  'sov': 'start_of_verse',
  'eov': 'end_of_verse',
  'sob': 'start_of_bridge',
  'eob': 'end_of_bridge',
  'sot': 'start_of_tab',
  'eot': 'end_of_tab',
  'np': 'new_page',
  'cb': 'column_break'
};
```

### Token Classification

```javascript
// Token types for syntax highlighting
const TOKEN_TYPES = {
  CHORD: 'chord',
  DIRECTIVE_NAME: 'directive-name',
  DIRECTIVE_ARG: 'directive-arg',
  COMMENT: 'comment',
  SECTION_LABEL: 'section-label',
  LYRICS: 'lyrics',
  ERROR: 'error'
};
```

## CodeMirror 6 Implementation Strategy

### Recommended Approach: Stream Parser

For ChordPro, a stream parser is more appropriate than a full Lezer grammar due to:
- Line-based tokenization needs
- Simple syntax structure
- Real-time performance requirements
- Mobile optimization needs

### Basic Implementation Structure

```javascript
import { StreamLanguage } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

const chordProParser = {
  name: 'chordpro',

  startState() {
    return {
      inDirective: false,
      lineStart: true
    };
  },

  token(stream, state) {
    // Handle line start
    if (stream.sol()) {
      state.lineStart = true;
      state.inDirective = false;
    }

    // Comments
    if (state.lineStart && stream.match('#')) {
      stream.skipToEnd();
      return 'comment';
    }

    // Directives
    if (state.lineStart && stream.match('{')) {
      state.inDirective = true;
      return 'directive-bracket';
    }

    if (state.inDirective) {
      if (stream.match('}')) {
        state.inDirective = false;
        return 'directive-bracket';
      }
      if (stream.match(':')) {
        return 'directive-separator';
      }
      if (stream.match(/[a-zA-Z_][a-zA-Z0-9_-]*/)) {
        return 'directive-name';
      }
      stream.next();
      return 'directive-arg';
    }

    // Chords
    if (stream.match(/\[([A-G][#b]?(?:m|maj|min|dim|aug|sus[24]?|add\d+|\d+)*(?:\/[A-G][#b]?)?)\]/)) {
      return 'chord';
    }

    // Regular text
    if (stream.next()) {
      state.lineStart = false;
      return 'lyrics';
    }
  }
};

// Create the language
export const chordProLanguage = StreamLanguage.define(chordProParser);
```

### Syntax Tags Configuration

```javascript
import { styleTags } from '@codemirror/language';

const chordProHighlighting = styleTags({
  'chord': t.keyword,
  'directive-name': t.tagName,
  'directive-arg': t.string,
  'directive-bracket': t.bracket,
  'directive-separator': t.operator,
  'comment': t.lineComment,
  'section-label': t.labelName,
  'lyrics': t.content,
  'error': t.invalid
});
```

## Color Scheme Recommendations

### Default Light Theme

```css
.cm-chord {
  color: #0066cc;
  font-weight: bold;
  background-color: rgba(0, 102, 204, 0.1);
  border-radius: 3px;
  padding: 1px 3px;
}

.cm-directive-name {
  color: #7c3aed;
  font-weight: 600;
}

.cm-directive-arg {
  color: #059669;
  font-style: italic;
}

.cm-directive-bracket {
  color: #6b7280;
}

.cm-comment {
  color: #6b7280;
  font-style: italic;
}

.cm-section-label {
  color: #dc2626;
  font-weight: 500;
}

.cm-lyrics {
  color: #111827;
}
```

### Dark Theme

```css
.cm-chord {
  color: #60a5fa;
  font-weight: bold;
  background-color: rgba(96, 165, 250, 0.15);
  border-radius: 3px;
  padding: 1px 3px;
}

.cm-directive-name {
  color: #a78bfa;
  font-weight: 600;
}

.cm-directive-arg {
  color: #34d399;
  font-style: italic;
}

.cm-directive-bracket {
  color: #9ca3af;
}

.cm-comment {
  color: #9ca3af;
  font-style: italic;
}

.cm-section-label {
  color: #f87171;
  font-weight: 500;
}

.cm-lyrics {
  color: #f9fafb;
}
```

## Mobile Optimization

### Performance Considerations

1. **Lazy Loading**: Only highlight visible content
2. **Debounced Updates**: Limit highlighting frequency during typing
3. **Simplified Parsing**: Use efficient regex patterns
4. **Memory Management**: Clean up unused parsers

### Touch-Friendly Features

```javascript
// Mobile-optimized editor configuration
const mobileConfig = {
  // Larger touch targets for mobile
  touchScrollThreshold: 20,

  // Reduced animation for better performance
  drawSelection: false,

  // Optimized for small screens
  lineWrapping: true,

  // Touch-friendly scrolling
  scrollPastEnd: false
};
```

### Responsive Design

```css
/* Mobile-first responsive design */
.chord-pro-editor {
  font-size: 16px; /* Prevent zoom on iOS */
  line-height: 1.5;
}

@media (max-width: 768px) {
  .cm-chord {
    padding: 2px 4px; /* Larger touch targets */
    margin: 1px;
  }

  .chord-pro-editor {
    font-size: 18px; /* Larger text on small screens */
  }
}
```

## Implementation Examples

### Working CodeMirror 6 Integration

```javascript
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { chordProLanguage } from './chordpro-lang';

function createChordProEditor(parent, initialContent = '') {
  const state = EditorState.create({
    doc: initialContent,
    extensions: [
      chordProLanguage,
      syntaxHighlighting(defaultHighlightStyle),
      keymap.of(defaultKeymap),
      EditorView.theme({
        '&': {
          fontSize: '16px',
          fontFamily: 'Monaco, Consolas, "Liberation Mono", Courier, monospace'
        }
      }),
      // Mobile optimizations
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({'spellcheck': 'false'})
    ]
  });

  return new EditorView({
    state,
    parent
  });
}
```

### React Hook for ChordPro Editor

```javascript
import { useEffect, useRef } from 'react';
import { EditorView } from '@codemirror/view';

export function useChordProEditor(initialValue, onChange) {
  const editorRef = useRef();
  const viewRef = useRef();

  useEffect(() => {
    if (editorRef.current && !viewRef.current) {
      viewRef.current = createChordProEditor(
        editorRef.current,
        initialValue
      );

      // Setup change listener
      if (onChange) {
        const updateListener = EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        });

        viewRef.current.dispatch({
          effects: StateEffect.appendConfig.of(updateListener)
        });
      }
    }

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, []);

  return editorRef;
}
```

## Integration Approach

### Phase 1: Basic Syntax Highlighting

1. **Install Dependencies**:
   ```bash
   npm install @codemirror/state @codemirror/view @codemirror/language @codemirror/commands
   ```

2. **Create Language Module**:
   - `src/features/chordpro/editor/language.js` - Stream parser implementation
   - `src/features/chordpro/editor/theme.js` - Color scheme definitions
   - `src/features/chordpro/editor/index.js` - Main editor export

3. **React Component**:
   ```javascript
   // src/features/chordpro/components/ChordProEditor.jsx
   import { useChordProEditor } from '../hooks/useChordProEditor';

   export function ChordProEditor({ value, onChange, className }) {
     const editorRef = useChordProEditor(value, onChange);

     return (
       <div
         ref={editorRef}
         className={`chord-pro-editor ${className}`}
       />
     );
   }
   ```

### Phase 2: Enhanced Features

1. **Autocomplete**: Chord and directive suggestions
2. **Error Highlighting**: Invalid syntax detection
3. **Code Folding**: Section-based folding
4. **Live Preview**: Split-pane with formatted output

### Phase 3: Mobile Optimization

1. **Touch Gestures**: Swipe navigation, pinch zoom
2. **Virtual Keyboard**: Custom keyboard layout
3. **Performance**: Virtualized rendering for large files
4. **Accessibility**: Screen reader support, keyboard navigation

## Resources and References

### Official Documentation
- **ChordPro Specification**: https://www.chordpro.org/chordpro/chordpro-directives/
- **CodeMirror 6 Language Guide**: https://codemirror.net/examples/lang-package/
- **Lezer Parser Documentation**: https://lezer.codemirror.net/

### Working Implementations
1. **ChordBook Editor**: https://github.com/chordbook/editor (CodeMirror-based)
2. **ChordProject Editor**: https://github.com/chordproject/chordpro-editor (Ace-based)
3. **Emacs ChordPro Mode**: https://github.com/hading/chordpro-mode (Regex patterns)

### Performance Resources
- **Mobile Code Editors**: TouchDevelop, Textastic, Acode
- **Syntax Highlighting Performance**: Prism.js optimization techniques
- **CodeMirror Mobile Best Practices**: Official documentation

## Conclusion

ChordPro syntax highlighting for CodeMirror 6 should prioritize:

1. **Accurate Parsing**: Comprehensive regex patterns for all ChordPro elements
2. **Mobile Performance**: Stream parser over complex grammar for better mobile performance
3. **Visual Clarity**: Distinct highlighting for chords, directives, and comments
4. **Touch Optimization**: Larger targets, responsive design, gesture support
5. **Extensibility**: Plugin architecture for additional ChordPro features

The stream parser approach offers the best balance of functionality, performance, and mobile compatibility for ChordPro syntax highlighting in a web-based editor.