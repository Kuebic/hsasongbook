/**
 * useBrowseFilters Hook
 *
 * Manages filter state for the browse page with URL sync.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type {
  SortOption,
  TempoRange,
  DifficultyLevel,
  DatePreset,
} from '../utils/filterConstants';
import { DATE_PRESETS } from '../utils/filterConstants';

export interface BrowseFilters {
  // Song-level
  themes: string[];
  artist: string | null;
  datePreset: DatePreset | null;
  searchQuery: string;
  // Arrangement-level
  hasKey: string | null;
  tempoRange: TempoRange | null;
  hasDifficulty: DifficultyLevel | null;
  minArrangements: number;
  // Sort
  sortBy: SortOption;
}

const DEFAULT_FILTERS: BrowseFilters = {
  themes: [],
  artist: null,
  datePreset: null,
  searchQuery: '',
  hasKey: null,
  tempoRange: null,
  hasDifficulty: null,
  minArrangements: 0,
  sortBy: 'popular',
};

export function useBrowseFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL
  const filtersFromUrl = useMemo((): BrowseFilters => {
    return {
      themes: searchParams.get('themes')?.split(',').filter(Boolean) || [],
      artist: searchParams.get('artist') || null,
      datePreset: (searchParams.get('date') as DatePreset) || null,
      searchQuery: searchParams.get('q') || '',
      hasKey: searchParams.get('key') || null,
      tempoRange: (searchParams.get('tempo') as TempoRange) || null,
      hasDifficulty: (searchParams.get('difficulty') as DifficultyLevel) || null,
      minArrangements: parseInt(searchParams.get('minArr') || '0', 10),
      sortBy: (searchParams.get('sort') as SortOption) || 'popular',
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<BrowseFilters>(filtersFromUrl);

  // Sync URL changes to state
  useEffect(() => {
    setFilters(filtersFromUrl);
  }, [filtersFromUrl]);

  // Update a single filter
  const setFilter = useCallback(
    <K extends keyof BrowseFilters>(key: K, value: BrowseFilters[K]) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };

        // Sync to URL
        const params = new URLSearchParams();
        if (next.themes.length > 0) params.set('themes', next.themes.join(','));
        if (next.artist) params.set('artist', next.artist);
        if (next.datePreset) params.set('date', next.datePreset);
        if (next.searchQuery) params.set('q', next.searchQuery);
        if (next.hasKey) params.set('key', next.hasKey);
        if (next.tempoRange) params.set('tempo', next.tempoRange);
        if (next.hasDifficulty) params.set('difficulty', next.hasDifficulty);
        if (next.minArrangements > 0) params.set('minArr', next.minArrangements.toString());
        if (next.sortBy !== 'popular') params.set('sort', next.sortBy);

        setSearchParams(params, { replace: true });

        return next;
      });
    },
    [setSearchParams]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.themes.length > 0) count++;
    if (filters.artist) count++;
    if (filters.datePreset) count++;
    if (filters.hasKey) count++;
    if (filters.tempoRange) count++;
    if (filters.hasDifficulty) count++;
    if (filters.minArrangements > 0) count++;
    return count;
  }, [filters]);

  // Convert date preset to timestamp range
  const dateRange = useMemo(() => {
    if (!filters.datePreset) return { from: null, to: null };
    const preset = DATE_PRESETS[filters.datePreset];
    const now = Date.now();
    const from = now - preset.days * 24 * 60 * 60 * 1000;
    return { from, to: now };
  }, [filters.datePreset]);

  return {
    filters,
    setFilter,
    clearFilters,
    activeFilterCount,
    dateRange,
  };
}

export default useBrowseFilters;
