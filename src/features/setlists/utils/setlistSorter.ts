/**
 * Setlist sorting utilities
 *
 * Provides sorting functions for setlist lists.
 * Follows pattern from src/features/arrangements/utils/arrangementSorter.ts
 */

import type { Setlist } from '@/types';
import type { SetlistSortOption } from '../types';

/**
 * Sort setlists by specified criteria
 *
 * @param setlists - Array of setlists to sort
 * @param sortBy - Sort criteria (name, date, or recent)
 * @returns Sorted array of setlists (immutable - creates new array)
 */
export function sortSetlists(
  setlists: Setlist[],
  sortBy: SetlistSortOption['value']
): Setlist[] {
  // Create copy for immutability
  const sorted = [...setlists];

  switch (sortBy) {
    case 'name':
      // Alphabetical sort (A-Z)
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case 'date':
      // Sort by performance date (most recent first)
      return sorted.sort((a, b) => {
        const dateA = a.performanceDate ? new Date(a.performanceDate).getTime() : 0;
        const dateB = b.performanceDate ? new Date(b.performanceDate).getTime() : 0;
        return dateB - dateA; // Descending
      });

    case 'recent':
      // Sort by last updated (most recent first)
      return sorted.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

    default:
      return sorted;
  }
}
