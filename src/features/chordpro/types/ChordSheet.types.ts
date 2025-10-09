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
