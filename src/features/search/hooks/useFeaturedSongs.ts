/**
 * useFeaturedSongs Hook
 *
 * Fetches featured/curated songs by slug list for the homepage.
 * The slug list is hardcoded for now; admin UI can be added later.
 */

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Song } from '@/types/Song.types';

// Hardcoded featured song slugs - update this list to curate featured songs
// TODO: Replace with admin-managed list in the future
export const FEATURED_SONG_SLUGS = [
  // Add your featured song slugs here
  // Example: 'how-great-is-our-god', 'amazing-grace', 'holy-holy-holy'
];

function mapConvexSongToFrontend(song: {
  _id: string;
  _creationTime: number;
  slug: string;
  title: string;
  artist?: string;
  themes: string[];
  copyright?: string;
  lyrics?: string;
}): Song {
  return {
    id: song._id,
    slug: song.slug,
    title: song.title,
    artist: song.artist ?? '',
    themes: song.themes,
    copyright: song.copyright,
    lyrics: song.lyrics ? { en: song.lyrics } : undefined,
    createdAt: new Date(song._creationTime).toISOString(),
    updatedAt: new Date(song._creationTime).toISOString(),
  };
}

export function useFeaturedSongs(slugs: string[] = FEATURED_SONG_SLUGS) {
  // Skip query if no slugs provided
  const data = useQuery(
    api.songs.getFeatured,
    slugs.length > 0 ? { slugs } : 'skip'
  );

  const songs = (data ?? []).map((song) =>
    song ? mapConvexSongToFrontend(song) : null
  ).filter((song): song is Song => song !== null);

  return {
    songs,
    loading: slugs.length > 0 && data === undefined,
    hasFeatured: slugs.length > 0,
  };
}

export default useFeaturedSongs;
