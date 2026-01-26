/**
 * Arrangement domain model types
 *
 * An Arrangement represents a specific playable version of a Song with chords
 * and musical details (key, tempo, capo, etc.).
 */

/**
 * Difficulty level for arrangements
 * - simple: Few chords, basic strumming patterns
 * - standard: Moderate complexity, common progressions
 * - advanced: Complex chords, intricate patterns
 */
export type ArrangementDifficulty = 'simple' | 'standard' | 'advanced';

export interface Arrangement {
  id: string;
  slug: string; // URL-friendly slug (e.g., "gh2lk" - 6-char nanoid only)
  songId: string;
  name: string;
  key: string; // Musical key (C, D, E, F, G, A, B, with sharps/flats)
  tempo: number; // BPM (beats per minute)
  timeSignature: string; // e.g., "4/4", "3/4", "6/8"
  capo: number; // Capo position (0 = no capo)
  difficulty?: ArrangementDifficulty; // Skill level required
  tags: string[];
  favorites: number; // Popularity count
  chordProContent: string; // ChordPro formatted text
  createdAt: string;
  updatedAt: string;
  // Phase 5 fields (Authentication)
  userId?: string;                     // Creator user ID (optional for backward compatibility)
  isPublic?: boolean;                  // Public vs private (default: true for arrangements)
  // Phase 5 fields (Sync support)
  syncStatus?: 'pending' | 'synced' | 'conflict';
  version?: number;
  lastAccessedAt?: number;
  // Phase 2 fields (Groups & Ownership)
  ownerType?: 'user' | 'group';        // Type of owner
  ownerId?: string;                    // userId or groupId as string
  // Audio references
  audioFileKey?: string;               // R2 object key for MP3 file
  youtubeUrl?: string;                 // YouTube video URL or ID
}

/**
 * Metadata subset used for forms and editing
 * These are the core musical properties that can be edited separately
 * from the ChordPro content
 */
export interface ArrangementMetadata {
  key: string;
  tempo: number;
  timeSignature: string;
  capo: number;
  difficulty?: ArrangementDifficulty;
}

/**
 * Sort options for arrangements
 */
export type SortOption = 'popular' | 'newest' | 'oldest';

/**
 * Creator info subset for display purposes
 * Respects privacy settings via showRealName field
 */
export interface CreatorInfo {
  _id: string;
  username?: string;
  displayName?: string;
  showRealName?: boolean;
  avatarKey?: string;
}

/**
 * Owner info for display (can be user or group)
 * Phase 2: Groups - unified owner display
 */
export interface OwnerInfo {
  type: 'user' | 'group';
  id: string;
  name: string;
  slug?: string;
  avatarKey?: string;
  isSystemGroup?: boolean;
  // User display fields (only present for type: 'user')
  username?: string;
  displayName?: string;
  showRealName?: boolean;
}

/**
 * Arrangement with embedded creator data
 * Used when displaying who created an arrangement
 */
export interface ArrangementWithCreator extends Arrangement {
  creator: CreatorInfo | null;
  owner?: OwnerInfo; // Phase 2: Optional owner info (defaults to creator)
}

/**
 * Arrangement with embedded song data for display purposes
 *
 * Used in widgets and cards where song context is needed without separate queries.
 * This is a query-time join pattern (denormalization) for read-optimized scenarios.
 *
 * Example use cases:
 * - Featured arrangements widget (shows "Song Title - Arrangement Name")
 * - Search results (shows arrangement with parent song context)
 * - Recently played (displays full context)
 */
export interface ArrangementWithSong extends Arrangement {
  song: {
    id: string;
    slug: string;
    title: string;
    artist: string;
  };
}

/**
 * Arrangement with both song and creator data
 * Used for featured arrangements widget and comprehensive displays
 */
export interface ArrangementWithSongAndCreator extends ArrangementWithSong {
  creator: CreatorInfo | null;
  owner?: OwnerInfo; // Phase 2: Optional owner info (defaults to creator)
}

/**
 * Aggregated arrangement statistics for a song
 * Used in browse/list views to show arrangement metadata without loading full arrangements
 */
export interface ArrangementSummary {
  count: number;
  keys: string[];
  tempoMin: number | null;
  tempoMax: number | null;
  totalFavorites: number;
  difficulties: ArrangementDifficulty[];
}
