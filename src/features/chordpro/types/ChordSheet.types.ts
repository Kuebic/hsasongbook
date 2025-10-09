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
