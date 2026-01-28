/**
 * useSetlistData hook
 *
 * Manages a single setlist with update operations using Convex.
 * Pattern: src/features/arrangements/hooks/useArrangementData.ts
 */

import { useMemo, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Setlist, Arrangement, Song, SetlistSong } from '@/types';
import logger from '@/lib/logger';
import { normalizeSetlistSongs } from '../utils/normalizeSetlistSongs';

export interface UseSetlistDataReturn {
  setlist: Setlist | null;
  arrangements: Map<string, Arrangement>;
  songs: Map<string, Song>;
  loading: boolean;
  error: string | null;
  updateSetlist: (updates: Partial<Setlist>) => Promise<Setlist>;
  reload: () => void;
  isAuthenticated: boolean;
}

/**
 * Hook for managing a single setlist with arrangements data
 *
 * @param setlistId - ID of the setlist to load
 * @returns Setlist data and update operations
 */
export function useSetlistData(setlistId: string | undefined): UseSetlistDataReturn {
  const { user } = useAuth();
  const isAuthenticated = !!(user && !user.isAnonymous);

  // Use the joined query that returns setlist + arrangements + songs
  const convexData = useQuery(
    api.setlists.getWithArrangements,
    setlistId && isAuthenticated ? { id: setlistId as Id<'setlists'> } : 'skip'
  );

  const updateMutation = useMutation(api.setlists.update);

  // Loading state
  const loading = setlistId !== undefined && isAuthenticated && convexData === undefined;

  // Map Convex data to frontend types
  const { setlist, arrangements, songs } = useMemo(() => {
    if (!convexData) {
      return {
        setlist: null,
        arrangements: new Map<string, Arrangement>(),
        songs: new Map<string, Song>(),
      };
    }

    // Build arrangements map
    const arrangementsMap = new Map<string, Arrangement>();
    const songsMap = new Map<string, Song>();

    // Process arrangements and their songs
    for (const arr of convexData.arrangements) {
      arrangementsMap.set(arr._id, {
        id: arr._id,
        slug: arr.slug,
        songId: arr.songId,
        name: arr.name,
        key: arr.key ?? '',
        tempo: arr.tempo ?? 0,
        timeSignature: arr.timeSignature ?? '4/4',
        capo: arr.capo ?? 0,
        tags: arr.tags,
        rating: arr.rating,
        favorites: arr.favorites,
        chordProContent: arr.chordProContent,
        audioFileKey: arr.audioFileKey,
        youtubeUrl: arr.youtubeUrl,
        createdAt: new Date(arr._creationTime).toISOString(),
        updatedAt: new Date(arr._creationTime).toISOString(),
      });

      // Add parent song to map
      if (arr.song) {
        songsMap.set(arr.songId, {
          id: arr.song._id,
          slug: arr.song.slug,
          title: arr.song.title,
          artist: arr.song.artist ?? '',
          themes: [],
          createdAt: '',
          updatedAt: '',
        });
      }
    }

    // Build songs array from Convex songs field (with customKey support)
    // Falls back to legacy arrangementIds if songs field not present
    const convexSongs = normalizeSetlistSongs(convexData);

    const setlistSongs: SetlistSong[] = convexSongs.map(
      (songData: { arrangementId: string; customKey?: string }, index: number) => {
        const arrangement = arrangementsMap.get(songData.arrangementId);
        return {
          id: songData.arrangementId, // Stable ID for dnd-kit (index-based IDs break animations)
          songId: arrangement?.songId ?? '',
          arrangementId: songData.arrangementId,
          order: index,
          customKey: songData.customKey, // Pass through customKey from Convex
        };
      }
    );

    // Build setlist object
    const setlistObj: Setlist = {
      id: convexData._id,
      name: convexData.name,
      description: convexData.description,
      performanceDate: convexData.performanceDate,
      songs: setlistSongs,
      createdAt: new Date(convexData._creationTime).toISOString(),
      updatedAt: convexData.updatedAt
        ? new Date(convexData.updatedAt).toISOString()
        : new Date(convexData._creationTime).toISOString(),
      userId: convexData.userId,
      // Phase 6 fields
      privacyLevel: convexData.privacyLevel,
      tags: convexData.tags,
      estimatedDuration: convexData.estimatedDuration,
      difficulty: convexData.difficulty,
      duplicatedFrom: convexData.duplicatedFrom,
      duplicatedFromName: convexData.duplicatedFromName,
      showAttribution: convexData.showAttribution,
      favorites: convexData.favorites,
    };

    return { setlist: setlistObj, arrangements: arrangementsMap, songs: songsMap };
  }, [convexData]);

  /**
   * Update setlist data via Convex mutation
   */
  const updateSetlist = useCallback(async (updates: Partial<Setlist>): Promise<Setlist> => {
    if (!setlist || !setlistId) {
      throw new Error('No setlist loaded');
    }

    logger.debug('Updating setlist:', setlistId, updates);

    // Build update payload using new songs field (preserves customKey)
    await updateMutation({
      id: setlistId as Id<'setlists'>,
      name: updates.name,
      description: updates.description,
      performanceDate: updates.performanceDate,
      songs: updates.songs?.map((s) => ({
        arrangementId: s.arrangementId as Id<'arrangements'>,
        ...(s.customKey && { customKey: s.customKey }),
      })),
    });

    logger.info('Updated setlist:', setlist.name);

    // Return optimistic update (Convex will sync)
    return {
      ...setlist,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  }, [setlist, setlistId, updateMutation]);

  /**
   * Reload is a no-op for Convex (data updates automatically)
   */
  const reload = useCallback((): void => {
    logger.debug('Reload requested - Convex handles this automatically');
  }, []);

  // Determine error state
  // Note: Convex useQuery throws on server errors, which are caught by
  // ConvexProvider's error boundary. We only handle client-side error
  // states (auth required, not found) here.
  const error = !loading && !isAuthenticated && setlistId
    ? 'Sign in to view setlists'
    : !loading && isAuthenticated && !convexData && setlistId
      ? 'Setlist not found'
      : null;

  return {
    setlist,
    arrangements,
    songs,
    loading,
    error,
    updateSetlist,
    reload,
    isAuthenticated,
  };
}
