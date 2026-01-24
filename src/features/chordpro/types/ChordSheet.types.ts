/**
 * ChordPro feature types
 *
 * Types for ChordPro parsing, rendering, and transposition using ChordSheetJS
 */

import { Song as ChordSheetSong } from 'chordsheetjs';

/**
 * Result of parsing ChordPro content
 */
export interface ChordSheetResult {
  parsedSong: ChordSheetSong | null;
  htmlOutput: string;
  metadata: ChordSheetMetadata;
  hasChords: boolean;
  error: string | null;
}

/**
 * Metadata extracted from ChordPro content
 */
export interface ChordSheetMetadata {
  title: string | null;
  artist: string | null;
  key: string | null;
  tempo: number | null;
  capo: number | null;
  timeSignature: string | null;
  [key: string]: string | number | null; // Allow additional metadata
}

/**
 * Transposition state
 */
export interface TranspositionState {
  currentKey: string;
  originalKey: string;
  semitones: number;
  transpositionOffset: number;  // Alias for semitones for clarity
  isTransposed: boolean;
}

/**
 * Editor state
 */
export interface EditorState {
  content: string;
  isDirty: boolean;
  lastSaved: Date | null;
  autoSaveEnabled: boolean;
}

/**
 * Draft persistence types
 */
export interface DraftMetadata {
  arrangementId: string;
  savedAt: string;
  contentLength: number;
}

/**
 * Transposition hook return type
 */
export interface UseTranspositionReturn {
  // State
  transposedSong: ChordSheetSong | null;
  currentKey: string;
  originalKey: string;
  transpositionOffset: number;
  preferFlats: boolean;

  // Actions
  transposeBy: (semitones: number) => void;
  transposeUp: () => void;
  transposeDown: () => void;
  reset: () => void;
  toggleEnharmonic: () => void;

  // Utils
  isTransposed: boolean;
  canTransposeUp: boolean;
  canTransposeDown: boolean;
}

/**
 * Auto-save status
 */
export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'disabled';

/**
 * Auto-save hook options
 */
export interface UseAutoSaveOptions {
  arrangementId?: string;
  onSave?: (draft: unknown) => void;
  debounceMs?: number;
  idleTimeoutMs?: number;
  enabled?: boolean;
  enablePeriodicSave?: boolean;
}

/**
 * Auto-save hook return type
 */
export interface UseAutoSaveReturn {
  // Status and state
  saveStatus: AutoSaveStatus;
  lastSaved: Date | null;
  saveError: string | null;
  isDirty: boolean;
  hasUnsavedChanges: boolean;
  enabled: boolean;

  // Actions
  forceSave: () => Promise<boolean>;
  getLatestDraft: () => Promise<unknown | null>;
  clearDrafts: () => Promise<boolean>;

  // Utilities
  isAutoSaving: boolean;
  isError: boolean;
  isSaved: boolean;
}

/**
 * Save status types
 */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict' | 'dirty';

/**
 * Conflict data structure
 */
export interface ConflictData {
  local: string;
  remote: string;
  localVersion: number;
  remoteVersion: number;
  timestamp: Date;
}

/**
 * Save result structure
 */
export interface SaveResult {
  success: boolean;
  unchanged?: boolean;
  conflictDetected?: boolean;
  conflictData?: ConflictData;
  arrangement?: {
    version: number;
  };
  timestamp?: Date;
  error?: Error;
}

/**
 * Generic save result for type-safe data payloads
 * Used by services that need strongly typed return values
 */
export type TypedSaveResult<T = unknown> =
  | {
      success: true;
      data: T;
      timestamp: Date;
      unchanged?: boolean;
    }
  | {
      success: false;
      error: Error;
      timestamp: Date;
      conflictDetected?: boolean;
      conflictData?: ConflictData;
    };

/**
 * Arrangement save hook options
 */
export interface UseArrangementSaveOptions {
  onSaveSuccess?: (result: SaveResult) => void;
  onSaveError?: (error: Error) => void;
  onConflict?: (conflictData: ConflictData) => void;
  currentVersion?: number | null;
}

/**
 * Arrangement save hook return type
 */
export interface UseArrangementSaveReturn {
  // Save state
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  saveError: string | null;
  isDirty: boolean;
  conflictData: ConflictData | null;

  // Save operations
  saveToArrangement: () => Promise<SaveResult>;
  retrySave: () => Promise<SaveResult | undefined>;
  resolveConflict: (resolution?: 'local' | 'remote') => Promise<SaveResult>;

  // Status helpers
  isSaving: boolean;
  isSaved: boolean;
  hasError: boolean;
  hasConflict: boolean;

