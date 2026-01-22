/**
 * useArrangementData Hook
 *
 * Provides access to arrangement and song data from Convex
 * with update capabilities.
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useParams } from 'react-router-dom';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import logger from '@/lib/logger';
import type { Arrangement } from '@/types/Arrangement.types';
import type { Song } from '@/types/Song.types';

/**
 * Result type for update operations
 */
interface UpdateResult {
  success: boolean;
  arrangement?: Arrangement;
  error?: Error;
  timestamp: Date;
  conflictDetected?: boolean;
}

/**
 * Return type for useArrangementData hook
 */
export interface UseArrangementDataReturn {
  // Data
  arrangement: Arrangement | null;
  song: Song | null;
  allArrangements: Arrangement[];

  // State
  loading: boolean;
  error: string | null;

  // Operations
  updateArrangement: (updatedData: Partial<Arrangement>) => Promise<UpdateResult>;
  reload: () => void;

  // Compatibility with dataHelpers interface
  getArrangementById: () => Arrangement | null;
  getSongById: () => Song | null;
  getArrangementsBySongId: () => Arrangement[];
}

/**
 * Map Convex arrangement to frontend type
 */
function mapConvexArrangement(arr: {
  _id: Id<'arrangements'>;
  _creationTime: number;
  slug: string;
  songId: Id<'songs'>;
  name: string;
  key?: string;
  tempo?: number;
  timeSignature?: string;
  capo?: number;
  tags: string[];
  rating: number;
  favorites: number;
  chordProContent: string;
  updatedAt?: number;
}): Arrangement {
  return {
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
    createdAt: new Date(arr._creationTime).toISOString(),
    updatedAt: arr.updatedAt
      ? new Date(arr.updatedAt).toISOString()
      : new Date(arr._creationTime).toISOString(),
  };
}

/**
 * Map Convex song to frontend type
 */
function mapConvexSong(song: {
  _id: Id<'songs'>;
  _creationTime: number;
  slug: string;
  title: string;
  artist?: string;
  themes: string[];
  copyright?: string;
  lyrics?: string;
}): Song {
  return {
    id: song._id,
    slug: song.slug,
    title: song.title,
    artist: song.artist ?? '',
    themes: song.themes,
    copyright: song.copyright,
    lyrics: song.lyrics ? { en: song.lyrics } : undefined,
    createdAt: new Date(song._creationTime).toISOString(),
    updatedAt: new Date(song._creationTime).toISOString(),
  };
}

/**
 * useArrangementData Hook
 * Provides access to arrangement and song data from Convex
 *
 * @param arrangementId - Arrangement ID to load (optional, will use URL slug if not provided)
 * @returns Arrangement data, loading state, and operations
 */
export function useArrangementData(arrangementId?: string | null): UseArrangementDataReturn {
  const { arrangementSlug } = useParams();

  // Get arrangement by slug (if no ID provided, use slug from URL)
  const arrangementBySlug = useQuery(
    api.arrangements.getBySlug,
    arrangementSlug && !arrangementId ? { slug: arrangementSlug } : 'skip'
  );

  // Get arrangement by ID (if ID provided)
  const arrangementById = useQuery(
    api.arrangements.get,
    arrangementId ? { id: arrangementId as Id<'arrangements'> } : 'skip'
  );

  // Use whichever arrangement we have
  const convexArrangement = arrangementId ? arrangementById : arrangementBySlug;

  // Get parent song
  const convexSong = useQuery(
    api.songs.get,
    convexArrangement?.songId ? { id: convexArrangement.songId } : 'skip'
  );

  // Get all arrangements for this song (siblings)
  const convexSiblings = useQuery(
    api.arrangements.getBySong,
    convexArrangement?.songId ? { songId: convexArrangement.songId } : 'skip'
  );

  // Convex mutation for updating arrangements
  const updateArrangementMutation = useMutation(api.arrangements.update);

  // Map to frontend types
  const arrangement: Arrangement | null = useMemo(() => {
    if (!convexArrangement) return null;
    return mapConvexArrangement(convexArrangement);
  }, [convexArrangement]);

  const song: Song | null = useMemo(() => {
    if (!convexSong) return null;
    return mapConvexSong(convexSong);
  }, [convexSong]);

  const allArrangements: Arrangement[] = useMemo(() => {
    if (!convexSiblings) return [];
    return convexSiblings.map(mapConvexArrangement);
  }, [convexSiblings]);

  // Determine loading state
  const isLoadingArrangement =
    (arrangementId !== undefined && arrangementById === undefined) ||
    (arrangementSlug !== undefined && !arrangementId && arrangementBySlug === undefined);
  const isLoadingSong = convexArrangement?.songId && convexSong === undefined;
  const isLoadingSiblings = convexArrangement?.songId && convexSiblings === undefined;
  const loading = isLoadingArrangement || isLoadingSong || isLoadingSiblings;

  // Error state
  const error = !loading && !convexArrangement ? 'Arrangement not found' : null;

  /**
   * Update arrangement via Convex mutation
   */
  const updateArrangement = useCallback(
    async (updatedData: Partial<Arrangement>): Promise<UpdateResult> => {
      if (!convexArrangement) {
        return {
          success: false,
          error: new Error('No arrangement loaded'),
          timestamp: new Date(),
        };
      }

      try {
        logger.debug('Updating arrangement via Convex:', convexArrangement._id);

        // Build update payload (only include defined values)
        const updatePayload: {
          id: Id<'arrangements'>;
          name?: string;
          key?: string;
          tempo?: number;
          capo?: number;
          timeSignature?: string;
          chordProContent?: string;
          tags?: string[];
        } = {
          id: convexArrangement._id,
        };

        if (updatedData.name !== undefined) updatePayload.name = updatedData.name;
        if (updatedData.key !== undefined) updatePayload.key = updatedData.key;
        if (updatedData.tempo !== undefined) updatePayload.tempo = updatedData.tempo;
        if (updatedData.capo !== undefined) updatePayload.capo = updatedData.capo;
        if (updatedData.timeSignature !== undefined)
          updatePayload.timeSignature = updatedData.timeSignature;
        if (updatedData.chordProContent !== undefined)
          updatePayload.chordProContent = updatedData.chordProContent;
        if (updatedData.tags !== undefined) updatePayload.tags = updatedData.tags;

        await updateArrangementMutation(updatePayload);

        logger.debug('Arrangement updated successfully via Convex');

        // Return the updated arrangement (optimistic - Convex will sync)
        const updatedArrangement: Arrangement = {
          ...arrangement!,
          ...updatedData,
          updatedAt: new Date().toISOString(),
        };

        return {
          success: true,
          arrangement: updatedArrangement,
          timestamp: new Date(),
        };
      } catch (err) {
        logger.error('Failed to update arrangement:', err);
        return {
          success: false,
          error: err as Error,
          timestamp: new Date(),
        };
      }
    },
    [convexArrangement, arrangement, updateArrangementMutation]
  );

  /**
   * Reload is a no-op for Convex (data updates automatically)
   */
  const reload = useCallback(() => {
    // Convex queries auto-refresh when data changes
    logger.debug('Reload requested - Convex handles this automatically');
  }, []);

  return {
    // Data
    arrangement,
    song,
    allArrangements,

    // State
    loading,
    error,

    // Operations
    updateArrangement,
    reload,

    // Compatibility with dataHelpers interface
    getArrangementById: useCallback(() => arrangement, [arrangement]),
    getSongById: useCallback(() => song, [song]),
    getArrangementsBySongId: useCallback(() => allArrangements, [allArrangements]),
  };
}

/**
 * Default export for convenient importing
 */
export default useArrangementData;
