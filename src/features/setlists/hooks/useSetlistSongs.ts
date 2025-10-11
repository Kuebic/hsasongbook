/**
 * useSetlistSongs Hook
 *
 * Manages song operations within a setlist (add, remove, reorder).
 * Works with SetlistRepository for persistence.
 */

import { useCallback, useMemo } from 'react';
import { SetlistRepository } from '@/features/pwa/db/repository';
import logger from '@/lib/logger';
import type { Setlist, SetlistSong } from '@/types';

export interface UseSetlistSongsReturn {
  addSong: (arrangementId: string, customKey?: string) => Promise<void>;
  removeSong: (songId: string) => Promise<void>;
  reorderSongs: (sourceIndex: number, destinationIndex: number) => Promise<void>;
  updateSongKey: (songId: string, newKey: string) => Promise<void>;
}

export function useSetlistSongs(
  setlist: Setlist | null,
  onUpdate: (updatedSetlist: Setlist) => void
): UseSetlistSongsReturn {
  const repo = useMemo(() => new SetlistRepository(), []);

  const addSong = useCallback(async (
    arrangementId: string,
    customKey?: string
  ): Promise<void> => {
    if (!setlist) return;

    const newSong: SetlistSong = {
      id: `setlist-song-${Date.now()}`,
      songId: '', // Will be populated from arrangement
      arrangementId,
      order: setlist.songs.length,
      customKey,
      notes: ''
    };

    const updated = {
      ...setlist,
      songs: [...setlist.songs, newSong],
      updatedAt: new Date().toISOString()
    };

    const saved = await repo.save(updated);
    onUpdate(saved);
    logger.debug('Song added to setlist:', newSong);
  }, [setlist, repo, onUpdate]);

  const removeSong = useCallback(async (songId: string): Promise<void> => {
    if (!setlist) return;

    const filteredSongs = setlist.songs.filter(s => s.id !== songId);

    // Reindex order after removal
    const reindexed = filteredSongs.map((song, index) => ({
      ...song,
      order: index
    }));

    const updated = {
      ...setlist,
      songs: reindexed,
      updatedAt: new Date().toISOString()
    };

    const saved = await repo.save(updated);
    onUpdate(saved);
    logger.debug('Song removed from setlist:', songId);
  }, [setlist, repo, onUpdate]);

  const reorderSongs = useCallback(async (
    sourceIndex: number,
    destinationIndex: number
  ): Promise<void> => {
    if (!setlist) return;
    if (sourceIndex === destinationIndex) return;

    const reordered = [...setlist.songs];
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, removed);

    // Update order numbers
    const updated = reordered.map((song, index) => ({
      ...song,
      order: index
    }));

    const saved = await repo.save({
      ...setlist,
      songs: updated,
      updatedAt: new Date().toISOString()
    });

    onUpdate(saved);
    logger.debug('Songs reordered:', { sourceIndex, destinationIndex });
  }, [setlist, repo, onUpdate]);

  const updateSongKey = useCallback(async (
    songId: string,
    newKey: string
  ): Promise<void> => {
    if (!setlist) return;

    const updatedSongs = setlist.songs.map(song =>
      song.id === songId
        ? { ...song, customKey: newKey }
        : song
    );

    const saved = await repo.save({
      ...setlist,
      songs: updatedSongs,
      updatedAt: new Date().toISOString()
    });

    onUpdate(saved);
    logger.debug('Song key updated:', { songId, newKey });
  }, [setlist, repo, onUpdate]);

  return { addSong, removeSong, reorderSongs, updateSongKey };
}
