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
import {
  DATE_PRESETS,
  TEMPO_RANGES,
  SORT_OPTIONS,
  DIFFICULTY_OPTIONS,
} from '../utils/filterConstants';

export type ArrangementFilter = 'all' | 'has_arrangements' | 'needs_arrangements';

export interface BrowseFilters {
  // Song-level
  themes: string[];
  artists: string[];
  origins: string[];
  datePreset: DatePreset | null;
  searchQuery: string;
  // Arrangement-level
  hasKeys: string[];
  tempoRanges: TempoRange[];
  hasDifficulties: DifficultyLevel[];
  arrangementFilter: ArrangementFilter;
  // User-specific
  showFavoritesOnly: boolean;
  // Sort
  sortBy: SortOption;
}

const DEFAULT_FILTERS: BrowseFilters = {
  themes: [],
  artists: [],
  origins: [],
  datePreset: null,
  searchQuery: '',
  hasKeys: [],
  tempoRanges: [],
  hasDifficulties: [],
  arrangementFilter: 'all',
  showFavoritesOnly: false,
  sortBy: 'popular',
};

function isValidArrangementFilter(value: string | null): value is ArrangementFilter {
  return value === 'all' || value === 'has_arrangements' || value === 'needs_arrangements';
}

// Type guards for URL parameter validation
function isValidDatePreset(value: string | null): value is DatePreset {
  return value !== null && value in DATE_PRESETS;
}

function isValidTempoRange(value: string | null): value is TempoRange {
  return value !== null && value in TEMPO_RANGES;
}

function isValidDifficultyLevel(value: string | null): value is DifficultyLevel {
  return value !== null && value in DIFFICULTY_OPTIONS;
}

function isValidSortOption(value: string | null): value is SortOption {
  return value !== null && value in SORT_OPTIONS;
}

export function useBrowseFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL with type validation
  const filtersFromUrl = useMemo((): BrowseFilters => {
    const dateParam = searchParams.get('date');
    const sortParam = searchParams.get('sort');
    const arrFilterParam = searchParams.get('arr');

    return {
      themes: searchParams.get('themes')?.split(',').filter(Boolean) || [],
      artists: searchParams.get('artists')?.split(',').filter(Boolean) || [],
      origins: searchParams.get('origins')?.split(',').filter(Boolean) || [],
      datePreset: isValidDatePreset(dateParam) ? dateParam : null,
      searchQuery: searchParams.get('q') || '',
      hasKeys: searchParams.get('keys')?.split(',').filter(Boolean) || [],
      tempoRanges: (searchParams.get('tempo')?.split(',').filter(Boolean) || [])
        .filter((t): t is TempoRange => isValidTempoRange(t)),
      hasDifficulties: (searchParams.get('difficulties')?.split(',').filter(Boolean) || [])
        .filter((d): d is DifficultyLevel => isValidDifficultyLevel(d)),
      arrangementFilter: isValidArrangementFilter(arrFilterParam) ? arrFilterParam : 'all',
      showFavoritesOnly: searchParams.get('favorites') === 'true',
      sortBy: isValidSortOption(sortParam) ? sortParam : 'popular',
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
        if (next.artists.length > 0) params.set('artists', next.artists.join(','));
        if (next.origins.length > 0) params.set('origins', next.origins.join(','));
        if (next.datePreset) params.set('date', next.datePreset);
        if (next.searchQuery) params.set('q', next.searchQuery);
        if (next.hasKeys.length > 0) params.set('keys', next.hasKeys.join(','));
        if (next.tempoRanges.length > 0) params.set('tempo', next.tempoRanges.join(','));
        if (next.hasDifficulties.length > 0) params.set('difficulties', next.hasDifficulties.join(','));
        if (next.arrangementFilter !== 'all') params.set('arr', next.arrangementFilter);
        if (next.showFavoritesOnly) params.set('favorites', 'true');
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
    if (filters.artists.length > 0) count++;
    if (filters.origins.length > 0) count++;
    if (filters.datePreset) count++;
    if (filters.hasKeys.length > 0) count++;
    if (filters.tempoRanges.length > 0) count++;
    if (filters.hasDifficulties.length > 0) count++;
    if (filters.arrangementFilter !== 'all') count++;
    if (filters.showFavoritesOnly) count++;
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
