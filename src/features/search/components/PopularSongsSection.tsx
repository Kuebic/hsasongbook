/**
 * PopularSongsSection Component
 *
 * Displays popular songs (by arrangement count) on the homepage.
 */

import SuggestionSection from './SuggestionSection';
import { usePopularSongs } from '../hooks/usePopularSongs';

interface PopularSongsSectionProps {
  limit?: number;
}

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
