/**
 * useArrangementCoAuthors Hook
 * Phase 2: Groups - Fetches co-authors for an arrangement
 */

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';

export interface CoAuthorInfo {
  _id: string;
  userId: string;
  isPrimary: boolean;
  addedAt: number;
  user: {
    _id: string;
    username?: string;
    displayName?: string;
    showRealName?: boolean;
    avatarKey?: string;
  } | null;
}

export interface UseArrangementCoAuthorsReturn {
  coAuthors: CoAuthorInfo[];
  loading: boolean;
  primaryAuthor: CoAuthorInfo | null;
}

/**
 * Fetch co-authors for an arrangement
 *
 * @param arrangementId - The arrangement ID (can be null/undefined to skip query)
 * @returns Co-authors data, loading state, and primary author
 */
export function useArrangementCoAuthors(
  arrangementId: string | null | undefined
): UseArrangementCoAuthorsReturn {
  const coAuthors = useQuery(
    api.arrangements.getCoAuthors,
    arrangementId ? { arrangementId: arrangementId as Id<'arrangements'> } : 'skip'
  );

  const loading = arrangementId !== null && arrangementId !== undefined && coAuthors === undefined;

  const coAuthorList = (coAuthors ?? []) as CoAuthorInfo[];
  const primaryAuthor = coAuthorList.find((a) => a.isPrimary) ?? null;

  return {
    coAuthors: coAuthorList,
    loading,
    primaryAuthor,
  };
}

export default useArrangementCoAuthors;
