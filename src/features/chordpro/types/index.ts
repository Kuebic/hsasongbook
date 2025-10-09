/**
 * ChordPro feature types barrel export
 */

export type {
  // Core types
  ChordSheetResult,
  ChordSheetMetadata,
  TranspositionState,
  EditorState,
  DraftMetadata,

  // Transposition
  UseTranspositionReturn,

  // Auto-save
  AutoSaveStatus,
  UseAutoSaveOptions,
  UseAutoSaveReturn,

  // Arrangement save
  SaveStatus,
  ConflictData,
  SaveResult,
  UseArrangementSaveOptions,
  UseArrangementSaveReturn,

  // Editor
  EditorSelection,
  UseChordProEditorOptions,
  UseChordProEditorReturn,

  // Draft recovery
  DraftComparison,
  DraftPreview,
  UseDraftRecoveryReturn,

  // Editor shortcuts
  ShortcutItem,
  UseEditorShortcutsOptions,
  UseEditorShortcutsReturn,

  // Key detection
  KeySignature,
  AlternativeKey,
  UseKeyDetectionReturn,

  // Synchronized scroll
  UseSynchronizedScrollOptions,
  UseSynchronizedScrollReturn,

  // Undo/redo
  UndoRedoState,
  UseUndoRedoReturn,
} from './ChordSheet.types';
