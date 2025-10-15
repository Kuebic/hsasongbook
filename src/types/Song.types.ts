/**
 * Song domain model types
 *
 * A Song represents the abstract musical composition with metadata and lyrics.
 * Songs can have multiple Arrangements (different playable versions).
 */

export interface Song {
  id: string;
  slug: string; // URL-friendly slug (e.g., "amazing-grace-x4k9p")
  title: string;
  artist: string;
  themes?: string[];
  copyright?: string;
  lyrics?: {
    en?: string;
    [language: string]: string | undefined;
  };
  // Phase 5 fields (Authentication)
  userId?: string;                     // Creator user ID (optional for backward compatibility)
  isPublic?: boolean;                  // Public vs private (default: true for songs)
  // Future fields
  compositionYear?: number;
  source?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
