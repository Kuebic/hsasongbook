/**
 * Global type definitions barrel export
 *
 * Import domain types from this single entry point:
 * import { Song, Arrangement, HSASongbookDB } from '@/types'
 */

// Domain models
export type { Song, SongWithSummary } from './Song.types';
export type {
  Arrangement,
  ArrangementDifficulty,
  ArrangementMetadata,
  ArrangementSummary,
  ArrangementWithSong,
  ArrangementWithCreator,
  ArrangementWithSongAndCreator,
  CreatorInfo,
  OwnerInfo,
  SortOption,
} from './Arrangement.types';
export type { Setlist, SetlistSong } from './Setlist.types';

// Database schema
export type {
  HSASongbookDB,
  Draft,
  SyncQueueItem,
  PreferenceValue,
  BaseEntity,
} from './Database.types';
