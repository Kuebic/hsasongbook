/**
 * useArrangementPermissions Hook
 * Phase 1: Collaborators - Permission checking for arrangements
 *
 * Provides permission state for the current user on a specific arrangement.
 */

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';

/**
 * Return type for useArrangementPermissions hook
 */
export interface UseArrangementPermissionsReturn {
  /** Whether the current user can edit this arrangement */
  canEdit: boolean;
  /** Whether the current user is the owner of this arrangement */
  isOwner: boolean;
  /** Whether the current user is a collaborator on this arrangement */
  isCollaborator: boolean;
  /** Whether permission data is still loading */
  loading: boolean;
}

/**
 * useArrangementPermissions Hook
 * Check if the current user has permission to edit an arrangement
 *
 * @param arrangementId - The arrangement ID to check permissions for (can be null)
 * @returns Permission state { canEdit, isOwner, isCollaborator, loading }
 *
 * @example
 * ```tsx
 * const { canEdit, isOwner, loading } = useArrangementPermissions(arrangement?.id);
 *
 * if (loading) return <Spinner />;
 *
 * return (
 *   <ChordProViewer editable={canEdit} />
 * );
 * ```
 */
export function useArrangementPermissions(
  arrangementId: string | null | undefined
): UseArrangementPermissionsReturn {
  // Query permissions from Convex
  const permissions = useQuery(
    api.arrangements.canEdit,
    arrangementId ? { arrangementId: arrangementId as Id<'arrangements'> } : 'skip'
  );

  // Still loading if arrangementId is provided but no response yet
  const loading = arrangementId !== null && arrangementId !== undefined && permissions === undefined;

  // Extract permission values (default to false if not loaded)
  const canEdit = permissions?.canEdit ?? false;
  const isOwner = permissions?.isOwner ?? false;
  const isCollaborator = permissions?.isCollaborator ?? false;

  return {
    canEdit,
    isOwner,
    isCollaborator,
    loading,
  };
}

export default useArrangementPermissions;
