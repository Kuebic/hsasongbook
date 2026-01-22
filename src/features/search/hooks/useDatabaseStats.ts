/**
 * useDatabaseStats hook
 *
 * Loads database statistics (song count, arrangement count)
 * for the homepage stats widget using Convex.
 */

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

export interface DatabaseStats {
  songs: number;
  arrangements: number;
  setlists: number;
}

export interface UseDatabaseStatsReturn {
  stats: DatabaseStats | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Hook for loading database statistics from Convex
 *
 * @returns Database stats and reload function
 */
export function useDatabaseStats(): UseDatabaseStatsReturn {
  const songCount = useQuery(api.songs.count);
  const arrangementCount = useQuery(api.arrangements.count);

  // Loading state: any query still loading
  const loading = songCount === undefined || arrangementCount === undefined;

  const stats: DatabaseStats | null = loading
    ? null
    : {
        songs: songCount ?? 0,
        arrangements: arrangementCount ?? 0,
        setlists: 0, // Setlists are private to users, skip count for MVP
      };

  return {
    stats,
    loading,
    error: null, // Convex handles errors via ConvexProvider
    reload: () => {}, // Convex auto-reloads on data changes
  };
}
