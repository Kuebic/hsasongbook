import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

/**
 * Hook to check if the current user is a Community group moderator (admin/owner).
 * Used to conditionally show version history UI.
 */
export function useIsCommunityGroupModerator() {
  const isModerator = useQuery(api.versions.isCurrentUserCommunityModerator);

  return {
    isModerator: isModerator ?? false,
    loading: isModerator === undefined,
  };
}

/**
 * Hook to check if the current user can access version history for specific content.
 * Returns true if user is Community group moderator OR original content creator.
 * Used to conditionally show version history UI.
 */
export function useCanAccessVersionHistory(
  contentType: 'song' | 'arrangement',
  contentId: string | null
) {
  const canAccess = useQuery(
    api.versions.canCurrentUserAccessVersionHistory,
    contentId ? { contentType, contentId } : 'skip'
  );

  return {
    canAccess: canAccess ?? false,
    loading: canAccess === undefined,
  };
}
