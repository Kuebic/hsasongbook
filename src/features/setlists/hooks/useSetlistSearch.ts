/**
 * useSetlistSearch Hook
 *
 * Provides search/filter functionality for setlists.
 * Filters in-memory based on search query with debouncing.
 *
 * @example
 * ```tsx
 * const { query, setQuery, results, isEmpty } = useSetlistSearch(setlists);
 *
 * <input value={query} onChange={e => setQuery(e.target.value)} />
 * {results.map(setlist => <SetlistItem key={setlist._id} {...setlist} />)}
 * ```
 */

import { useState, useMemo } from 'react';
import { useDebouncedValue } from '@/features/shared/hooks/useDebounce';

/** Minimal setlist type for search (matches Convex query result) */
interface SetlistForSearch {
  _id: string;
  name: string;
  [key: string]: unknown;
}

export interface UseSetlistSearchReturn<T extends SetlistForSearch> {
  query: string;
  setQuery: (query: string) => void;
  results: T[];
  isEmpty: boolean;
}

/**
 * Hook for filtering setlists with debounced search
 *
 * @param setlists - Array of setlists to filter
 * @param initialQuery - Initial search query (default: '')
 * @returns Search state and filtered results
 */
export function useSetlistSearch<T extends SetlistForSearch>(
  setlists: T[],
  initialQuery = ''
): UseSetlistSearchReturn<T> {
  const [query, setQuery] = useState<string>(initialQuery);
  const debouncedQuery = useDebouncedValue(query, { delay: 300 });

  /**
   * Filter setlists based on debounced query
   * Searches by setlist name (case-insensitive)
   */
  const filteredResults = useMemo((): T[] => {
    const q = debouncedQuery.toLowerCase().trim();

    // If no query, return all setlists
    if (!q) {
      return setlists;
    }

    // Filter by name
    return setlists.filter((setlist) =>
      setlist.name.toLowerCase().includes(q)
    );
  }, [debouncedQuery, setlists]);

  const isEmpty = filteredResults.length === 0;

  return {
    query,
    setQuery,
    results: filteredResults,
    isEmpty,
  };
}

export default useSetlistSearch;
