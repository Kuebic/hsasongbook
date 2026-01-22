/**
 * React hook for resolving URL slug parameters using Convex
 *
 * Provides automatic slug → document resolution for song and arrangement routes.
 */

import { useParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';

/**
 * Hook result interface
 */
interface UseSlugParamsResult {
  songId: Id<'songs'> | null;
  arrangementId: Id<'arrangements'> | null;
  isLoading: boolean;
}

/**
 * Hook to resolve song and arrangement slugs from URL params using Convex
 * Works for both /song/:songSlug and /song/:songSlug/:arrangementSlug routes
 *
 * @returns Resolved song ID, arrangement ID, and loading state
 *
 * @example
 * ```typescript
 * function SongPage() {
 *   const { songId, isLoading } = useSlugParams();
 *
 *   if (isLoading) return <Loading />;
 *   if (!songId) return <NotFound />;
 *
 *   return <SongDetails songId={songId} />;
 * }
 *
 * function ArrangementPage() {
 *   const { songId, arrangementId, isLoading } = useSlugParams();
 *
 *   if (isLoading) return <Loading />;
 *   if (!songId || !arrangementId) return <NotFound />;
 *
 *   return <ArrangementView songId={songId} arrangementId={arrangementId} />;
 * }
 * ```
 */
export function useSlugParams(): UseSlugParamsResult {
  const params = useParams();
  const songSlug = params.songSlug;
  const arrangementSlug = params.arrangementSlug;

  // Query Convex for song by slug (skip if no slug)
  const song = useQuery(
    api.songs.getBySlug,
    songSlug ? { slug: songSlug } : 'skip'
  );

  // Query Convex for arrangement by slug (skip if no slug)
  const arrangement = useQuery(
    api.arrangements.getBySlug,
    arrangementSlug ? { slug: arrangementSlug } : 'skip'
  );

  // Determine loading state:
  // - If songSlug exists, we're loading until song query returns (not undefined)
  // - If arrangementSlug exists, we're also loading until arrangement query returns
  const songLoading = songSlug !== undefined && song === undefined;
  const arrangementLoading = arrangementSlug !== undefined && arrangement === undefined;
  const isLoading = songLoading || arrangementLoading;

  return {
    songId: song?._id ?? null,
    arrangementId: arrangement?._id ?? null,
    isLoading,
  };
}
