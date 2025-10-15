/**
 * Arrangement domain model types
 *
 * An Arrangement represents a specific playable version of a Song with chords
 * and musical details (key, tempo, capo, etc.).
 */

export interface Arrangement {
  id: string;
  slug: string; // URL-friendly slug (e.g., "gh2lk" - 6-char nanoid only)
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
  // Phase 5 fields (Authentication)
  userId?: string;                     // Creator user ID (optional for backward compatibility)
  isPublic?: boolean;                  // Public vs private (default: true for arrangements)
  // Phase 5 fields (Sync support)
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

/**
 * Arrangement with embedded song data for display purposes
 *
 * Used in widgets and cards where song context is needed without separate queries.
 * This is a query-time join pattern (denormalization) for read-optimized scenarios.
 *
 * Example use cases:
 * - Featured arrangements widget (shows "Song Title - Arrangement Name")
 * - Search results (shows arrangement with parent song context)
 * - Recently played (displays full context)
 */
export interface ArrangementWithSong extends Arrangement {
  song: {
    id: string;
    slug: string;
    title: string;
    artist: string;
  };
}
