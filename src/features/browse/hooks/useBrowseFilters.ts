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
  artist: string | null;
  datePreset: DatePreset | null;
  searchQuery: string;
  // Arrangement-level
  hasKey: string | null;
  tempoRange: TempoRange | null;
  hasDifficulty: DifficultyLevel | null;
  arrangementFilter: ArrangementFilter;
  // User-specific
  showFavoritesOnly: boolean;
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
    const tempoParam = searchParams.get('tempo');
    const difficultyParam = searchParams.get('difficulty');
    const sortParam = searchParams.get('sort');
    const arrFilterParam = searchParams.get('arr');

    return {
      themes: searchParams.get('themes')?.split(',').filter(Boolean) || [],
      artist: searchParams.get('artist') || null,
      datePreset: isValidDatePreset(dateParam) ? dateParam : null,
      searchQuery: searchParams.get('q') || '',
      hasKey: searchParams.get('key') || null,
      tempoRange: isValidTempoRange(tempoParam) ? tempoParam : null,
      hasDifficulty: isValidDifficultyLevel(difficultyParam) ? difficultyParam : null,
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
        if (next.artist) params.set('artist', next.artist);
        if (next.datePreset) params.set('date', next.datePreset);
        if (next.searchQuery) params.set('q', next.searchQuery);
        if (next.hasKey) params.set('key', next.hasKey);
        if (next.tempoRange) params.set('tempo', next.tempoRange);
        if (next.hasDifficulty) params.set('difficulty', next.hasDifficulty);
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
    if (filters.artist) count++;
    if (filters.datePreset) count++;
    if (filters.hasKey) count++;
    if (filters.tempoRange) count++;
    if (filters.hasDifficulty) count++;
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
