/**
 * RecentlyAddedSection Component
 *
 * Displays recently added songs on the homepage.
 */

import SuggestionSection from './SuggestionSection';
import { useRecentSongs } from '../hooks/useRecentSongs';

interface RecentlyAddedSectionProps {
  limit?: number;
}

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
