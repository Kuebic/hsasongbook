/**
 * Song domain model types
 *
 * A Song represents the abstract musical composition with metadata and lyrics.
 * Songs can have multiple Arrangements (different playable versions).
 */

export interface Song {
  id: string;
  title: string;
  artist: string;
  themes?: string[];
  copyright?: string;
  lyrics?: {
    en?: string;
    [language: string]: string | undefined;
  };
  // Future fields for Phase 5
  compositionYear?: number;
  source?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
