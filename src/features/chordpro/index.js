/**
 * ChordPro Feature Module
 *
 * Main exports for the ChordPro viewer functionality
 * with ChordSheetJS v12 integration and real-time transposition
 */

// Default export - main viewer component
export { default } from './components/ChordProViewer'

// Named exports for viewer components
export { default as ChordProViewer } from './components/ChordProViewer'
export { default as ChordToggle } from './components/ChordToggle'
export { default as TransposeControl } from './components/TransposeControl'

// Hook exports
export { useChordSheet } from './hooks/useChordSheet'
export { useTransposition } from './hooks/useTransposition'
export { useChordProEditor } from './hooks/useChordProEditor'
export { useAutoSave } from './hooks/useAutoSave'
export { useEditorShortcuts } from './hooks/useEditorShortcuts'

// Editor components
export { default as ChordProEditor } from './components/ChordProEditor'
export { default as EditorToolbar } from './components/EditorToolbar'
export { default as AutoSaveIndicator } from './components/AutoSaveIndicator'

// Database
export { DraftRepository } from './db/DraftRepository'

// Utilities
export * from './utils/editorHelpers'

// Language support
export { chordProLanguage } from './language/chordProLanguage'
export { chordProHighlight } from './language/chordProHighlight'
export { chordProCompletion } from './language/chordProComplete'