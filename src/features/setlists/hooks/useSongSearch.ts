/**
 * useSongSearch Hook
 *
 * Provides search functionality for songs using Convex.
 * Loads songs from Convex, then filters in-memory based on search query.
 *
 * Features:
 * - Debounced search (300ms delay)
 * - Filters by song title and artist
 * - Memoized filtering for performance
 * - Real-time updates from Convex
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

import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useDebouncedValue } from '@/features/shared/hooks/useDebounce';
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
  /** Error state - null in normal operation. Convex handles errors at provider level. */
  error: string | null;
}

/**
 * Hook for searching songs with debouncing and Convex integration
 *
 * @param initialQuery - Initial search query (default: '')
 * @returns Search state and filtered results
 */
export function useSongSearch(initialQuery = ''): UseSongSearchReturn {
  const [query, setQuery] = useState<string>(initialQuery);
  const debouncedQuery = useDebouncedValue(query, { delay: 300 });

  // Load all songs from Convex
  const convexSongs = useQuery(api.songs.list);
  const isLoading = convexSongs === undefined;

  // Map Convex songs to frontend Song type
  const songs: Song[] = useMemo(() => {
    if (!convexSongs) return [];
    return convexSongs.map((song) => ({
      id: song._id,
      slug: song.slug,
      title: song.title,
      artist: song.artist ?? '',
      themes: song.themes,
      copyright: song.copyright,
      lyrics: song.lyrics ? { en: song.lyrics } : undefined,
      createdAt: new Date(song._creationTime).toISOString(),
      updatedAt: new Date(song._creationTime).toISOString(),
    }));
  }, [convexSongs]);

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
    return songs.filter((song) => {
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
    isEmpty,
    // Convex handles server errors via ConvexProvider's error boundary
    error: null,
  };
}

/**
 * Default export for convenient importing
 */
export default useSongSearch;
