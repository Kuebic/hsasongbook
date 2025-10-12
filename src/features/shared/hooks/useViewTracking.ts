/**
 * useViewTracking hook
 *
 * Tracks page views by updating lastAccessedAt field in IndexedDB.
 * Fire-and-forget operation (non-blocking, silent failure).
 *
 * Usage:
 *   useViewTracking('song', songId);
 *   useViewTracking('arrangement', arrangementId);
 */

import { useEffect } from 'react';
import { SongRepository, ArrangementRepository } from '@/features/pwa/db/repository';
import logger from '@/lib/logger';

type EntityType = 'song' | 'arrangement';

/**
 * Track page views by updating lastAccessedAt field
 *
 * @param entityType - Type of entity ('song' or 'arrangement')
 * @param entityId - ID of the entity to track
 *
 * This hook runs asynchronously without blocking the UI.
 * Failures are logged but don't disrupt the user experience.
 */
export function useViewTracking(
  entityType: EntityType,
  entityId: string | undefined
): void {
  useEffect(() => {
    if (!entityId) return;

    const updateLastAccessed = async (): Promise<void> => {
      try {
        const repo = entityType === 'song'
          ? new SongRepository()
          : new ArrangementRepository();

        const entity = await repo.getById(entityId);
        if (entity) {
          await repo.save({
            ...entity,
            lastAccessedAt: Date.now()
          });
          logger.debug(`View tracked: ${entityType} ${entityId}`);
        }
      } catch (error) {
        logger.warn('Failed to track view:', error);
        // Silent failure - don't disrupt user experience
      }
    };

    // Fire-and-forget (no await)
    updateLastAccessed();
  }, [entityType, entityId]);
}
