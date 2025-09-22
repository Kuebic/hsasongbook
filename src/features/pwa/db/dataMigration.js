// Data migration utility to import mock data into IndexedDB
// This will import the existing songs.json and arrangements.json data

import { getDatabase } from './database.js';
import { SongRepository, ArrangementRepository } from './repository.js';
import logger from '@/lib/logger';

// Import mock data
import songsData from '../../shared/data/songs.json';
import arrangementsData from '../../shared/data/arrangements.json';

/**
 * DataMigration class for importing mock data into IndexedDB
 */
export class DataMigration {
  constructor() {
    this.songRepo = new SongRepository();
    this.arrangementRepo = new ArrangementRepository();
  }

  /**
   * Import all mock data into IndexedDB
   * @returns {Promise<Object>} Migration results
   */
  async importMockData() {
    logger.log('Starting mock data migration to IndexedDB...');

    const results = {
      songs: { total: 0, imported: 0, errors: [] },
      arrangements: { total: 0, imported: 0, errors: [] },
      startTime: Date.now(),
      endTime: null
    };

    try {
      // Ensure database is initialized
      await getDatabase();

      // Import songs first
      results.songs = await this.importSongs(songsData);

      // Import arrangements
      results.arrangements = await this.importArrangements(arrangementsData);

      results.endTime = Date.now();
      results.duration = results.endTime - results.startTime;

      logger.log('Mock data migration completed:', results);
      return results;
    } catch (error) {
      console.error('Error during mock data migration:', error);
      results.error = error.message;
      results.endTime = Date.now();
      return results;
    }
  }

  /**
   * Import songs data
   * @param {Array} songs - Songs data array
   * @returns {Promise<Object>} Import results
   */
  async importSongs(songs) {
    logger.log(`Importing ${songs.length} songs...`);

    const results = {
      total: songs.length,
      imported: 0,
      errors: []
    };

    for (const songData of songs) {
      try {
        const transformedSong = this.transformSongData(songData);
        await this.songRepo.save(transformedSong);
        results.imported++;
      } catch (error) {
        console.error(`Error importing song ${songData.id}:`, error);
        results.errors.push({
          id: songData.id,
          error: error.message
        });
      }
    }

    logger.log(`Imported ${results.imported}/${results.total} songs`);
    return results;
  }

  /**
   * Import arrangements data
   * @param {Array} arrangements - Arrangements data array
   * @returns {Promise<Object>} Import results
   */
  async importArrangements(arrangements) {
    logger.log(`Importing ${arrangements.length} arrangements...`);

    const results = {
      total: arrangements.length,
      imported: 0,
      errors: []
    };

    for (const arrangementData of arrangements) {
      try {
        const transformedArrangement = this.transformArrangementData(arrangementData);
        await this.arrangementRepo.save(transformedArrangement);
        results.imported++;
      } catch (error) {
        console.error(`Error importing arrangement ${arrangementData.id}:`, error);
        results.errors.push({
          id: arrangementData.id,
          error: error.message
        });
      }
    }

    logger.log(`Imported ${results.imported}/${results.total} arrangements`);
    return results;
  }

