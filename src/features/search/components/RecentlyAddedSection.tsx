/**
 * RecentlyAddedSection Component
 *
 * Displays recently added songs on the homepage.
 *
 * Exports:
 * - RecentlyAddedSection: Full component with section wrapper (for standalone use)
 * - RecentlyAddedContent: Content only (for use in accordion)
 */

import SuggestionSection, { SuggestionSectionContent } from './SuggestionSection';
import { useRecentSongs } from '../hooks/useRecentSongs';

interface RecentlyAddedSectionProps {
  limit?: number;
}

/**
 * RecentlyAddedContent - Content without section wrapper
 * For use in accordion or other container layouts
 */
export function RecentlyAddedContent({ limit = 6 }: RecentlyAddedSectionProps) {
  const { songs, loading } = useRecentSongs(limit);

  return (
    <SuggestionSectionContent
      songs={songs}
      loading={loading}
      emptyMessage="No songs have been added yet"
    />
  );
}

/**
 * RecentlyAddedSection - Full component with section wrapper
 * For standalone use
 */
export default function RecentlyAddedSection({ limit = 6 }: RecentlyAddedSectionProps) {
  const { songs, loading } = useRecentSongs(limit);

  return (
    <SuggestionSection
      title="Recently Added"
      seeAllLink="/songs?sort=newest"
      songs={songs}
      loading={loading}
      emptyMessage="No songs have been added yet"
    />
  );
}
