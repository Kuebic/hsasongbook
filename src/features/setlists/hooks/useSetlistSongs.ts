/**
 * useSetlistSongs Hook
 *
 * Manages song operations within a setlist (add, remove, reorder) using Convex.
 * Pattern: src/features/arrangements/hooks/useArrangementData.ts
 */

import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import logger from '@/lib/logger';
import type { Setlist, SetlistSong } from '@/types';

export interface UseSetlistSongsReturn {
  addSong: (arrangementId: string, customKey?: string) => Promise<void>;
  removeSong: (songId: string) => Promise<void>;
  reorderSongs: (reorderedSongs: SetlistSong[]) => Promise<void>;
  updateSongKey: (songId: string, newKey: string) => Promise<void>;
}

export function useSetlistSongs(
  setlist: Setlist | null,
  onUpdate: (updatedSetlist: Setlist) => void
): UseSetlistSongsReturn {
  const updateMutation = useMutation(api.setlists.update);

  /**
   * Add a song (arrangement) to the setlist
   */
  const addSong = useCallback(
    async (arrangementId: string): Promise<void> => {
      if (!setlist) return;

      // Build new arrangementIds array
      const newArrangementIds = [
        ...setlist.songs.map((s) => s.arrangementId),
        arrangementId,
      ];

      logger.debug('Adding song to setlist:', arrangementId);

      await updateMutation({
        id: setlist.id as Id<'setlists'>,
        arrangementIds: newArrangementIds as Id<'arrangements'>[],
      });

      // Optimistic update for UI
      const newSong: SetlistSong = {
        id: arrangementId, // Stable ID for dnd-kit
        songId: '', // Populated on next query
        arrangementId,
        order: setlist.songs.length,
      };

      onUpdate({
        ...setlist,
        songs: [...setlist.songs, newSong],
        updatedAt: new Date().toISOString(),
      });

      logger.info('Song added to setlist');
    },
    [setlist, updateMutation, onUpdate]
  );

  /**
   * Remove a song from the setlist
   */
  const removeSong = useCallback(
    async (songEntryId: string): Promise<void> => {
      if (!setlist) return;

      const songIndex = setlist.songs.findIndex((s) => s.id === songEntryId);
      if (songIndex === -1) return;

      // Filter out the removed song and rebuild arrangementIds
      const newSongs = setlist.songs.filter((s) => s.id !== songEntryId);
      const newArrangementIds = newSongs.map((s) => s.arrangementId);

      logger.debug('Removing song from setlist:', songEntryId);

      await updateMutation({
        id: setlist.id as Id<'setlists'>,
        arrangementIds: newArrangementIds as Id<'arrangements'>[],
      });

      // Optimistic update with reindexed order
      onUpdate({
        ...setlist,
        songs: newSongs.map((s, i) => ({ ...s, order: i })),
        updatedAt: new Date().toISOString(),
      });

      logger.info('Song removed from setlist');
    },
    [setlist, updateMutation, onUpdate]
  );

  /**
   * Persist reordered songs to Convex (UI state managed by useDragReorder)
   */
  const reorderSongs = useCallback(
    async (reorderedSongs: SetlistSong[]): Promise<void> => {
      if (!setlist) return;

      const newArrangementIds = reorderedSongs.map((s) => s.arrangementId);
      logger.debug('Reordering songs:', { count: reorderedSongs.length });

      await updateMutation({
        id: setlist.id as Id<'setlists'>,
        arrangementIds: newArrangementIds as Id<'arrangements'>[],
      });

      logger.info('Songs reordered');
    },
    [setlist, updateMutation]
  );

  /**
   * Update the custom key for a song in the setlist
   * NOTE: Not supported in MVP - customKey is not stored in Convex schema
   */
  const updateSongKey = useCallback(
    async (_songId: string, _newKey: string): Promise<void> => {
      logger.warn('updateSongKey not supported in MVP - customKey not stored in Convex schema');
      // Post-MVP: This would require schema changes to store per-song metadata
    },
    []
  );

  return { addSong, removeSong, reorderSongs, updateSongKey };
}
