/**
 * useSongsWithArrangementSummary Hook
 *
 * Fetches songs with arrangement summary data for the browse page.
 * Uses Fuse.js for fuzzy search on the searchQuery filter.
 */

import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import Fuse from 'fuse.js';
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
  // Don't pass searchQuery to server - we'll filter client-side with fuzzy search
  const data = useQuery(api.songs.listWithArrangementSummary, {
    themes: filters.themes.length > 0 ? filters.themes : undefined,
    artists: filters.artists.length > 0 ? filters.artists : undefined,
    origins: filters.origins.length > 0 ? filters.origins : undefined,
    dateFrom: dateRange.from || undefined,
    dateTo: dateRange.to || undefined,
    hasKeys: filters.hasKeys.length > 0 ? filters.hasKeys : undefined,
    tempoRanges: filters.tempoRanges.length > 0 ? filters.tempoRanges : undefined,
    hasDifficulties: filters.hasDifficulties.length > 0 ? filters.hasDifficulties : undefined,
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
    let allSongs = (data ?? []).map((song) => ({
      ...mapConvexSongToFrontend(song),
      arrangementSummary: song.arrangementSummary,
    }));

    // Apply fuzzy search for searchQuery (client-side with Fuse.js)
    if (filters.searchQuery && filters.searchQuery.length >= 2) {
      const fuse = new Fuse(allSongs, {
        keys: [
          { name: 'title', weight: 0.5 },
          { name: 'artist', weight: 0.3 },
          { name: 'themes', weight: 0.2 },
        ],
        threshold: 0.4,
        includeScore: true,
        ignoreLocation: true,
      });
      allSongs = fuse.search(filters.searchQuery).map((r) => r.item);
    }

    // Filter by favorites if enabled
    if (filters.showFavoritesOnly && favoriteSongIds) {
      const favoriteSet = new Set(favoriteSongIds);
      return allSongs.filter((song) => favoriteSet.has(song.id));
    }

    return allSongs;
  }, [data, filters.searchQuery, filters.showFavoritesOnly, favoriteSongIds]);

  const loading = data === undefined ||
    (filters.showFavoritesOnly && favoriteSongIds === undefined);

  return {
    songs,
    loading,
    totalCount: songs.length,
  };
}

export default useSongsWithArrangementSummary;
