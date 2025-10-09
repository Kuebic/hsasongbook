import type { Arrangement } from '@/types/Arrangement.types';
import { SORT_OPTIONS, type SortOption } from '../../shared/utils/constants';

export { SORT_OPTIONS }; // Re-export for backward compatibility

export function sortArrangements(
  arrangements: Arrangement[],
  sortBy: SortOption = SORT_OPTIONS.POPULAR
): Arrangement[] {
  // Create a copy to avoid mutating original
  const sorted = [...arrangements];

  switch (sortBy) {
    case SORT_OPTIONS.POPULAR:
      return sorted.sort((a, b) => {
        const aFav = a.favorites || 0;
        const bFav = b.favorites || 0;
        return bFav - aFav;
      });

    case SORT_OPTIONS.RATING:
      return sorted.sort((a, b) => {
        const aRating = a.rating || 0;
        const bRating = b.rating || 0;
        return bRating - aRating;
      });

    case SORT_OPTIONS.NEWEST:
      return sorted.sort((a, b) => {
        const aDate = new Date(a.createdAt || 0);
        const bDate = new Date(b.createdAt || 0);
        return bDate.getTime() - aDate.getTime();
      });

    case SORT_OPTIONS.OLDEST:
      return sorted.sort((a, b) => {
        const aDate = new Date(a.createdAt || 0);
        const bDate = new Date(b.createdAt || 0);
        return aDate.getTime() - bDate.getTime();
      });

    default:
      return sorted;
  }
}
