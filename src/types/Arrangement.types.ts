/**
 * Arrangement domain model types
 *
 * An Arrangement represents a specific playable version of a Song with chords
 * and musical details (key, tempo, capo, etc.).
 */

export interface Arrangement {
  id: string;
  songId: string;
  name: string;
  key: string; // Musical key (C, D, E, F, G, A, B, with sharps/flats)
  tempo: number; // BPM (beats per minute)
  timeSignature: string; // e.g., "4/4", "3/4", "6/8"
  capo: number; // Capo position (0 = no capo)
  tags: string[];
  rating: number; // Average rating (0-5)
  favorites: number; // Popularity count
  chordProContent: string; // ChordPro formatted text
  createdAt: string;
  updatedAt: string;
  // Future fields for Phase 5 (sync support)
  syncStatus?: 'pending' | 'synced' | 'conflict';
  version?: number;
  lastAccessedAt?: number;
}

/**
 * Metadata subset used for forms and editing
 * These are the core musical properties that can be edited separately
 * from the ChordPro content
 */
export interface ArrangementMetadata {
  key: string;
  tempo: number;
  timeSignature: string;
  capo: number;
}

/**
 * Sort options for arrangements
 */
export type SortOption = 'popular' | 'rating' | 'newest' | 'oldest';
