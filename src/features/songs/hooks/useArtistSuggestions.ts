/**
 * useArtistSuggestions Hook
 *
 * Provides fuzzy-matched artist suggestions based on existing artists in the database.
 * Uses Fuse.js for fuzzy matching to catch typos like "Christ omlin" → "Chris Tomlin".
 */

import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import Fuse from 'fuse.js';
import { api } from '../../../../convex/_generated/api';
import { useDebouncedValue } from '@/features/shared/hooks/useDebounce';

const FUSE_OPTIONS: Fuse.IFuseOptions<string> = {
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

export interface UseArtistSuggestionsReturn {
  suggestions: string[];
  isLoading: boolean;
  allArtists: string[];
}

export function useArtistSuggestions(
  query: string,
  options?: { debounceDelay?: number }
): UseArtistSuggestionsReturn {
  const { debounceDelay = 150 } = options ?? {};

  const debouncedQuery = useDebouncedValue(query, { delay: debounceDelay });

  // Load distinct artists from Convex
  const artists = useQuery(api.songs.getDistinctArtists);
  const isLoading = artists === undefined;

  // Memoize allArtists to avoid recreating on every render
  const allArtists = useMemo(() => artists ?? [], [artists]);

  // Create memoized Fuse instance
  const fuse = useMemo(() => {
    if (allArtists.length === 0) return null;
    return new Fuse(allArtists, FUSE_OPTIONS);
  }, [allArtists]);

  // Perform fuzzy search
  const suggestions = useMemo((): string[] => {
    const q = debouncedQuery.trim();

    // No query or too short: no suggestions
    if (!q || q.length < 2) {
      return [];
    }

    if (!fuse) return [];

    // Fuse returns results sorted by score (lowest = best match)
    const results = fuse.search(q);
    return results.slice(0, 5).map((r) => r.item);
  }, [debouncedQuery, fuse]);

  return {
    suggestions,
    isLoading,
    allArtists,
  };
}

export default useArtistSuggestions;
