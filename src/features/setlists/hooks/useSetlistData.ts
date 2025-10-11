/**
 * useSetlistData hook
 *
 * Manages a single setlist with update operations.
 * Pattern: src/features/arrangements/hooks/useArrangementData.ts
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { SetlistRepository, ArrangementRepository, SongRepository } from '@/features/pwa/db/repository';
import type { Setlist, Arrangement, Song } from '@/types';
import logger from '@/lib/logger';

export interface UseSetlistDataReturn {
  setlist: Setlist | null;
  arrangements: Map<string, Arrangement>;
  songs: Map<string, Song>;
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
  const [songs, setSongs] = useState<Map<string, Song>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize repositories to prevent re-instantiation
  const setlistRepo = useMemo(() => new SetlistRepository(), []);
  const arrangementRepo = useMemo(() => new ArrangementRepository(), []);
  const songRepo = useMemo(() => new SongRepository(), []);

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
      const songsMap = new Map<string, Song>();

      // Load all arrangements
      await Promise.all(
        arrangementIds.map(async (id) => {
          const arrangement = await arrangementRepo.getById(id);
          if (arrangement) {
            arrangementsMap.set(id, arrangement);
          }
        })
      );

      // Load all parent songs for the arrangements
      const songIds = Array.from(arrangementsMap.values()).map(arr => arr.songId);
      await Promise.all(
        songIds.map(async (id) => {
          const song = await songRepo.getById(id);
          if (song) {
            songsMap.set(id, song);
          }
        })
      );

      setArrangements(arrangementsMap);
      setSongs(songsMap);
      logger.debug('Loaded setlist with arrangements and songs:', {
        setlist: data.name,
        arrangements: arrangementsMap.size,
        songs: songsMap.size
      });
    } catch (err) {
      logger.error('Failed to load setlist:', err);
      setError('Failed to load setlist');
    } finally {
      setLoading(false);
    }
  }, [setlistId, setlistRepo, arrangementRepo, songRepo]);

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

  // Reload arrangements and songs when setlist songs change
  useEffect(() => {
    if (!setlist) return;

    const loadMissingData = async (): Promise<void> => {
      const arrangementIds = setlist.songs.map(s => s.arrangementId);
      const arrangementsMap = new Map(arrangements);
      const songsMap = new Map(songs);

      // Find missing arrangements
      const missingArrangementIds = arrangementIds.filter(id => !arrangementsMap.has(id));

      if (missingArrangementIds.length > 0) {
        // Load missing arrangements
        await Promise.all(
          missingArrangementIds.map(async (id) => {
            const arrangement = await arrangementRepo.getById(id);
            if (arrangement) {
              arrangementsMap.set(id, arrangement);
            }
          })
        );

        // Load parent songs for newly loaded arrangements
        const newSongIds = Array.from(arrangementsMap.values())
          .filter(arr => missingArrangementIds.includes(arr.id))
          .map(arr => arr.songId)
          .filter(id => !songsMap.has(id));

        await Promise.all(
          newSongIds.map(async (id) => {
            const song = await songRepo.getById(id);
            if (song) {
              songsMap.set(id, song);
            }
          })
        );

        setArrangements(arrangementsMap);
        setSongs(songsMap);
        logger.debug('Loaded missing arrangements and songs:', {
          arrangements: missingArrangementIds.length,
          songs: newSongIds.length
        });
      }
    };

    loadMissingData();
  }, [setlist, arrangements, songs, arrangementRepo, songRepo]);

  return {
    setlist,
    arrangements,
    songs,
    loading,
    error,
    updateSetlist,
    reload
  };
}
