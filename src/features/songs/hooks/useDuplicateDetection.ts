/**
 * useDuplicateDetection Hook
 *
 * Specialized fuzzy search for detecting potential duplicate songs.
 * Handles variations like "Oh, Light of Grace" vs "Light of Grace" by
 * normalizing common song title prefixes.
 */

import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import Fuse from 'fuse.js';
import { api } from '../../../../convex/_generated/api';
import { useDebouncedValue } from '@/features/shared/hooks/useDebounce';

// Common prefixes that are often added/removed from song titles
const COMMON_PREFIXES = /^(oh,?\s*|the\s+|a\s+)/i;

/**
 * Normalize a song title by removing common prefixes and punctuation
 * "Oh, Light of Grace" -> "light of grace"
 * "The Lord Is My Shepherd" -> "lord is my shepherd"
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(COMMON_PREFIXES, '')
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .trim();
}

export interface PotentialDuplicate {
  id: string;
  title: string;
  artist: string;
  slug: string;
  score: number;
}

export interface UseDuplicateDetectionReturn {
  duplicates: PotentialDuplicate[];
  isChecking: boolean;
}

interface SongWithNormalized {
  _id: string;
  title: string;
  normalizedTitle: string;
  artist?: string;
  slug: string;
}

export function useDuplicateDetection(
  title: string,
  debounceDelay = 500
): UseDuplicateDetectionReturn {
  const debouncedTitle = useDebouncedValue(title, { delay: debounceDelay });

  // Load all songs
  const convexSongs = useQuery(api.songs.list);
  const isLoading = convexSongs === undefined;

  // Add normalized titles to songs for better matching
  const songsWithNormalized = useMemo((): SongWithNormalized[] => {
    if (!convexSongs) return [];
    return convexSongs.map((song) => ({
      _id: song._id,
      title: song.title,
      normalizedTitle: normalizeTitle(song.title),
      artist: song.artist,
      slug: song.slug,
    }));
  }, [convexSongs]);

  // Create Fuse instance that searches both original and normalized titles
  const fuse = useMemo(() => {
    if (songsWithNormalized.length === 0) return null;
    return new Fuse(songsWithNormalized, {
      keys: ['title', 'normalizedTitle'],
      threshold: 0.35, // Slightly higher to catch more variations
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 3,
    });
  }, [songsWithNormalized]);

  // Find potential duplicates
  const duplicates = useMemo((): PotentialDuplicate[] => {
    const t = debouncedTitle.trim();
    if (!t || t.length < 3 || !fuse) return [];

    // Search with both original and normalized versions
    const normalizedQuery = normalizeTitle(t);
    const originalResults = fuse.search(t);
    const normalizedResults = fuse.search(normalizedQuery);

    // Combine and deduplicate results
    const seenIds = new Set<string>();
    const combined: PotentialDuplicate[] = [];

    for (const r of [...originalResults, ...normalizedResults]) {
      if (seenIds.has(r.item._id)) continue;
      if ((r.score ?? 1) >= 0.35) continue; // Skip low-quality matches

      seenIds.add(r.item._id);
      combined.push({
        id: r.item._id,
        title: r.item.title,
        artist: r.item.artist ?? 'Unknown Artist',
        slug: r.item.slug,
        score: r.score ?? 1,
      });
    }

    // Sort by score (lower = better match) and limit to 5
    return combined.sort((a, b) => a.score - b.score).slice(0, 5);
  }, [debouncedTitle, fuse]);

  return {
    duplicates,
    isChecking: title !== debouncedTitle || isLoading,
  };
}

export default useDuplicateDetection;
