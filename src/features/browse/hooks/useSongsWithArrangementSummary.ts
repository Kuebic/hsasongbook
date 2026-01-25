/**
 * useSongsWithArrangementSummary Hook
 *
 * Fetches songs with arrangement summary data for the browse page.
 */

import { useMemo } from 'react';
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
    origin: filters.origin || undefined,
    dateFrom: dateRange.from || undefined,
    dateTo: dateRange.to || undefined,
    searchQuery: filters.searchQuery || undefined,
    hasKey: filters.hasKey || undefined,
    tempoRange: filters.tempoRange || undefined,
    hasDifficulty: filters.hasDifficulty || undefined,
    arrangementFilter: filters.arrangementFilter !== 'all' ? filters.arrangementFilter : undefined,
    sortBy: filters.sortBy,
    limit,
  });

  // Fetch user's favorite song IDs when favorites filter is active
  const favoriteSongIds = useQuery(
    api.favorites.getFavoriteIds,
    filters.showFavoritesOnly ? { targetType: 'song' as const } : 'skip'
  );

  const songs: SongWithSummary[] = useMemo(() => {
    const allSongs = (data ?? []).map((song) => ({
      ...mapConvexSongToFrontend(song),
      arrangementSummary: song.arrangementSummary,
    }));

    // Filter by favorites if enabled
    if (filters.showFavoritesOnly && favoriteSongIds) {
      const favoriteSet = new Set(favoriteSongIds);
      return allSongs.filter((song) => favoriteSet.has(song.id));
    }

    return allSongs;
  }, [data, filters.showFavoritesOnly, favoriteSongIds]);

  const loading = data === undefined ||
    (filters.showFavoritesOnly && favoriteSongIds === undefined);

  return {
    songs,
    loading,
    totalCount: songs.length,
  };
}

export default useSongsWithArrangementSummary;
