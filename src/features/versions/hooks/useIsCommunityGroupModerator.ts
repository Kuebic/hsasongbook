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
