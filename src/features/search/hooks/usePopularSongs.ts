/**
 * usePopularSongs Hook
 *
 * Fetches popular songs (by arrangement count) for the homepage.
 */

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { mapConvexSongToFrontend } from '@/features/shared';
import type { Song } from '@/types/Song.types';

export function usePopularSongs(limit = 6) {
  const data = useQuery(api.songs.getPopular, { limit });
  const songs = (data ?? []).map((song) =>
    song ? mapConvexSongToFrontend(song) : null
  ).filter((song): song is Song => song !== null);

  return {
    songs,
    loading: data === undefined,
  };
}

export default usePopularSongs;
