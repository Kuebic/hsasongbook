/**
 * useRecentSongs Hook
 *
 * Fetches recently added songs for the homepage.
 */

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { mapConvexSongToFrontend } from '@/features/shared';

export function useRecentSongs(limit = 6) {
  const data = useQuery(api.songs.getRecent, { limit });
  const songs = (data ?? []).map(mapConvexSongToFrontend);

  return {
    songs,
    loading: data === undefined,
  };
}

export default useRecentSongs;
