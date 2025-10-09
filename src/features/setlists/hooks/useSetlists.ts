/**
 * useSetlists hook
 *
 * Manages all setlists with CRUD operations.
 * Pattern: src/features/arrangements/hooks/useArrangementData.ts
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { SetlistRepository } from '@/features/pwa/db/repository';
import type { Setlist } from '@/types';
import logger from '@/lib/logger';

export interface UseSetlistsReturn {
  setlists: Setlist[];
  loading: boolean;
  error: string | null;
  createSetlist: (data: Partial<Setlist>) => Promise<Setlist>;
  deleteSetlist: (id: string) => Promise<void>;
  reload: () => void;
}

/**
 * Hook for managing all setlists
 *
 * @returns Setlists data and CRUD operations
 */
export function useSetlists(): UseSetlistsReturn {
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize repository to prevent re-instantiation
  const repo = useMemo(() => new SetlistRepository(), []);

  /**
   * Load all setlists from IndexedDB
   */
  const loadSetlists = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await repo.getAll();
      setSetlists(data);
      logger.debug('Loaded setlists:', data.length);
    } catch (err) {
      logger.error('Failed to load setlists:', err);
      setError('Failed to load setlists');
    } finally {
      setLoading(false);
    }
  }, [repo]);

  /**
   * Create a new setlist
   */
  const createSetlist = useCallback(async (data: Partial<Setlist>): Promise<Setlist> => {
    const now = new Date().toISOString();
    const newSetlist = await repo.save({
      ...data,
      songs: data.songs || [],
      createdAt: now,
      updatedAt: now
    } as Setlist);

    setSetlists(prev => [...prev, newSetlist]);
    logger.info('Created setlist:', newSetlist.name);
    return newSetlist;
  }, [repo]);

  /**
   * Delete a setlist by ID
   */
  const deleteSetlist = useCallback(async (id: string): Promise<void> => {
    await repo.delete(id);
    setSetlists(prev => prev.filter(s => s.id !== id));
    logger.info('Deleted setlist:', id);
  }, [repo]);

  /**
   * Reload setlists from database
   */
  const reload = useCallback((): void => {
    loadSetlists();
  }, [loadSetlists]);

  // Load setlists on mount
  useEffect(() => {
    loadSetlists();
  }, [loadSetlists]);

  return {
    setlists,
    loading,
    error,
    createSetlist,
    deleteSetlist,
    reload
  };
}
