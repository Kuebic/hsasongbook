/**
 * ChordPro Feature Module
 *
 * Main exports for the ChordPro viewer functionality
 * with ChordSheetJS v12 integration
 */

// Default export - main viewer component
export { default } from './components/ChordProViewer'

// Named exports for additional components
export { default as ChordToggle } from './components/ChordToggle'

// Hook exports
export { useChordSheet } from './hooks/useChordSheet'

// Utility exports removed - over-engineered utilities that weren't being used