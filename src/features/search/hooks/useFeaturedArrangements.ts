/**
 * useFeaturedArrangements hook
 *
 * Loads featured arrangements from IndexedDB for the homepage widget.
 * Uses algorithm: score = (rating × 0.6) + (favorites × 0.004)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrangementRepository } from '@/features/pwa/db/repository';
import type { ArrangementWithSong } from '@/types';
import logger from '@/lib/logger';

export interface UseFeaturedArrangementsReturn {
  featured: ArrangementWithSong[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Hook for loading featured arrangements
 *
 * @param limit - Maximum number of featured arrangements to load (default: 6)
 * @returns Featured arrangements data and reload function
 */
export function useFeaturedArrangements(limit = 6): UseFeaturedArrangementsReturn {
  const [featured, setFeatured] = useState<ArrangementWithSong[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize repository to prevent re-instantiation
  const repo = useMemo(() => new ArrangementRepository(), []);

  /**
   * Load featured arrangements with song data from IndexedDB
   */
  const loadFeatured = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const arrangements = await repo.getFeaturedWithSongs(limit);
      setFeatured(arrangements);
      logger.debug(`Loaded ${arrangements.length} featured arrangements with song data`);
    } catch (err) {
      logger.error('Failed to load featured arrangements:', err);
      setError('Failed to load featured arrangements');
    } finally {
      setLoading(false);
    }
  }, [repo, limit]);

  /**
   * Reload featured arrangements from database
   */
  const reload = useCallback((): void => {
    loadFeatured();
  }, [loadFeatured]);

  // Load featured arrangements on mount or when limit changes
  useEffect(() => {
    loadFeatured();
  }, [loadFeatured]);

  return {
    featured,
    loading,
    error,
    reload
  };
}
