/**
 * React hook for resolving URL slug parameters to database IDs
 *
 * Provides automatic slug → ID resolution for song and arrangement routes.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SongRepository, ArrangementRepository } from '@/features/pwa/db/repository';
import logger from '@/lib/logger';

/**
 * Hook result interface
 */
interface UseSlugParamsResult {
  songId: string | null;
  arrangementId: string | null;
  isLoading: boolean;
}

/**
 * Hook to resolve song and arrangement slugs from URL params
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

  const [songId, setSongId] = useState<string | null>(null);
  const [arrangementId, setArrangementId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const resolveParams = async () => {
      try {
        setIsLoading(true);

        // Resolve song slug (if present)
        if (songSlug) {
          const songRepo = new SongRepository();
          const song = await songRepo.getBySlug(songSlug);
          if (song) {
            setSongId(song.id);
            logger.debug(`Resolved song slug: ${songSlug} → ${song.id}`);
          } else {
            logger.warn(`Song not found: ${songSlug}`);
            setSongId(null);
          }
        }

        // Resolve arrangement slug (if present)
        if (arrangementSlug) {
          const arrRepo = new ArrangementRepository();
          const arrangement = await arrRepo.getBySlug(arrangementSlug);
          if (arrangement) {
            setArrangementId(arrangement.id);
            logger.debug(`Resolved arrangement slug: ${arrangementSlug} → ${arrangement.id}`);
          } else {
            logger.warn(`Arrangement not found: ${arrangementSlug}`);
            setArrangementId(null);
          }
        }
      } catch (error) {
        logger.error('Error resolving slugs:', error);
        setSongId(null);
        setArrangementId(null);
      } finally {
        setIsLoading(false);
      }
    };

    resolveParams();
  }, [songSlug, arrangementSlug]);

  return { songId, arrangementId, isLoading };
}
