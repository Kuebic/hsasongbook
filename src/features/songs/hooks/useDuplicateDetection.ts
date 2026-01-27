/**
 * useDuplicateDetection Hook
 *
 * Specialized fuzzy search for detecting potential duplicate songs.
 * Uses title-only search with stricter threshold to minimize false positives.
 */

import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import Fuse from 'fuse.js';
import { api } from '../../../../convex/_generated/api';
import { useDebouncedValue } from '@/features/shared/hooks/useDebounce';

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

export function useDuplicateDetection(
  title: string,
  debounceDelay = 500
): UseDuplicateDetectionReturn {
  const debouncedTitle = useDebouncedValue(title, { delay: debounceDelay });

  // Load all songs
  const convexSongs = useQuery(api.songs.list);
  const isLoading = convexSongs === undefined;

  // Create Fuse instance for title-only search with stricter threshold
  const fuse = useMemo(() => {
    if (!convexSongs || convexSongs.length === 0) return null;
    return new Fuse(convexSongs, {
      keys: ['title'],
      threshold: 0.3,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 3,
    });
  }, [convexSongs]);

  // Find potential duplicates
  const duplicates = useMemo((): PotentialDuplicate[] => {
    const t = debouncedTitle.trim();
    if (!t || t.length < 3 || !fuse) return [];

    const results = fuse.search(t);

    // Only return matches with score < 0.3 (very similar)
    return results
      .filter((r) => (r.score ?? 1) < 0.3)
      .slice(0, 5) // Max 5 duplicates shown
      .map((r) => ({
        id: r.item._id,
        title: r.item.title,
        artist: r.item.artist ?? 'Unknown Artist',
        slug: r.item.slug,
        score: r.score ?? 1,
      }));
  }, [debouncedTitle, fuse]);

  return {
    duplicates,
    isChecking: title !== debouncedTitle || isLoading,
  };
}

export default useDuplicateDetection;
