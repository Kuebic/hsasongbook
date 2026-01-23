import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';

/**
 * Return type for useSongPermissions hook
 */
export interface UseSongPermissionsReturn {
  /** Whether the current user can edit this song */
  canEdit: boolean;
  /** Whether the current user is the owner of this song */
  isOwner: boolean;
  /** Whether the current user originally created this song (important for reclaim) */
  isOriginalCreator: boolean;
  /** Whether permission data is still loading */
  loading: boolean;
}

/**
 * Hook to check if the current user can edit a song.
 * Returns permission state for the given song.
 *
 * @param songId - The song ID to check permissions for (can be null)
 * @returns Permission state { canEdit, isOwner, isOriginalCreator, loading }
 */
export function useSongPermissions(songId: string | null): UseSongPermissionsReturn {
  const permissions = useQuery(
    api.songs.canEdit,
    songId ? { songId: songId as Id<'songs'> } : 'skip'
  );

  return {
    canEdit: permissions?.canEdit ?? false,
    isOwner: permissions?.isOwner ?? false,
    isOriginalCreator: permissions?.isOriginalCreator ?? false,
    loading: permissions === undefined,
  };
}