  // Version tracking
  currentSavedVersion: number | null;
}

/**
 * Editor selection range
 */
export interface EditorSelection {
  from: number;
  to: number;
}

/**
 * ChordPro editor hook options
 */
export interface UseChordProEditorOptions {
  value?: string;
  onChange?: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  editorConfig?: Record<string, unknown>;
}

/**
 * ChordPro editor hook return type
 */
export interface UseChordProEditorReturn extends ChordSheetResult {
  // Editor configuration for @uiw/react-codemirror
  editorProps: {
    value: string;
    placeholder: string;
    extensions: unknown[];
    editable: boolean;
    autoFocus: boolean;
    basicSetup: {
      lineNumbers: boolean;
      highlightActiveLine: boolean;
      highlightSelectionMatches: boolean;
      searchKeymap: boolean;
      bracketMatching: boolean;
      autocompletion: boolean;
      rectangularSelection: boolean;
      history: boolean;
    };
    onChange: (content: string) => void;
  };
  setEditorView: (view: unknown) => void;

  // Editor state
  content: string;
  isDirty: boolean;
  hasErrors: boolean;
  cursorPosition: number;
  selection: EditorSelection | null;

  // Editor utilities
  insertText: (text: string, position?: number | null) => void;
  insertChord: (chord: string) => void;
  insertDirective: (directive: string, argument?: string) => void;
  getSelectedText: () => string;
  replaceSelection: (text: string) => void;
  focusEditor: () => void;

  // Configuration
  config: Record<string, unknown>;
}

/**
 * Draft comparison result
 */
export interface DraftComparison {
  hasDraft: boolean;
  contentDiffers: boolean;
  isDraftNewer: boolean;
  draftContent: string;
  arrangementContent: string;
  draftTimestamp: Date | null;
  arrangementTimestamp: Date | null;
  error?: Error;
}

/**
 * Draft preview
 */
export interface DraftPreview {
  draftPreview: string;
  arrangementPreview: string;
  draftHasMore: boolean;
  arrangementHasMore: boolean;
}

/**
 * Draft recovery hook return type
 */
export interface UseDraftRecoveryReturn {
  // State
  hasDraft: boolean;
  draftContent: string;
  arrangementContent: string;
  draftTimestamp: Date | null;
  arrangementTimestamp: Date | null;
  isDraftNewer: boolean;
  contentDiffers: boolean;
  showRecoveryDialog: boolean;
  checking: boolean;

  // Operations
  checkForDraft: () => Promise<void>;
  applyDraft: () => string | null;
  discardDraft: () => Promise<void>;
  closeDialog: () => void;
  getPreview: () => DraftPreview;
}

/**
 * Shortcut item for display
 */
export interface ShortcutItem {
  key: string;
  description: string;
}

/**
 * Editor shortcuts hook options
 */
export interface UseEditorShortcutsOptions {
  onSave?: () => void;
  onPreview?: () => void;
  onFind?: () => void;
  disabled?: boolean;
}

/**
 * Editor shortcuts hook return type
 */
export interface UseEditorShortcutsReturn {
  keymap: unknown;
  insertChordBrackets: () => void;
  insertDirectiveBraces: () => void;
  getShortcutList: () => ShortcutItem[];
  isEnabled: boolean;
}

/**
 * Key signature information
 */
export interface KeySignature {
  mode: 'major' | 'minor';
  sharps: number;
  flats: number;
}

/**
 * Alternative key suggestion
 */
export interface AlternativeKey {
  key: string;
  confidence: number;
}

/**
 * Key detection hook return type
 */
export interface UseKeyDetectionReturn {
  detectedKey: string | null;
  confidence: number;
  keySignature: KeySignature | null;
  alternativeKeys: AlternativeKey[];
}

/**
 * Synchronized scroll hook options
 */
export interface UseSynchronizedScrollOptions {
  leftRef: { current: HTMLElement | null };
  rightRef: { current: HTMLElement | null };
  enabled?: boolean;
  debounceMs?: number;
}

/**
 * Synchronized scroll hook return type
 */
export interface UseSynchronizedScrollReturn {
  syncToLeft: () => void;
  syncToRight: () => void;
  resetScroll: () => void;
  isEnabled: boolean;
}

/**
 * Undo/redo state
 */
export interface UndoRedoState {
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
}

/**
 * Undo/redo hook return type
 */
export interface UseUndoRedoReturn extends UndoRedoState {
  // Operations
  executeUndo: () => boolean;
  executeRedo: () => boolean;

  // Refresh state manually
  updateState: () => void;
}
