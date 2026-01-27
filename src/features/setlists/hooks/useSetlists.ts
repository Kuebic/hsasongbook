/**
 * useSetlists hook
 *
 * Manages all setlists with CRUD operations using Convex.
 * Pattern: src/features/arrangements/hooks/useArrangementData.ts
 */

import { useMemo, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Setlist, SetlistSong } from '@/types';
import type { SetlistFormData } from '../types';
import logger from '@/lib/logger';

export interface UseSetlistsReturn {
  setlists: Setlist[];
  loading: boolean;
  error: string | null;
  createSetlist: (data: SetlistFormData) => Promise<Setlist>;
  deleteSetlist: (id: string) => Promise<void>;
  reload: () => void;
  isAuthenticated: boolean;
}

/**
 * Map Convex setlist to frontend Setlist type
 */
function mapConvexSetlist(convexSetlist: {
  _id: Id<'setlists'>;
  _creationTime: number;
  name: string;
  description?: string;
  performanceDate?: string;
  arrangementIds?: Id<'arrangements'>[];
  songs?: Array<{
    arrangementId: Id<'arrangements'>;
    customKey?: string;
  }>;
  userId: Id<'users'>;
  updatedAt?: number;
}): Setlist {
  // Get songs data (prefer new format, fallback to legacy arrangementIds)
  const songsData = convexSetlist.songs ??
    convexSetlist.arrangementIds?.map((id) => ({ arrangementId: id })) ??
    [];

  // Map to SetlistSong array
  const songs: SetlistSong[] = songsData.map((songEntry, index) => ({
    id: songEntry.arrangementId, // Stable ID for dnd-kit (index-based IDs break animations)
    songId: '', // Populated when loading full setlist data
    arrangementId: songEntry.arrangementId,
    order: index,
  }));

  return {
    id: convexSetlist._id,
    name: convexSetlist.name,
    description: convexSetlist.description,
    performanceDate: convexSetlist.performanceDate,
    songs,
    createdAt: new Date(convexSetlist._creationTime).toISOString(),
    updatedAt: convexSetlist.updatedAt
      ? new Date(convexSetlist.updatedAt).toISOString()
      : new Date(convexSetlist._creationTime).toISOString(),
    userId: convexSetlist.userId,
  };
}

/**
 * Hook for managing all setlists
 *
 * @returns Setlists data and CRUD operations
 */
export function useSetlists(): UseSetlistsReturn {
  const { user } = useAuth();
  const isAuthenticated = !!(user && !user.isAnonymous);

  // Skip query for anonymous users (setlists are private)
  const convexSetlists = useQuery(
    api.setlists.list,
    isAuthenticated ? {} : 'skip'
  );

  const createMutation = useMutation(api.setlists.create);
  const deleteMutation = useMutation(api.setlists.remove);

  // Loading state: authenticated but query hasn't resolved yet
  const loading = isAuthenticated && convexSetlists === undefined;

  // Map Convex setlists to frontend type
  const setlists: Setlist[] = useMemo(() => {
    if (!convexSetlists) return [];
    return convexSetlists.map(mapConvexSetlist);
  }, [convexSetlists]);

  /**
   * Create a new setlist
   */
  const createSetlist = useCallback(async (data: SetlistFormData): Promise<Setlist> => {
    if (!isAuthenticated) {
      throw new Error('Must be signed in to create setlists');
    }

    logger.debug('Creating setlist:', data.name);

    const setlistId = await createMutation({
      name: data.name,
      description: data.description || undefined,
      performanceDate: data.performanceDate || undefined,
      arrangementIds: [],
    });

    logger.info('Created setlist:', data.name);

    // Return optimistic setlist object
    const now = new Date().toISOString();
    return {
      id: setlistId,
      name: data.name,
      description: data.description,
      performanceDate: data.performanceDate,
      songs: [],
      createdAt: now,
      updatedAt: now,
    };
  }, [createMutation, isAuthenticated]);

  /**
   * Delete a setlist by ID
   */
  const deleteSetlist = useCallback(async (id: string): Promise<void> => {
    if (!isAuthenticated) {
      throw new Error('Must be signed in to delete setlists');
    }

    logger.debug('Deleting setlist:', id);
    await deleteMutation({ id: id as Id<'setlists'> });
    logger.info('Deleted setlist:', id);
  }, [deleteMutation, isAuthenticated]);

  /**
   * Reload is a no-op for Convex (data updates automatically)
   */
  const reload = useCallback((): void => {
    logger.debug('Reload requested - Convex handles this automatically');
  }, []);

  return {
    setlists,
    loading,
    error: null, // Convex handles errors via ConvexProvider
    createSetlist,
    deleteSetlist,
    reload,
    isAuthenticated,
  };
}
