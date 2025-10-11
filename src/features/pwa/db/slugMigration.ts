/**
 * Data migration script to populate slugs for existing songs and arrangements
 *
 * This script runs on app initialization to add URL-friendly slugs to all
 * existing database records. It's idempotent - safe to run multiple times.
 */

import { SongRepository, ArrangementRepository } from './repository';
import { generateSlug } from '@/features/shared/utils/slugGenerator';
import logger from '@/lib/logger';

/**
 * Run the complete slug migration
 *
 * Migrates all songs and arrangements to have slugs.
 * Idempotent: skips records that already have slugs.
 *
 * @returns Migration result with counts
 */
export async function runSlugMigration(): Promise<{
  success: boolean;
  songsMigrated: number;
  arrangementsMigrated: number;
}> {
  try {
    logger.info('Starting slug migration...');

    const songRepo = new SongRepository();
    const arrRepo = new ArrangementRepository();

    // Get all songs and arrangements
    const [songs, arrangements] = await Promise.all([
      songRepo.getAll(),
      arrRepo.getAll(),
    ]);

    let songsMigrated = 0;
    let arrangementsMigrated = 0;

    // Migrate songs (skip if already has slug)
    for (const song of songs) {
      if (!song.slug) {
        song.slug = generateSlug(song.title, 'song');
        await songRepo.save(song);
        songsMigrated++;
        logger.debug(`Migrated song: "${song.title}" → ${song.slug}`);
      }
    }

    // Migrate arrangements (skip if already has slug)
    for (const arrangement of arrangements) {
      if (!arrangement.slug) {
        arrangement.slug = generateSlug(arrangement.name, 'arrangement');
        await arrRepo.save(arrangement);
        arrangementsMigrated++;
        logger.debug(`Migrated arrangement: "${arrangement.name}" → ${arrangement.slug}`);
      }
    }

    logger.info(`Slug migration complete: ${songsMigrated} songs, ${arrangementsMigrated} arrangements`);

    return {
      success: true,
      songsMigrated,
      arrangementsMigrated,
    };
  } catch (error) {
    logger.error('Slug migration failed:', error);
    return {
      success: false,
      songsMigrated: 0,
      arrangementsMigrated: 0,
    };
  }
}
