/**
 * useFuzzySearch Hook
 *
 * Provides fuzzy search functionality using Fuse.js.
 * Loads songs from Convex once, then filters locally for fast, responsive results.
 *
 * Features:
 * - Debounced search (300ms delay)
 * - Fuzzy matching with Fuse.js (handles typos)
 * - Searches: title, artist, themes
 * - Memoized Fuse instance for performance
 * - Returns match score for duplicate detection
 */

import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import Fuse from 'fuse.js';
import { api } from '../../../../convex/_generated/api';
import { useDebouncedValue } from './useDebounce';
import type { Song } from '@/types';

// Fuse.js configuration for song search
const FUSE_OPTIONS: Fuse.IFuseOptions<Song> = {
  keys: [
    { name: 'title', weight: 0.5 },
    { name: 'artist', weight: 0.3 },
    { name: 'themes', weight: 0.2 },
  ],
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

export interface FuzzySearchResult<T> {
  item: T;
  score: number; // 0 = perfect match, 1 = no match
}

export interface UseFuzzySearchOptions {
  debounceDelay?: number;
  threshold?: number;
  minQueryLength?: number;
}

export interface UseFuzzySearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: FuzzySearchResult<Song>[];
  allSongs: Song[];
  isLoading: boolean;
  isSearching: boolean;
  isEmpty: boolean;
}

export function useFuzzySearch(
  initialQuery = '',
  options: UseFuzzySearchOptions = {}
): UseFuzzySearchReturn {
  const {
    debounceDelay = 300,
    threshold = FUSE_OPTIONS.threshold,
    minQueryLength = 2,
  } = options;

  const [query, setQuery] = useState<string>(initialQuery);
  const debouncedQuery = useDebouncedValue(query, { delay: debounceDelay });

  // Load all songs from Convex
  const convexSongs = useQuery(api.songs.list);
  const isLoading = convexSongs === undefined;

  // Map Convex songs to frontend Song type
  const allSongs: Song[] = useMemo(() => {
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

  // Create memoized Fuse instance
  const fuse = useMemo(() => {
    if (allSongs.length === 0) return null;
    return new Fuse(allSongs, { ...FUSE_OPTIONS, threshold });
  }, [allSongs, threshold]);

  // Perform fuzzy search
  const results = useMemo((): FuzzySearchResult<Song>[] => {
    const q = debouncedQuery.trim();

    // If no query or too short, return all songs with score 1
    if (!q || q.length < minQueryLength) {
      return allSongs.map((item) => ({ item, score: 1 }));
    }

    if (!fuse) return [];

    // Fuse returns results sorted by score (lowest first = best match)
    const fuseResults = fuse.search(q);
    return fuseResults.map((r) => ({
      item: r.item,
      score: r.score ?? 1,
    }));
  }, [debouncedQuery, fuse, allSongs, minQueryLength]);

  const isSearching = query !== debouncedQuery;
  const isEmpty =
    results.length === 0 && !isLoading && debouncedQuery.length >= minQueryLength;

  return {
    query,
    setQuery,
    results,
    allSongs,
    isLoading,
    isSearching,
    isEmpty,
  };
}

export default useFuzzySearch;
