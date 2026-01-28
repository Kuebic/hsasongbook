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

/**
 * Convert SetlistSong array to Convex songs format
 */
function toConvexSongs(songs: SetlistSong[]) {
  return songs.map((s) => ({
    arrangementId: s.arrangementId as Id<'arrangements'>,
    ...(s.customKey && { customKey: s.customKey }),
  }));
}

export function useSetlistSongs(
  setlist: Setlist | null,
  onUpdate: (updatedSetlist: Setlist) => void
): UseSetlistSongsReturn {
  const updateMutation = useMutation(api.setlists.update);
  const updateSongKeyMutation = useMutation(api.setlists.updateSongKey);

  /**
   * Add a song (arrangement) to the setlist
   */
  const addSong = useCallback(
    async (arrangementId: string, customKey?: string): Promise<void> => {
      if (!setlist) return;

      // Build new songs array with customKey preserved
      const newSongs = [
        ...toConvexSongs(setlist.songs),
        {
          arrangementId: arrangementId as Id<'arrangements'>,
          ...(customKey && { customKey }),
        },
      ];

      logger.debug('Adding song to setlist:', arrangementId);

      await updateMutation({
        id: setlist.id as Id<'setlists'>,
        songs: newSongs,
      });

      // Optimistic update for UI
      const newSong: SetlistSong = {
        id: arrangementId, // Stable ID for dnd-kit
        songId: '', // Populated on next query
        arrangementId,
        order: setlist.songs.length,
        customKey,
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

      // Filter out the removed song (preserving customKey on remaining songs)
      const newSongs = setlist.songs.filter((s) => s.id !== songEntryId);

      logger.debug('Removing song from setlist:', songEntryId);

      await updateMutation({
        id: setlist.id as Id<'setlists'>,
        songs: toConvexSongs(newSongs),
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

      logger.debug('Reordering songs:', { count: reorderedSongs.length });

      // Preserve customKey when reordering
      await updateMutation({
        id: setlist.id as Id<'setlists'>,
        songs: toConvexSongs(reorderedSongs),
      });

      logger.info('Songs reordered');
    },
    [setlist, updateMutation]
  );

  /**
   * Update the custom key for a song in the setlist
   */
  const updateSongKey = useCallback(
    async (songId: string, newKey: string): Promise<void> => {
      if (!setlist) return;

      // Find the song entry (songId is the stable ID, which equals arrangementId)
      const songEntry = setlist.songs.find((s) => s.id === songId);
      if (!songEntry) {
        logger.warn('Song not found in setlist:', songId);
        return;
      }

      logger.debug('Updating song key:', { songId, newKey });

      // Persist to Convex - Convex reactivity will update the UI
      await updateSongKeyMutation({
        setlistId: setlist.id as Id<'setlists'>,
        arrangementId: songEntry.arrangementId as Id<'arrangements'>,
        customKey: newKey,
      });

      logger.info('Song key updated');
    },
    [setlist, updateSongKeyMutation]
  );

  return { addSong, removeSong, reorderSongs, updateSongKey };
}
