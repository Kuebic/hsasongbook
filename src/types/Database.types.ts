/**
 * IndexedDB schema using idb DBSchema pattern
 *
 * This defines the complete database structure for the HSA Songbook PWA.
 * Uses the idb library's DBSchema interface for full type safety.
 */

import { DBSchema } from 'idb';
import type { Song } from './Song.types';
import type { Arrangement } from './Arrangement.types';

/**
 * Main database schema for HSA Songbook
 * Extends idb's DBSchema for type-safe IndexedDB operations
 */
export interface HSASongbookDB extends DBSchema {
  songs: {
    key: string; // Primary key (id field)
    value: Song; // Full Song object
    indexes: {
      'by-title': string; // Index on title field
      'by-artist': string; // Index on artist field
    };
  };

  arrangements: {
    key: string; // Primary key (id field)
    value: Arrangement; // Full Arrangement object
    indexes: {
      'by-song-id': string; // Foreign key to songs (songId field)
      'by-key': string; // Musical key index
      'by-rating': number; // Rating index for sorting
      'by-favorites': number; // Popularity index for sorting
      'by-created-at': string; // Creation date index
      'by-last-accessed': number; // For cleanup operations
    };
  };

  chordproDrafts: {
    key: string; // Primary key (id field)
    value: Draft; // Draft object
    indexes: {
      'arrangementId': string; // Link to arrangement
      'by-saved-at': string; // When draft was saved
    };
  };

  // Future: Setlists (Phase 4)
  setlists: {
    key: string;
    value: Setlist;
    indexes: {
      'by-name': string;
      'by-performance-date': string;
    };
  };

  // Future: Sync queue (Phase 5)
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      'by-type': string;
      'by-timestamp': string;
    };
  };

  // User preferences (Phase 5)
  preferences: {
    key: string; // userId
    value: UserPreferences; // User-specific preferences
    indexes: {
      'by-user-id': string;
    };
  };
}

/**
 * Draft model for auto-save functionality
 */
export interface Draft {
  id: string;
  arrangementId: string;
  content: string; // ChordPro content
  metadata?: Record<string, unknown>;
  savedAt: string;
  expiresAt: string;
  isAutoSave: boolean;
  version: number;
  syncStatus: 'draft' | 'pending' | 'synced' | 'conflict';
  lastAccessedAt: number;
}

/**
 * Setlist model (Phase 4)
 */
export interface Setlist {
  id: string;
  name: string;
  description?: string;
  performanceDate?: string;
  songs: SetlistSong[];
  createdAt: string;
  updatedAt: string;
  // Phase 5 fields (Authentication)
  userId?: string;                     // Owner user ID (optional for backward compatibility)
  // Phase 5 fields (Sync support)
  syncStatus?: 'pending' | 'synced' | 'conflict';
  version?: number;
  // Phase 6 fields (Sharing & Privacy)
  privacyLevel?: 'private' | 'unlisted' | 'public';
  tags?: string[];
  estimatedDuration?: number;          // Minutes
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duplicatedFrom?: string;             // Source setlist ID if duplicated
  duplicatedFromName?: string;         // Cached name of source setlist
  showAttribution?: boolean;           // Whether to show duplication attribution
  favorites?: number;                  // Denormalized favorite count
}

export interface SetlistSong {
  id: string; // Unique identifier for this song in the setlist
  songId: string;
  arrangementId: string;
  order: number;
  customKey?: string; // Override arrangement key
  notes?: string;
}

/**
 * Sync queue item (Phase 5)
 */
export interface SyncQueueItem {
  id: string;
  type: 'song' | 'arrangement' | 'setlist';
  operation: 'create' | 'update' | 'delete';
  entityId: string;
  data: unknown;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}

/**
 * User preferences (Phase 5)
 * Settings and preferences for each user
 */
export interface UserPreferences {
  userId: string; // Owner of these preferences
  theme: 'light' | 'dark' | 'system'; // Theme preference
  defaultKey: string; // Default musical key for new arrangements
  autoSync: boolean; // Enable automatic sync when online
  syncOnMobileData: boolean; // Sync even on cellular data (default: false)
  updatedAt: string; // Last updated timestamp
}

/**
 * Base entity interface for repository pattern
 * Defines common fields that all entities should have for sync support
 */
export interface BaseEntity {
  id?: string;
  createdAt?: string;
  updatedAt: string;
  syncStatus?: 'pending' | 'synced' | 'conflict';
  version?: number;
  lastAccessedAt?: number;
}
