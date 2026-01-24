/**
 * useFeaturedSongs Hook
 *
 * Fetches featured/curated songs by slug list for the homepage.
 * The slug list is hardcoded for now; admin UI can be added later.
 */

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { mapConvexSongToFrontend } from '@/features/shared';
import type { Song } from '@/types/Song.types';

// Hardcoded featured song slugs - update this list to curate featured songs
// TODO: Replace with admin-managed list in the future
export const FEATURED_SONG_SLUGS: string[] = [
  // Add your featured song slugs here
  // Example: 'how-great-is-our-god', 'amazing-grace', 'holy-holy-holy'
];

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