  /**
   * Transform song data to match IndexedDB schema
   * @param {Object} songData - Original song data
   * @returns {Object} Transformed song data
   */
  transformSongData(songData) {
    return {
      id: songData.id,
      title: songData.title,
      artist: songData.artist,
      themes: songData.themes || [],
      copyright: songData.copyright,
      lyrics: songData.lyrics || {},
      // Add metadata for IndexedDB schema
      metadata: {
        createdBy: 'system',
        lastModifiedBy: 'system',
        isPublic: true,
        ratings: { average: 0, count: 0 },
        views: 0,
        popularity: Math.floor(Math.random() * 100) // Random popularity for demo
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
      version: 1
    };
  }

  /**
   * Transform arrangement data to match IndexedDB schema
   * @param {Object} arrangementData - Original arrangement data
   * @returns {Object} Transformed arrangement data
   */
  transformArrangementData(arrangementData) {
    return {
      id: arrangementData.id,
      songId: arrangementData.songId,
      name: arrangementData.name,
      key: arrangementData.key,
      tempo: arrangementData.tempo,
      timeSignature: arrangementData.timeSignature,
      capo: arrangementData.capo || 0,
      tags: arrangementData.tags || [],
      rating: arrangementData.rating,
      favorites: arrangementData.favorites || 0,
      chordProContent: arrangementData.chordProContent,
      // Add metadata for IndexedDB schema
      metadata: {
        isMashup: false,
        isPublic: true,
        ratings: {
          average: arrangementData.rating || 0,
          count: arrangementData.rating ? 1 : 0
        },
        views: 0,
        popularity: arrangementData.favorites || 0
      },
      createdAt: arrangementData.createdAt || new Date().toISOString(),
      updatedAt: arrangementData.updatedAt || new Date().toISOString(),
      syncStatus: 'synced',
      version: 1,
      // Use favorites as popularity for backward compatibility
      popularity: arrangementData.favorites || 0
    };
  }

  /**
   * Check if mock data has already been imported
   * @returns {Promise<boolean>} True if data exists
   */
  async isMockDataImported() {
    try {
      const songs = await this.songRepo.getAll();
      const arrangements = await this.arrangementRepo.getAll();

      // Check if we have data and if it matches the expected mock data count
      const expectedSongs = songsData.length;
      const expectedArrangements = arrangementsData.length;

      return songs.length >= expectedSongs && arrangements.length >= expectedArrangements;
    } catch (error) {
      console.error('Error checking if mock data is imported:', error);
      return false;
    }
  }

  /**
   * Clear all existing data before importing
   * @returns {Promise<void>}
   */
  async clearExistingData() {
    logger.log('Clearing existing data...');

    try {
      const db = await getDatabase();
      const stores = ['songs', 'arrangements', 'setlists', 'syncQueue'];

      const tx = db.transaction(stores, 'readwrite');

      await Promise.all(stores.map(storeName => {
        if (db.objectStoreNames.contains(storeName)) {
          return tx.objectStore(storeName).clear();
        }
        return Promise.resolve();
      }));

      await tx.done;
      logger.log('Existing data cleared successfully');
    } catch (error) {
      console.error('Error clearing existing data:', error);
      throw error;
    }
  }

  /**
   * Force reimport of mock data (clears existing data first)
   * @returns {Promise<Object>} Migration results
   */
  async forceImportMockData() {
    logger.log('Force importing mock data (clearing existing data first)...');

    await this.clearExistingData();
    return await this.importMockData();
  }

  /**
   * Import mock data only if not already imported
   * @returns {Promise<Object>} Import results
   */
  async importMockDataIfNeeded() {
    const alreadyImported = await this.isMockDataImported();

    if (alreadyImported) {
      logger.log('Mock data already imported, skipping...');
      return {
        skipped: true,
        message: 'Mock data already exists',
        timestamp: new Date().toISOString()
      };
    }

    return await this.importMockData();
  }

  /**
   * Get migration status and statistics
   * @returns {Promise<Object>} Migration status
   */
  async getMigrationStatus() {
    try {
      const songs = await this.songRepo.getAll();
      const arrangements = await this.arrangementRepo.getAll();

      const expectedSongs = songsData.length;
      const expectedArrangements = arrangementsData.length;

      return {
        imported: {
          songs: songs.length,
          arrangements: arrangements.length
        },
        expected: {
          songs: expectedSongs,
          arrangements: expectedArrangements
        },
        complete: songs.length >= expectedSongs && arrangements.length >= expectedArrangements,
        missingData: {
          songs: Math.max(0, expectedSongs - songs.length),
          arrangements: Math.max(0, expectedArrangements - arrangements.length)
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate imported data integrity
   * @returns {Promise<Object>} Validation results
   */
  async validateImportedData() {
    logger.log('Validating imported data integrity...');

    const validation = {
      songs: { valid: 0, invalid: 0, errors: [] },
      arrangements: { valid: 0, invalid: 0, errors: [] },
      relationships: { valid: 0, invalid: 0, errors: [] }
    };

    try {
      // Validate songs
      const songs = await this.songRepo.getAll();
      for (const song of songs) {
        if (this.validateSong(song)) {
          validation.songs.valid++;
        } else {
          validation.songs.invalid++;
          validation.songs.errors.push(`Invalid song: ${song.id}`);
        }
      }

      // Validate arrangements
      const arrangements = await this.arrangementRepo.getAll();
      for (const arrangement of arrangements) {
        if (this.validateArrangement(arrangement)) {
          validation.arrangements.valid++;
        } else {
          validation.arrangements.invalid++;
          validation.arrangements.errors.push(`Invalid arrangement: ${arrangement.id}`);
        }
      }

      // Validate song-arrangement relationships
      for (const arrangement of arrangements) {
        const song = songs.find(s => s.id === arrangement.songId);
        if (song) {
          validation.relationships.valid++;
        } else {
          validation.relationships.invalid++;
          validation.relationships.errors.push(
            `Arrangement ${arrangement.id} references missing song ${arrangement.songId}`
          );
        }
      }

      logger.log('Data validation completed:', validation);
      return validation;
    } catch (error) {
      console.error('Error during data validation:', error);
      validation.error = error.message;
      return validation;
    }
  }

  /**
   * Validate individual song data
   * @param {Object} song - Song object
   * @returns {boolean} True if valid
   */
  validateSong(song) {
    const requiredFields = ['id', 'title', 'artist', 'createdAt', 'updatedAt', 'syncStatus'];
    return requiredFields.every(field => song[field] !== undefined && song[field] !== null);
  }

  /**
   * Validate individual arrangement data
   * @param {Object} arrangement - Arrangement object
   * @returns {boolean} True if valid
   */
  validateArrangement(arrangement) {
    const requiredFields = ['id', 'songId', 'name', 'key', 'createdAt', 'updatedAt', 'syncStatus'];
    return requiredFields.every(field => arrangement[field] !== undefined && arrangement[field] !== null);
  }
}

// Export convenience functions
export async function importMockData() {
  const migration = new DataMigration();
  return await migration.importMockData();
}

export async function importMockDataIfNeeded() {
  const migration = new DataMigration();
  return await migration.importMockDataIfNeeded();
}

export async function getMigrationStatus() {
  const migration = new DataMigration();
  return await migration.getMigrationStatus();
}

export async function validateImportedData() {
  const migration = new DataMigration();
  return await migration.validateImportedData();
}