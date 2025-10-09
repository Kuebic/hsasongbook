/**
 * useSetlistData hook
 *
 * Manages a single setlist with update operations.
 * Pattern: src/features/arrangements/hooks/useArrangementData.ts
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { SetlistRepository } from '@/features/pwa/db/repository';
import { ArrangementRepository } from '@/features/pwa/db/repository';
import type { Setlist, Arrangement } from '@/types';
import logger from '@/lib/logger';

export interface UseSetlistDataReturn {
  setlist: Setlist | null;
  arrangements: Map<string, Arrangement>;
  loading: boolean;
  error: string | null;
  updateSetlist: (updates: Partial<Setlist>) => Promise<Setlist>;
  reload: () => void;
}

/**
 * Hook for managing a single setlist with arrangements data
 *
 * @param setlistId - ID of the setlist to load
 * @returns Setlist data and update operations
 */
export function useSetlistData(setlistId: string | undefined): UseSetlistDataReturn {
  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [arrangements, setArrangements] = useState<Map<string, Arrangement>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize repositories to prevent re-instantiation
  const setlistRepo = useMemo(() => new SetlistRepository(), []);
  const arrangementRepo = useMemo(() => new ArrangementRepository(), []);

  /**
   * Load setlist and associated arrangements from IndexedDB
   */
  const loadSetlist = useCallback(async (): Promise<void> => {
    if (!setlistId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load setlist
      const data = await setlistRepo.getById(setlistId);
      if (!data) {
        setError('Setlist not found');
        setSetlist(null);
        return;
      }
      setSetlist(data);

      // Load arrangements for songs in setlist
      const arrangementIds = data.songs.map(s => s.arrangementId);
      const arrangementsMap = new Map<string, Arrangement>();

      await Promise.all(
        arrangementIds.map(async (id) => {
          const arrangement = await arrangementRepo.getById(id);
          if (arrangement) {
            arrangementsMap.set(id, arrangement);
          }
        })
      );

      setArrangements(arrangementsMap);
      logger.debug('Loaded setlist with arrangements:', data.name, arrangementsMap.size);
    } catch (err) {
      logger.error('Failed to load setlist:', err);
      setError('Failed to load setlist');
    } finally {
      setLoading(false);
    }
  }, [setlistId, setlistRepo, arrangementRepo]);

  /**
   * Update setlist data
   */
  const updateSetlist = useCallback(async (updates: Partial<Setlist>): Promise<Setlist> => {
    if (!setlist) {
      throw new Error('No setlist loaded');
    }

    const updated = await setlistRepo.save({
      ...setlist,
      ...updates,
      updatedAt: new Date().toISOString()
    });

    setSetlist(updated);
    logger.info('Updated setlist:', updated.name);
    return updated;
  }, [setlist, setlistRepo]);

  /**
   * Reload setlist from database
   */
  const reload = useCallback((): void => {
    loadSetlist();
  }, [loadSetlist]);

  // Load setlist on mount or when ID changes
  useEffect(() => {
    loadSetlist();
  }, [loadSetlist]);

  return {
    setlist,
    arrangements,
    loading,
    error,
    updateSetlist,
    reload
  };
}
