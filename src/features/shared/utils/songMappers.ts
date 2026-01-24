/**
 * Song Mapping Utilities
 *
 * Transforms Convex song documents to frontend Song types.
 * Used by hooks that fetch song data from the backend.
 */

import type { Song } from '@/types/Song.types';

/**
 * Raw song data from Convex queries
 */
export interface ConvexSongDocument {
  _id: string;
  _creationTime: number;
  slug: string;
  title: string;
  artist?: string;
  themes: string[];
  copyright?: string;
  lyrics?: string;
  updatedAt?: number;
  favorites?: number;
}

/**
 * Maps a Convex song document to the frontend Song type.
 *
 * @param song - Raw song document from Convex
 * @returns Transformed Song object for frontend use
 */
export function mapConvexSongToFrontend(song: ConvexSongDocument): Song {
  return {
    id: song._id,
    slug: song.slug,
    title: song.title,
    artist: song.artist ?? '',
    themes: song.themes,
    copyright: song.copyright,
    lyrics: song.lyrics ? { en: song.lyrics } : undefined,
    favorites: song.favorites,
    createdAt: new Date(song._creationTime).toISOString(),
    updatedAt: song.updatedAt
      ? new Date(song.updatedAt).toISOString()
      : new Date(song._creationTime).toISOString(),
  };
}
