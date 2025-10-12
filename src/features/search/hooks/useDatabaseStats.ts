/**
 * useDatabaseStats hook
 *
 * Loads database statistics (song count, arrangement count, setlist count)
 * for the homepage stats widget.
 */

import { useState, useEffect, useCallback } from 'react';
import { getDatabaseStats, type DatabaseStats } from '@/features/pwa/db/database';
import logger from '@/lib/logger';

export interface UseDatabaseStatsReturn {
  stats: DatabaseStats | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Hook for loading database statistics
 *
 * @returns Database stats and reload function
 */
export function useDatabaseStats(): UseDatabaseStatsReturn {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load database statistics
   */
  const loadStats = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDatabaseStats();
      setStats(data);
      logger.debug('Loaded database stats:', data);
    } catch (err) {
      logger.error('Failed to load database stats:', err);
      setError('Failed to load database stats');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reload stats from database
   */
  const reload = useCallback((): void => {
    loadStats();
  }, [loadStats]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    reload
  };
}
