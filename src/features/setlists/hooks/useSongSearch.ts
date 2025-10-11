/**
 * useSongSearch Hook
 *
 * Provides search functionality for songs with IndexedDB integration.
 * Loads songs once, then filters in-memory based on search query.
 *
 * Features:
 * - Debounced search (300ms delay)
 * - Filters by song title and artist
 * - Memoized filtering for performance
 *
 * @example
 * ```tsx
 * const { query, setQuery, results, isLoading, isEmpty } = useSongSearch();
 *
 * <input value={query} onChange={e => setQuery(e.target.value)} />
 * {results.map(song => (
 *   <div key={song.id}>{song.title} - {song.artist}</div>
 * ))}
 * ```
 */

import { useState, useEffect, useMemo } from 'react';
import { SongRepository } from '@/features/pwa/db/repository';
import { useDebouncedValue } from '@/features/shared/hooks/useDebounce';
import logger from '@/lib/logger';
import type { Song } from '@/types';

/**
 * Return type for useSongSearch hook
 */
export interface UseSongSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: Song[];
  isLoading: boolean;
  isEmpty: boolean;
}

/**
 * Hook for searching songs with debouncing and IndexedDB integration
 *
 * @param initialQuery - Initial search query (default: '')
 * @returns Search state and filtered results
 */
export function useSongSearch(initialQuery = ''): UseSongSearchReturn {
  const [query, setQuery] = useState<string>(initialQuery);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const debouncedQuery = useDebouncedValue(query, { delay: 300 });

  /**
   * Load all songs from IndexedDB on mount
   */
  useEffect(() => {
    async function loadData(): Promise<void> {
      try {
        setIsLoading(true);
        logger.debug('Loading songs from IndexedDB...');

        const songRepo = new SongRepository();
        const allSongs = await songRepo.getAll();

        setSongs(allSongs);

        logger.debug('Songs loaded:', allSongs.length);
      } catch (error) {
        logger.error('Failed to load songs:', error);
        setSongs([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  /**
   * Filter songs based on debounced query
   * Searches: song title, artist
   */
  const filteredResults = useMemo((): Song[] => {
    const q = debouncedQuery.toLowerCase().trim();

    // If no query, return all songs
    if (!q) {
      return songs;
    }

    // Filter by title or artist
    return songs.filter(song => {
      const matchesTitle = song.title.toLowerCase().includes(q);
      const matchesArtist = song.artist.toLowerCase().includes(q);

      return matchesTitle || matchesArtist;
    });
  }, [debouncedQuery, songs]);

  const isEmpty = filteredResults.length === 0 && !isLoading;

  return {
    query,
    setQuery,
    results: filteredResults,
    isLoading,
    isEmpty
  };
}

/**
 * Default export for convenient importing
 */
export default useSongSearch;
