# CodeMirror 6 Integration Guide for ChordPro Editor
*Research conducted for HSA Songbook Phase 3.3 implementation*

## Table of Contents
1. [Overview](#overview)
2. [React Integration Patterns](#react-integration-patterns)
3. [Custom Language Mode Creation](#custom-language-mode-creation)
4. [ChordPro-Specific Implementation](#chordpro-specific-implementation)
5. [Mobile Optimization](#mobile-optimization)
6. [Auto-completion Setup](#auto-completion-setup)
7. [Performance Optimization](#performance-optimization)
8. [Common Gotchas and Solutions](#common-gotchas-and-solutions)
9. [Recommended Dependencies](#recommended-dependencies)
10. [Implementation Checklist](#implementation-checklist)

## Overview

CodeMirror 6 is a complete rewrite designed to be more accessible, touchscreen-friendly, and modular compared to its predecessor. It uses the platform's native selection and editing features on phones and provides comprehensive support for mobile devices.

**Key Benefits for ChordPro Editor:**
- Native mobile editing support
- Modular architecture (only import what you need)
- Better accessibility
- Extensible with custom language modes
- Strong TypeScript support

## React Integration Patterns

### Option 1: @uiw/react-codemirror (Recommended)

The most popular and well-maintained React wrapper for CodeMirror 6.

```bash
npm install @uiw/react-codemirror
```

Basic usage:
```jsx
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

function MyEditor() {
  const [value, setValue] = useState('');

  return (
    <CodeMirror
      value={value}
      height="200px"
      extensions={[javascript()]}
      onChange={(val, viewUpdate) => {
        setValue(val);
      }}
    />
  );
}
```

### Option 2: Manual Integration

For more control over the integration:

```bash
npm install @codemirror/state @codemirror/view @codemirror/commands
```

```jsx
import React, { useRef, useEffect, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';

export const Editor = ({ initialValue, onChange }) => {
  const editor = useRef();
  const [view, setView] = useState(null);

  useEffect(() => {
    const onUpdate = EditorView.updateListener.of((v) => {
      if (onChange) {
        onChange(v.state.doc.toString());
      }
    });

    const startState = EditorState.create({
      doc: initialValue || '',
      extensions: [
        keymap.of(defaultKeymap),
        onUpdate
      ],
    });

    const newView = new EditorView({
      state: startState,
      parent: editor.current
    });

    setView(newView);

    return () => {
      newView.destroy();
    };
  }, []);

  return <div ref={editor}></div>;
};
```

### Performance Considerations for React

- **Event Listener Management**: Use `EditorView.updateListener.of()` for state synchronization
- **Component Lifecycle**: Always destroy the view in useEffect cleanup
- **Debounced Updates**: For expensive operations, debounce onChange callbacks
- **Memoization**: Use React.memo() for editor components that receive frequent prop updates

## Custom Language Mode Creation

### Step 1: Grammar Definition with Lezer

Create a grammar file (`.grammar`) for ChordPro syntax:

```javascript
@top ChordProDocument { item* }

item {
  ChordLine |
  LyricLine |
  Directive |
  Comment
}

@tokens {
  Chord { "[" ChordName "]" }
  ChordName { @asciiLetter (@asciiLetter | @digit | "#" | "b" | "/" | "m")* }
  DirectiveStart { "{" }
  DirectiveEnd { "}" }
  DirectiveName { @asciiLetter+ }
  Comment { "#" ![\n]* }
  Lyric { ![[\n#{}]+ }
}

ChordLine { (Chord | Lyric)+ }
LyricLine { Lyric+ }
Directive { DirectiveStart DirectiveName ":" DirectiveValue? DirectiveEnd }
DirectiveValue { ![}]+ }
```

### Step 2: Language Configuration

```javascript
import { LRLanguage, LanguageSupport } from '@codemirror/language';
import { styleTags, tags as t } from '@lezer/highlight';
import { parser } from './chordpro.grammar.js'; // Generated from grammar

const chordProLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      styleTags({
        Chord: t.special(t.string),
        ChordName: t.string,
        Directive: t.keyword,
        DirectiveName: t.keyword,
        DirectiveValue: t.string,
        Comment: t.lineComment,
        Lyric: t.content
      })
    ]
  }),
  languageData: {
    commentTokens: { line: "#" },
    indentOnInput: /^\s*[})]$/,
  }
});

export function chordPro() {
  return new LanguageSupport(chordProLanguage);
}
```

### Step 3: CSS Styling

```css
.cm-editor .cm-chord {
  color: #d73a49;
  font-weight: bold;
  background: rgba(215, 58, 73, 0.1);
  padding: 1px 3px;
  border-radius: 3px;
}

.cm-editor .cm-directive {
  color: #6f42c1;
  font-weight: bold;
}

.cm-editor .cm-comment {
  color: #6a737d;
  font-style: italic;
}
```

## ChordPro-Specific Implementation

### Existing ChordPro CodeMirror Package

There's an existing package that can be used as reference or directly:

```bash
npm install @chordbook/codemirror-lang-chordpro
```

Basic usage:
```javascript
import { chordPro } from '@chordbook/codemirror-lang-chordpro';
import CodeMirror from '@uiw/react-codemirror';

function ChordProEditor() {
  return (
    <CodeMirror
      extensions={[chordPro()]}
      value={chordProContent}
      onChange={onChange}
    />
  );
}
```

### ChordPro Syntax Elements

Key elements to support in syntax highlighting:

1. **Chords**: `[C]`, `[Am7]`, `[G/B]`
2. **Directives**: `{title: Song Title}`, `{key: C}`, `{tempo: 120}`
3. **Comments**: `# This is a comment`
4. **Annotations**: `[*verse]`, `[*chorus]`
5. **Lyrics**: Regular text content

### Advanced ChordPro Features

```javascript
// Custom completion for chord names
const chordCompletions = [
  { label: 'C', type: 'chord' },
  { label: 'Cm', type: 'chord' },
  { label: 'C7', type: 'chord' },
  { label: 'Cmaj7', type: 'chord' },
  // ... more chords
];

// Custom completion for directives
const directiveCompletions = [
  { label: 'title', type: 'directive', apply: '{title: }' },
  { label: 'artist', type: 'directive', apply: '{artist: }' },
  { label: 'key', type: 'directive', apply: '{key: }' },
  { label: 'tempo', type: 'directive', apply: '{tempo: }' },
  { label: 'time', type: 'directive', apply: '{time: }' },
];
```

## Mobile Optimization

### Key Considerations

CodeMirror 6 has significantly improved mobile support, but there are still important considerations:

**Strengths:**
- Uses platform's native selection and editing features
- Better touch support than CodeMirror 5
- Improved virtual keyboard integration

**Known Issues:**
- Virtual keyboard may not appear when clicking placeholder text on Chrome Android
- Aggressive scrolling behavior (5+ lines instead of 1) when caret reaches viewport edge
- Some backspace functionality issues with soft keyboards

### Mobile-Specific Configuration

```javascript
const mobileExtensions = [
  EditorView.theme({
    '.cm-editor': {
      fontSize: '16px', // Prevents zoom on iOS
    },
    '.cm-content': {
      padding: '12px', // Larger touch targets
      minHeight: '200px',
    },
    '.cm-focused': {
      outline: 'none',
    }
  }),
  // Disable line wrapping for better mobile performance
  EditorView.lineWrapping,
  // Custom scrolling behavior
  EditorView.scrollMargins.of(f => ({ top: 50, bottom: 50 }))
];
```

### Touch-Friendly Features

```javascript
// Larger tap targets for mobile
const mobileTheme = EditorView.theme({
  '.cm-cursor': {
    borderWidth: '2px', // Thicker cursor for mobile
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(0, 123, 255, 0.3)', // More visible selection
  },
  '.cm-tooltip': {
    fontSize: '14px',
    padding: '8px 12px', // Larger tooltips for touch
  }
});
```

## Auto-completion Setup

### Basic Auto-completion Configuration

```bash
npm install @codemirror/autocomplete
```

```javascript
import { autocompletion } from '@codemirror/autocomplete';

// Simple word-based completion
const basicCompletion = autocompletion({
  activateOnTyping: true,
  maxRenderedOptions: 20
});

// Language-specific completion
const chordProCompletion = chordProLanguage.data.of({
  autocomplete: function(context) {
    const word = context.matchBefore(/\w*/);
    if (word.from === word.to && !context.explicit) return null;

    return {
      from: word.from,
      options: [
        ...chordCompletions,
        ...directiveCompletions
      ]
    };
  }
});
```

### Advanced ChordPro Auto-completion

```javascript
// Context-aware completion for ChordPro
function chordProCompletionSource(context) {
  const line = context.state.doc.lineAt(context.pos);
  const lineText = line.text;
  const beforeCursor = lineText.slice(0, context.pos - line.from);

  // Chord completion when inside brackets
  if (beforeCursor.includes('[') && !beforeCursor.includes(']')) {
    const match = context.matchBefore(/\[[\w#b/]*/);
    if (match) {
      return {
        from: match.from + 1, // Skip the opening bracket
        options: chordCompletions
      };
    }
  }

  // Directive completion
  if (beforeCursor.includes('{')) {
    const match = context.matchBefore(/\{[\w:]*/);
    if (match) {
      return {
        from: match.from + 1,
        options: directiveCompletions
      };
    }
  }

  return null;
}

const chordProAutocompletion = autocompletion({
  override: [chordProCompletionSource],
  activateOnTyping: true
});
```

### Debounced Completion for Better Performance

```javascript
import { debounce } from 'lodash';
import { startCompletion, closeCompletion } from '@codemirror/autocomplete';

const debouncedStartCompletion = debounce((view) => {
  startCompletion(view);
}, 300);

function customCompletionDisplay() {
  return EditorView.updateListener.of(({ view, docChanged }) => {
    if (docChanged) {
      closeCompletion(view);
      debouncedStartCompletion(view);
    }
  });
}
```

## Performance Optimization

### Bundle Size Optimization

CodeMirror 6 adds approximately 50kB compared to v5, but offers granular imports:

```javascript
// Only import what you need
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
// Avoid importing the full basicSetup if you don't need all features

// Instead of:
// import { basicSetup } from '@codemirror/basic-setup';

// Use selective imports:
import { history } from '@codemirror/commands';
import { searchKeymap } from '@codemirror/search';
import { bracketMatching } from '@codemirror/language';
```

### Lazy Loading Extensions

```javascript
// Lazy load heavy extensions
const lazyLoadExtensions = () => {
  return Promise.all([
    import('@codemirror/search'),
    import('@codemirror/lint'),
  ]).then(([search, lint]) => [
    search.searchKeymap,
    lint.linter(/* your linter */)
  ]);
};

// Use with dynamic imports in React
useEffect(() => {
  if (needsAdvancedFeatures) {
    lazyLoadExtensions().then(extensions => {
      // Update editor extensions
    });
  }
}, [needsAdvancedFeatures]);
```

### Memory Management

```javascript
// Proper cleanup to prevent memory leaks
useEffect(() => {
  const view = new EditorView({
    state: EditorState.create({
      doc: content,
      extensions: [...extensions]
    }),
    parent: editorRef.current
  });

  return () => {
    // Always destroy the view
    view.destroy();
  };
}, []); // Empty dependency array for stable reference
```

## Common Gotchas and Solutions

### 1. React Re-rendering Issues

**Problem**: Editor recreates on every render
**Solution**: Use stable references and proper dependencies

```javascript
const extensions = useMemo(() => [
  chordPro(),
  autocompletion(),
  // other extensions
], []);

useEffect(() => {
  // Editor initialization
}, [extensions]); // Stable dependency
```

### 2. Mobile Virtual Keyboard Issues

**Problem**: Keyboard doesn't appear on mobile
**Solution**:
```javascript
// Ensure the editor can receive focus
const mobileConfig = EditorView.theme({
  '.cm-content': {
    caretColor: 'transparent', // Hide caret issues
  },
  '.cm-editor.cm-focused': {
    outline: 'none',
  }
});

// Force focus when needed
const focusEditor = () => {
  if (viewRef.current) {
    viewRef.current.focus();
    viewRef.current.dispatch({
      selection: { anchor: 0 }
    });
  }
};
```

### 3. State Synchronization

**Problem**: React state and editor state get out of sync
**Solution**: Use update listeners properly

```javascript
const onUpdate = EditorView.updateListener.of((update) => {
  if (update.docChanged) {
    const newContent = update.state.doc.toString();
    // Use functional update to avoid stale closures
    setContent(prev => newContent !== prev ? newContent : prev);
  }
});
```

### 4. Custom Language Mode Not Highlighting

**Problem**: Custom syntax highlighting not working
**Solution**: Verify parser and style tags match

```javascript
// Ensure node names in grammar match style tags
styleTags({
  // Grammar node name: highlight tag
  "ChordName": tags.string,
  "Directive": tags.keyword,
  // Names must match exactly
})
```

## Recommended Dependencies

### Core Packages
```json
{
  "@codemirror/state": "^6.0.0",
  "@codemirror/view": "^6.0.0",
  "@codemirror/commands": "^6.0.0",
  "@codemirror/language": "^6.0.0",
  "@codemirror/autocomplete": "^6.0.0"
}
```

### React Integration
```json
{
  "@uiw/react-codemirror": "^4.21.0"
}
```

### ChordPro Support
```json
{
  "@chordbook/codemirror-lang-chordpro": "latest"
}
```

### Optional Enhancements
```json
{
  "@codemirror/search": "^6.0.0",
  "@codemirror/lint": "^6.0.0",
  "@codemirror/theme-one-dark": "^6.0.0",
  "@lezer/generator": "^1.0.0"
}
```

## Implementation Checklist

### Phase 1: Basic Editor Setup
- [ ] Install @uiw/react-codemirror
- [ ] Create basic ChordPro editor component
- [ ] Implement save/load functionality
- [ ] Add basic styling

### Phase 2: ChordPro Language Support
- [ ] Install or implement ChordPro language mode
- [ ] Configure syntax highlighting
- [ ] Test chord, directive, and comment highlighting
- [ ] Add custom CSS for ChordPro elements

### Phase 3: Auto-completion
- [ ] Set up basic chord auto-completion
- [ ] Implement directive auto-completion
- [ ] Add context-aware completion logic
- [ ] Test completion performance

### Phase 4: Mobile Optimization
- [ ] Test on actual mobile devices
- [ ] Configure mobile-friendly themes
- [ ] Handle virtual keyboard issues
- [ ] Optimize touch interactions

### Phase 5: Advanced Features
- [ ] Add search and replace
- [ ] Implement bracket matching
- [ ] Add line numbers (optional)
- [ ] Performance testing and optimization

### Phase 6: Integration
- [ ] Connect to IndexedDB for persistence
- [ ] Implement auto-save functionality
- [ ] Add export capabilities
- [ ] Performance monitoring

## Example Complete Implementation

```jsx
import React, { useState, useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { chordPro } from '@chordbook/codemirror-lang-chordpro';
import { autocompletion } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';

const ChordProEditor = ({ initialValue, onSave }) => {
  const [content, setContent] = useState(initialValue || '');

  const extensions = useMemo(() => [
    chordPro(),
    autocompletion({
      activateOnTyping: true,
      maxRenderedOptions: 10
    }),
    EditorView.theme({
      '.cm-editor': {
        fontSize: '16px',
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      },
      '.cm-content': {
        padding: '16px',
        minHeight: '300px',
      }
    }),
    EditorView.lineWrapping
  ], []);

  const handleChange = useCallback((value) => {
    setContent(value);
  }, []);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(content);
    }
  }, [content, onSave]);

  return (
    <div className="chordpro-editor">
      <div className="editor-toolbar">
        <button onClick={handleSave}>Save</button>
      </div>
      <CodeMirror
        value={content}
        height="400px"
        extensions={extensions}
        onChange={handleChange}
        placeholder="Enter your ChordPro content here..."
      />
    </div>
  );
};

export default ChordProEditor;
```

This comprehensive guide provides the foundation for implementing a robust ChordPro editor using CodeMirror 6 in the HSA Songbook application.