import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

/**
 * Hook to check if the current user is a Public group moderator (admin/owner).
 * Used to conditionally show version history UI.
 */
export function useIsPublicGroupModerator() {
  const isModerator = useQuery(api.versions.isCurrentUserPublicModerator);

  return {
    isModerator: isModerator ?? false,
    loading: isModerator === undefined,
  };
}
