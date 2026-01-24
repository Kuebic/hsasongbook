/**
 * useSongsWithArrangementSummary Hook
 *
 * Fetches songs with arrangement summary data for the browse page.
 */

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { BrowseFilters } from './useBrowseFilters';
import type { Song } from '@/types/Song.types';

export interface ArrangementSummary {
  count: number;
  keys: string[];
  tempoMin: number | null;
  tempoMax: number | null;
  avgRating: number;
  totalFavorites: number;
  difficulties: Array<'simple' | 'standard' | 'advanced'>;
}

export interface SongWithSummary extends Song {
  arrangementSummary: ArrangementSummary;
}

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
    id: song._id,
    slug: song.slug,
    title: song.title,
    artist: song.artist ?? '',
    themes: song.themes,
    copyright: song.copyright,
    lyrics: song.lyrics ? { en: song.lyrics } : undefined,
    createdAt: new Date(song._creationTime).toISOString(),
    updatedAt: song.updatedAt
      ? new Date(song.updatedAt).toISOString()
      : new Date(song._creationTime).toISOString(),
    arrangementSummary: song.arrangementSummary,
  }));

  return {
    songs,
    loading: data === undefined,
    totalCount: songs.length,
  };
}

export default useSongsWithArrangementSummary;
