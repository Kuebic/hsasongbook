/**
 * useFeaturedArrangements hook
 *
 * Loads featured arrangements from Convex for the homepage widget.
 * Uses algorithm: score = (rating × 0.6) + (favorites × 0.004)
 */

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { ArrangementWithSong } from '@/types';

export interface UseFeaturedArrangementsReturn {
  featured: ArrangementWithSong[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Hook for loading featured arrangements from Convex
 *
 * @param limit - Maximum number of featured arrangements to load (default: 6)
 * @returns Featured arrangements data and reload function
 */
export function useFeaturedArrangements(limit = 6): UseFeaturedArrangementsReturn {
  const data = useQuery(api.arrangements.getFeaturedWithSongs, { limit });

  // Map Convex response to frontend ArrangementWithSong type
  const featured: ArrangementWithSong[] = (data ?? []).map((item) => ({
    id: item._id,
    slug: item.slug,
    songId: item.songId,
    name: item.name,
    key: item.key ?? '',
    tempo: item.tempo ?? 0,
    timeSignature: item.timeSignature ?? '4/4',
    capo: item.capo ?? 0,
    tags: item.tags,
    rating: item.rating,
    favorites: item.favorites,
    chordProContent: item.chordProContent,
    createdAt: new Date(item._creationTime).toISOString(),
    updatedAt: item.updatedAt
      ? new Date(item.updatedAt).toISOString()
      : new Date(item._creationTime).toISOString(),
    song: item.song
      ? {
          id: item.song._id,
          slug: item.song.slug,
          title: item.song.title,
          artist: item.song.artist ?? '',
        }
      : {
          id: '',
          slug: '',
          title: 'Unknown Song',
          artist: '',
        },
    // Audio references (for play button on cards)
    audioFileKey: item.audioFileKey,
    youtubeUrl: item.youtubeUrl,
  }));

  return {
    featured,
    loading: data === undefined,
    error: null, // Convex handles errors via ConvexProvider
    reload: () => {}, // Convex auto-reloads on data changes
  };
}
