/**
 * useTagSuggestions Hook
 *
 * Generic hook for fetching and filtering tag suggestions.
 * Used with ChipInput for dynamic autocomplete from database.
 */

import { useMemo } from 'react';
import Fuse from 'fuse.js';

const FUSE_OPTIONS: Fuse.IFuseOptions<string> = {
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 1,
};

export interface UseTagSuggestionsOptions {
  /** Currently selected values to exclude from suggestions */
  selectedValues?: string[];
  /** Maximum number of suggestions to return */
  maxSuggestions?: number;
}

export interface UseTagSuggestionsReturn {
  /** Filtered suggestions based on query */
  suggestions: string[];
  /** All available options (for ChipInput dynamicSuggestions prop) */
  allOptions: string[];
}

/**
 * Hook for filtering tag suggestions with fuzzy matching.
 *
 * @param query - The search query string
 * @param allOptions - All available options to search from
 * @param options - Configuration options
 */
export function useTagSuggestions(
  query: string,
  allOptions: string[] | undefined,
  options: UseTagSuggestionsOptions = {}
): UseTagSuggestionsReturn {
  const { selectedValues = [], maxSuggestions = 8 } = options;

  // Memoize the available options (excluding selected)
  const availableOptions = useMemo(() => {
    if (!allOptions) return [];
    const selectedSet = new Set(selectedValues.map((v) => v.toLowerCase()));
    return allOptions.filter((opt) => !selectedSet.has(opt.toLowerCase()));
  }, [allOptions, selectedValues]);

  // Create Fuse instance
  const fuse = useMemo(() => {
    if (availableOptions.length === 0) return null;
    return new Fuse(availableOptions, FUSE_OPTIONS);
  }, [availableOptions]);

  // Perform fuzzy search
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();

    // No query: return top options
    if (!q) {
      return availableOptions.slice(0, maxSuggestions);
    }

    if (!fuse) return [];

    // Fuse returns results sorted by score (lowest = best match)
    const results = fuse.search(q);
    return results.slice(0, maxSuggestions).map((r) => r.item);
  }, [query, fuse, availableOptions, maxSuggestions]);

  return {
    suggestions,
    allOptions: allOptions ?? [],
  };
}

export default useTagSuggestions;
