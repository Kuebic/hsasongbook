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