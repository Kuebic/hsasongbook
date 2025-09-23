/**
 * useEditorShortcuts Hook
 *
 * Provides keyboard shortcuts for the ChordPro editor with mobile-aware handling.
 * Integrates with CodeMirror 6 key mappings and provides common text editing shortcuts.
 */

import { useCallback, useEffect } from 'react';
import { keymap } from '@codemirror/view';

/**
 * Hook for managing editor keyboard shortcuts
 * @param {Object} editorView - CodeMirror 6 editor view instance
 * @param {Object} options - Configuration options
 * @param {Function} options.onSave - Callback for save shortcut (Ctrl+S)
 * @param {Function} options.onPreview - Callback for preview toggle (Ctrl+P)
 * @param {Function} options.onFind - Callback for find shortcut (Ctrl+F)
 * @param {boolean} options.disabled - Whether shortcuts are disabled
 * @returns {Object} Shortcut handlers and keymap configuration
 */
export function useEditorShortcuts(editorView, options = {}) {
  const {
    onSave,
    onPreview,
    onFind,
    disabled = false
  } = options;

  // Create keymap for CodeMirror
  const createKeymap = useCallback(() => {
    if (disabled) return [];

    const shortcuts = [
      // Save shortcut (Ctrl+S / Cmd+S)
      {
        key: 'Ctrl-s',
        mac: 'Cmd-s',
        preventDefault: true,
        run: () => {
          onSave?.();
          return true;
        }
      },

      // Preview toggle (Ctrl+P / Cmd+P)
      {
        key: 'Ctrl-p',
        mac: 'Cmd-p',
        preventDefault: true,
        run: () => {
          onPreview?.();
          return true;
        }
      },

      // Find (Ctrl+F / Cmd+F) - let browser handle this naturally
      {
        key: 'Ctrl-f',
        mac: 'Cmd-f',
        preventDefault: false,
        run: () => {
          onFind?.();
          return false; // Let browser's find take over
        }
      },

      // ChordPro specific shortcuts
      {
        key: 'Ctrl-[',
        mac: 'Cmd-[',
        preventDefault: true,
        run: (view) => {
          insertChordBrackets(view);
          return true;
        }
      },

      {
        key: 'Ctrl-{',
        mac: 'Cmd-{',
        preventDefault: true,
        run: (view) => {
          insertDirectiveBraces(view);
          return true;
        }
      }
    ];

    return keymap.of(shortcuts);
  }, [onSave, onPreview, onFind, disabled, insertChordBrackets, insertDirectiveBraces]);

  // Insert chord brackets at cursor
  const insertChordBrackets = useCallback((view) => {
    if (!view) return;

    const { from, to } = view.state.selection.main;
    const selectedText = view.state.sliceDoc(from, to);

    const replacement = selectedText
      ? `[${selectedText}]`
      : '[C]';

    view.dispatch({
      changes: { from, to, insert: replacement },
      selection: selectedText
        ? { anchor: from + replacement.length }
        : { anchor: from + 1 } // Position cursor inside brackets
    });
  }, []);

  // Insert directive braces at cursor
  const insertDirectiveBraces = useCallback((view) => {
    if (!view) return;

    const { from, to } = view.state.selection.main;
    const selectedText = view.state.sliceDoc(from, to);

    const replacement = selectedText
      ? `{${selectedText}}`
      : '{title: }';

    view.dispatch({
      changes: { from, to, insert: replacement },
      selection: selectedText
        ? { anchor: from + replacement.length }
        : { anchor: from + replacement.length - 1 } // Position cursor before closing brace
    });
  }, []);

  // Handle browser-level shortcuts
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event) => {
      const isCtrlCmd = event.ctrlKey || event.metaKey;

      // Only handle shortcuts when editor is focused
      const editorElement = editorView?.dom;
      if (!editorElement || !editorElement.contains(document.activeElement)) {
        return;
      }

      // Prevent browser save dialog
      if (isCtrlCmd && event.key === 's') {
        event.preventDefault();
        onSave?.();
      }

      // Prevent browser print dialog
      if (isCtrlCmd && event.key === 'p') {
        event.preventDefault();
        onPreview?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editorView, onSave, onPreview, disabled]);

  // Get list of available shortcuts for display
  const getShortcutList = useCallback(() => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? '⌘' : 'Ctrl';

    return [
      { key: `${modKey}+S`, description: 'Save chord chart' },
      { key: `${modKey}+P`, description: 'Toggle preview' },
      { key: `${modKey}+F`, description: 'Find in text' },
      { key: `${modKey}+[`, description: 'Insert chord brackets' },
      { key: `${modKey}+{`, description: 'Insert directive braces' }
    ];
  }, []);

  return {
    keymap: createKeymap(),
    insertChordBrackets: useCallback(() => insertChordBrackets(editorView), [insertChordBrackets, editorView]),
    insertDirectiveBraces: useCallback(() => insertDirectiveBraces(editorView), [insertDirectiveBraces, editorView]),
    getShortcutList,
    isEnabled: !disabled
  };
}