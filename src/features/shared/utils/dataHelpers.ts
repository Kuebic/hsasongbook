import type { Song } from '@/types/Song.types';
import type { Arrangement } from '@/types/Arrangement.types';
import songsData from '../data/songs.json';
import arrangementsData from '../data/arrangements.json';

// Cache the data for performance
interface DataCache {
  songs: Song[] | null;
  arrangements: Arrangement[] | null;
  songArrangementMap: Record<string, Arrangement[]> | null;
}

const dataCache: DataCache = {
  songs: null,
  arrangements: null,
  songArrangementMap: null
};

// Initialize cache
function initializeCache(): void {
  if (!dataCache.songs) {
    dataCache.songs = songsData as Song[];
    dataCache.arrangements = arrangementsData as Arrangement[];

    // Create a map for quick lookups
    dataCache.songArrangementMap = (arrangementsData as Arrangement[]).reduce((map, arr) => {
      if (!map[arr.songId]) {
        map[arr.songId] = [];
      }
      map[arr.songId].push(arr);
      return map;
    }, {} as Record<string, Arrangement[]>);
  }
}

export function getAllSongs(): Song[] {
  initializeCache();
  return dataCache.songs || [];
}

export function getSongById(id: string): Song | undefined {
  initializeCache();
  return dataCache.songs?.find(song => song.id === id);
}

export function getArrangementsBySongId(songId: string): Arrangement[] {
  try {
    initializeCache();
    return dataCache.songArrangementMap?.[songId] || [];
  } catch (error) {
    console.error('Error fetching arrangements:', error);
    return [];
  }
}

export function getArrangementById(id: string): Arrangement | undefined {
  initializeCache();
  return dataCache.arrangements?.find(arr => arr.id === id);
}

export interface SongWithArrangements extends Song {
  arrangements: Arrangement[];
}

export function getSongWithArrangements(songId: string): SongWithArrangements | null {
  const song = getSongById(songId);
  if (!song) return null;

  return {
    ...song,
    arrangements: getArrangementsBySongId(songId)
  };
}

export function searchSongs(searchTerm: string): Song[] {
  if (!searchTerm?.trim()) return getAllSongs();

  const search = searchTerm.toLowerCase();
  return getAllSongs().filter(song =>
    song.title.toLowerCase().includes(search) ||
    song.artist.toLowerCase().includes(search) ||
    song.themes?.some(theme => theme.toLowerCase().includes(search))
  );
}

// Legacy format song interface for backwards compatibility
export interface LegacyFormatSong {
  id: number;
  title: string;
  artist: string;
  themes?: string[];
  key: string;
  tempo: string;
  lyrics: string;
}

// For backwards compatibility during migration
export function getLegacyFormatSongs(): LegacyFormatSong[] {
  initializeCache();
  return (dataCache.songs || []).map(song => {
    const arrangements = getArrangementsBySongId(song.id);
    const defaultArr = arrangements[0];
    return {
      ...song,
      id: parseInt(song.id.replace('song_', '')),
      key: defaultArr?.key || 'C',
      tempo: defaultArr?.tempo?.toString() || '72',
      lyrics: ''
    };
  });
}
