import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useState } from 'react';

type ContentType = 'song' | 'arrangement';

/**
 * Hook for managing version history for songs and arrangements.
 * Only returns data for Public group moderators viewing Public-owned content.
 */
export function useVersionHistory(
  contentType: ContentType,
  contentId: string | null
) {
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [rollbackError, setRollbackError] = useState<string | null>(null);

  const versions = useQuery(
    api.versions.getHistory,
    contentId ? { contentType, contentId } : 'skip'
  );

  const rollbackMutation = useMutation(api.versions.rollback);

  const rollback = async (version: number) => {
    if (!contentId) return;

    setIsRollingBack(true);
    setRollbackError(null);

    try {
      await rollbackMutation({
        contentType,
        contentId,
        version,
      });
    } catch (error) {
      setRollbackError(
        error instanceof Error ? error.message : 'Failed to rollback'
      );
      throw error;
    } finally {
      setIsRollingBack(false);
    }
  };

  return {
    versions: versions ?? [],
    loading: versions === undefined,
    rollback,
    isRollingBack,
    rollbackError,
    clearRollbackError: () => setRollbackError(null),
  };
}
