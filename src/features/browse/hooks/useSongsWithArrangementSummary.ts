/**
 * useSongsWithArrangementSummary Hook
 *
 * Fetches songs with arrangement summary data for the browse page.
 */

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { mapConvexSongToFrontend } from '@/features/shared';
import type { BrowseFilters } from './useBrowseFilters';
import type { SongWithSummary } from '@/types';

interface UseSongsWithArrangementSummaryOptions {
  filters: BrowseFilters;
  dateRange: { from: number | null; to: number | null };
  limit?: number;
}

export function useSongsWithArrangementSummary({
  filters,
  dateRange,
  limit = 50,
}: UseSongsWithArrangementSummaryOptions) {
  const data = useQuery(api.songs.listWithArrangementSummary, {
    themes: filters.themes.length > 0 ? filters.themes : undefined,
    artist: filters.artist || undefined,
    dateFrom: dateRange.from || undefined,
    dateTo: dateRange.to || undefined,
    searchQuery: filters.searchQuery || undefined,
    hasKey: filters.hasKey || undefined,
    tempoRange: filters.tempoRange || undefined,
    hasDifficulty: filters.hasDifficulty || undefined,
    minArrangements: filters.minArrangements || undefined,
    sortBy: filters.sortBy,
    limit,
  });

  const songs: SongWithSummary[] = (data ?? []).map((song) => ({
    ...mapConvexSongToFrontend(song),
    arrangementSummary: song.arrangementSummary,
  }));

  return {
    songs,
    loading: data === undefined,
    totalCount: songs.length,
  };
}

export default useSongsWithArrangementSummary;
