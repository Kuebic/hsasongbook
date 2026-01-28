/**
 * useSetlistPlaylist Hook
 *
 * Provides playlist functionality for setlists, including:
 * - Building PlaylistItem array from setlist arrangements
 * - Play All functionality
 * - Single arrangement playback
 * - Tracking which arrangement is currently playing
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useConvex } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { useAudioPlayer } from '@/features/audio/hooks/useAudioPlayer';
import type { PlaylistItem } from '@/features/audio/context/AudioPlayerContext';
import { extractYoutubeVideoId } from '@/features/arrangements/validation/audioSchemas';
import type { Arrangement, Song, SetlistSong } from '@/types';

interface UseSetlistPlaylistParams {
  songs: SetlistSong[];
  arrangements: Map<string, Arrangement>;
  parentSongs: Map<string, Song>;
}

interface UseSetlistPlaylistReturn {
  /** Build playlist from all setlist songs */
  playlistItems: PlaylistItem[];
  /** Start playing all songs in order */
  playAll: () => void;
  /** Play a specific arrangement from the setlist */
  playArrangement: (arrangementId: string) => void;
  /** Check if a specific arrangement is currently playing */
  isArrangementPlaying: (arrangementId: string) => boolean;
  /** Check if any arrangement from this setlist is playing */
  isSetlistPlaying: boolean;
  /** Current playing index in the playlist (-1 if not playing from this playlist) */
  currentPlayingIndex: number;
  /** Whether playlist has any playable items */
  hasPlayableItems: boolean;
}

export function useSetlistPlaylist({
  songs,
  arrangements,
  parentSongs,
}: UseSetlistPlaylistParams): UseSetlistPlaylistReturn {
  const convex = useConvex();
  const {
    playlist,
    loadPlaylist,
    setFetchAudioUrl,
    isPlaying,
  } = useAudioPlayer();

  // Build playlist items from setlist data
  const playlistItems = useMemo((): PlaylistItem[] => {
    return songs.map((song) => {
      const arrangement = arrangements.get(song.arrangementId);
      const parentSong = arrangement ? parentSongs.get(arrangement.songId) : undefined;

      const hasAudio = !!arrangement?.audioFileKey;
      const hasYoutube = !!arrangement?.youtubeUrl;
      const youtubeVideoId = arrangement?.youtubeUrl
        ? extractYoutubeVideoId(arrangement.youtubeUrl)
        : undefined;

      return {
        arrangementId: song.arrangementId,
        songTitle: parentSong?.title ?? 'Unknown Song',
        arrangementName: arrangement?.name ?? 'Unknown Arrangement',
        arrangementSlug: arrangement?.slug ?? '',
        songSlug: parentSong?.slug ?? '',
        hasAudio,
        hasYoutube,
        youtubeVideoId: youtubeVideoId ?? undefined,
      };
    });
  }, [songs, arrangements, parentSongs]);

  // Check if playlist has any playable items
  const hasPlayableItems = useMemo(() => {
    return playlistItems.some((item) => item.hasAudio || item.hasYoutube);
  }, [playlistItems]);

  // Create and register the fetch audio URL function
  const fetchAudioUrl = useCallback(async (arrangementId: string): Promise<string | null> => {
    try {
      const url = await convex.query(api.files.getArrangementAudioUrl, {
        arrangementId: arrangementId as Id<'arrangements'>,
      });
      return url;
    } catch {
      return null;
    }
  }, [convex]);

  // Register the fetch function with the audio context
  useEffect(() => {
    setFetchAudioUrl(fetchAudioUrl);
  }, [setFetchAudioUrl, fetchAudioUrl]);

  // Play all songs starting from the first playable one
  const playAll = useCallback(() => {
    if (!hasPlayableItems) return;
    loadPlaylist(playlistItems, 0);
  }, [loadPlaylist, playlistItems, hasPlayableItems]);

  // Play a specific arrangement
  const playArrangement = useCallback((arrangementId: string) => {
    const index = playlistItems.findIndex((i) => i.arrangementId === arrangementId);
    if (index === -1) return;

    // Load the full playlist starting from this item
    loadPlaylist(playlistItems, index);
  }, [playlistItems, loadPlaylist]);

  // Check if a specific arrangement is playing
  const isArrangementPlaying = useCallback((arrangementId: string): boolean => {
    if (playlist.currentIndex < 0 || !playlist.items.length) {
      return false;
    }
    const currentItem = playlist.items[playlist.currentIndex];
    return currentItem?.arrangementId === arrangementId && isPlaying;
  }, [playlist, isPlaying]);

  // Check if this setlist is currently playing
  const isSetlistPlaying = useMemo(() => {
    if (playlist.currentIndex < 0 || !playlist.items.length) {
      return false;
    }
    // Check if the current playlist matches this setlist's items
    const setlistArrangementIds = new Set(playlistItems.map((i) => i.arrangementId));

    // If all items in current playlist are from this setlist
    return playlist.items.every((item) => setlistArrangementIds.has(item.arrangementId));
  }, [playlist, playlistItems]);

  // Get current playing index
  const currentPlayingIndex = useMemo(() => {
    if (!isSetlistPlaying) return -1;
    return playlist.currentIndex;
  }, [isSetlistPlaying, playlist.currentIndex]);

  return {
    playlistItems,
    playAll,
    playArrangement,
    isArrangementPlaying,
    isSetlistPlaying,
    currentPlayingIndex,
    hasPlayableItems,
  };
}
