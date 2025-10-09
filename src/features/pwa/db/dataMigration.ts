// Data migration utility to import mock data into IndexedDB
// This will import the existing songs.json and arrangements.json data

import { IDBPDatabase } from 'idb';
import { HSASongbookDB } from '@/types/Database.types';
import { Song } from '@/types/Song.types';
import { Arrangement } from '@/types/Arrangement.types';
import { getDatabase } from './database.js';
import { SongRepository, ArrangementRepository } from './repository.js';
import logger from '@/lib/logger';

// Import mock data
import songsData from '../../shared/data/songs.json';
import arrangementsData from '../../shared/data/arrangements.json';

/**
 * Import error information
 */
export interface ImportError {
  id: string;
  error: string;
}

/**
 * Import result for a specific data type
 */
export interface ImportResult {
  total: number;
  imported: number;
  errors: ImportError[];
}

/**
 * Overall migration results
 */
export interface MigrationResults {
  songs: ImportResult;
  arrangements: ImportResult;
  startTime: number;
  endTime: number | null;
  duration?: number;
  error?: string;
}

/**
 * Skipped migration result
 */
export interface SkippedMigrationResult {
  skipped: true;
  message: string;
  timestamp: string;
}

/**
 * Migration status information
 */
export interface MigrationStatus {
  imported: {
    songs: number;
    arrangements: number;
  };
  expected: {
    songs: number;
    arrangements: number;
  };
  complete: boolean;
  missingData: {
    songs: number;
    arrangements: number;
  };
  timestamp: string;
  error?: string;
}

/**
 * Validation results for a data type
 */
export interface ValidationResult {
  valid: number;
  invalid: number;
  errors: string[];
}

/**
 * Overall validation results
 */
export interface ValidationResults {
  songs: ValidationResult;
  arrangements: ValidationResult;
  relationships: ValidationResult;
  error?: string;
}

/**
 * Mock song data structure (from JSON)
 */
interface MockSongData {
  id: string;
  title: string;
  artist: string;
  themes?: string[];
  copyright?: string;
  lyrics?: Record<string, unknown>;
}

/**
 * Mock arrangement data structure (from JSON)
 */
interface MockArrangementData {
  id: string;
  songId: string;
  name: string;
  key: string;
  tempo?: number;
  timeSignature?: string;
  capo?: number;
  tags?: string[];
  rating?: number;
  favorites?: number;
  chordProContent: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * DataMigration class for importing mock data into IndexedDB
 */
export class DataMigration {
  private songRepo: SongRepository;
  private arrangementRepo: ArrangementRepository;

  constructor() {
    this.songRepo = new SongRepository();
    this.arrangementRepo = new ArrangementRepository();
  }

  /**
   * Import all mock data into IndexedDB
   */
  async importMockData(): Promise<MigrationResults> {
    logger.log('Starting mock data migration to IndexedDB...');

    const results: MigrationResults = {
      songs: { total: 0, imported: 0, errors: [] },
      arrangements: { total: 0, imported: 0, errors: [] },
      startTime: Date.now(),
      endTime: null
    };

    try {
      // Ensure database is initialized
      await getDatabase();

      // Import songs first
      results.songs = await this.importSongs(songsData as MockSongData[]);

      // Import arrangements
      results.arrangements = await this.importArrangements(arrangementsData as MockArrangementData[]);

      results.endTime = Date.now();
      results.duration = results.endTime - results.startTime;

      logger.log('Mock data migration completed:', results);
      return results;
    } catch (error) {
      console.error('Error during mock data migration:', error);
      results.error = error instanceof Error ? error.message : 'Unknown error';
      results.endTime = Date.now();
      return results;
    }
  }

  /**
   * Import songs data
   */
  async importSongs(songs: MockSongData[]): Promise<ImportResult> {
    logger.log(`Importing ${songs.length} songs...`);

    const results: ImportResult = {
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
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.log(`Imported ${results.imported}/${results.total} songs`);
    return results;
  }

  /**
   * Import arrangements data
   */
  async importArrangements(arrangements: MockArrangementData[]): Promise<ImportResult> {
    logger.log(`Importing ${arrangements.length} arrangements...`);

    const results: ImportResult = {
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
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.log(`Imported ${results.imported}/${results.total} arrangements`);
    return results;
  }

  /**
   * Transform song data to match IndexedDB schema
   */
  transformSongData(songData: MockSongData): Partial<Song> {
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
   */
  transformArrangementData(arrangementData: MockArrangementData): Partial<Arrangement> {
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
   */
  async isMockDataImported(): Promise<boolean> {
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
   */
  async clearExistingData(): Promise<void> {
    logger.log('Clearing existing data...');

    try {
      const db: IDBPDatabase<HSASongbookDB> = await getDatabase();
      const stores: Array<keyof HSASongbookDB> = ['songs', 'arrangements', 'setlists', 'syncQueue'];

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
   */
  async forceImportMockData(): Promise<MigrationResults> {
    logger.log('Force importing mock data (clearing existing data first)...');

    await this.clearExistingData();
    return await this.importMockData();
  }

  /**
   * Import mock data only if not already imported
   */
  async importMockDataIfNeeded(): Promise<MigrationResults | SkippedMigrationResult> {
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
   */
  async getMigrationStatus(): Promise<MigrationStatus> {
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
        imported: { songs: 0, arrangements: 0 },
        expected: { songs: 0, arrangements: 0 },
        complete: false,
        missingData: { songs: 0, arrangements: 0 },
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate imported data integrity
   */
  async validateImportedData(): Promise<ValidationResults> {
    logger.log('Validating imported data integrity...');

    const validation: ValidationResults = {
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
      validation.error = error instanceof Error ? error.message : 'Unknown error';
      return validation;
    }
  }

  /**
   * Validate individual song data
   */
  validateSong(song: Song): boolean {
    const requiredFields: Array<keyof Song> = ['id', 'title', 'artist', 'createdAt', 'updatedAt', 'syncStatus'];
    return requiredFields.every(field => song[field] !== undefined && song[field] !== null);
  }

  /**
   * Validate individual arrangement data
   */
  validateArrangement(arrangement: Arrangement): boolean {
    const requiredFields: Array<keyof Arrangement> = ['id', 'songId', 'name', 'key', 'createdAt', 'updatedAt', 'syncStatus'];
    return requiredFields.every(field => arrangement[field] !== undefined && arrangement[field] !== null);
  }
}

// Export convenience functions
export async function importMockData(): Promise<MigrationResults> {
  const migration = new DataMigration();
  return await migration.importMockData();
}

export async function importMockDataIfNeeded(): Promise<MigrationResults | SkippedMigrationResult> {
  const migration = new DataMigration();
  return await migration.importMockDataIfNeeded();
}

export async function getMigrationStatus(): Promise<MigrationStatus> {
  const migration = new DataMigration();
  return await migration.getMigrationStatus();
}

export async function validateImportedData(): Promise<ValidationResults> {
  const migration = new DataMigration();
  return await migration.validateImportedData();
}
