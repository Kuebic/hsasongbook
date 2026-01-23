import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';

/**
 * Hook to check if the current user can edit a song.
 * Returns permission state for the given song.
 */
export function useSongPermissions(songId: string | null) {
  const permissions = useQuery(
    api.songs.canEdit,
    songId ? { songId: songId as Id<'songs'> } : 'skip'
  );

  return {
    canEdit: permissions?.canEdit ?? false,
    isOwner: permissions?.isOwner ?? false,
    loading: permissions === undefined,
  };
}
