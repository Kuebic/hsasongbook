/**
 * useRecentSongs hook
 *
 * Loads recently viewed songs from IndexedDB for the homepage widget.
 * Pattern: src/features/setlists/hooks/useSetlistData.ts
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SongRepository } from '@/features/pwa/db/repository';
import type { Song } from '@/types';
import logger from '@/lib/logger';

export interface UseRecentSongsReturn {
  recentSongs: Song[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Hook for loading recently viewed songs
 *
 * @param limit - Maximum number of recent songs to load (default: 5)
 * @returns Recent songs data and reload function
 */
export function useRecentSongs(limit = 5): UseRecentSongsReturn {
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize repository to prevent re-instantiation
  const repo = useMemo(() => new SongRepository(), []);

  /**
   * Load recently viewed songs from IndexedDB
   */
  const loadRecentSongs = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const songs = await repo.getRecentlyViewed(limit);
      setRecentSongs(songs);
      logger.debug(`Loaded ${songs.length} recent songs`);
    } catch (err) {
      logger.error('Failed to load recent songs:', err);
      setError('Failed to load recent songs');
    } finally {
      setLoading(false);
    }
  }, [repo, limit]);

  /**
   * Reload recent songs from database
   */
  const reload = useCallback((): void => {
    loadRecentSongs();
  }, [loadRecentSongs]);

  // Load recent songs on mount or when limit changes
  useEffect(() => {
    loadRecentSongs();
  }, [loadRecentSongs]);

  return {
    recentSongs,
    loading,
    error,
    reload
  };
}
