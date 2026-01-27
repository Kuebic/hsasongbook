/**
 * PopularSongsSection Component
 *
 * Displays popular songs (by arrangement count) on the homepage.
 *
 * Exports:
 * - PopularSongsSection: Full component with section wrapper (for standalone use)
 * - PopularSongsContent: Content only (for use in accordion)
 */

import SuggestionSection, { SuggestionSectionContent } from './SuggestionSection';
import { usePopularSongs } from '../hooks/usePopularSongs';

interface PopularSongsSectionProps {
  limit?: number;
}

/**
 * PopularSongsContent - Content without section wrapper
 * For use in accordion or other container layouts
 */
export function PopularSongsContent({ limit = 6 }: PopularSongsSectionProps) {
  const { songs, loading } = usePopularSongs(limit);

  return (
    <SuggestionSectionContent
      songs={songs}
      loading={loading}
      emptyMessage="No popular songs yet"
    />
  );
}

/**
 * PopularSongsSection - Full component with section wrapper
 * For standalone use
 */
export default function PopularSongsSection({ limit = 6 }: PopularSongsSectionProps) {
  const { songs, loading } = usePopularSongs(limit);

  return (
    <SuggestionSection
      title="Popular Songs"
      seeAllLink="/songs?sort=popular"
      songs={songs}
      loading={loading}
      emptyMessage="No popular songs yet"
    />
  );
}
