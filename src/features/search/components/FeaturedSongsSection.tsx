/**
 * FeaturedSongsSection Component
 *
 * Displays curated/featured songs on the homepage.
 * Uses a hardcoded list of song slugs (admin UI to be added later).
 */

import SuggestionSection from './SuggestionSection';
import { useFeaturedSongs, FEATURED_SONG_SLUGS } from '../hooks/useFeaturedSongs';

export default function FeaturedSongsSection() {
  const { songs, loading, hasFeatured } = useFeaturedSongs();

  // Don't render if no featured songs are configured
  if (!hasFeatured) {
    return null;
  }

  return (
    <SuggestionSection
      title="Featured Songs"
      seeAllLink="/songs"
      songs={songs}
      loading={loading}
      emptyMessage="Featured songs coming soon"
    />
  );
}

// Re-export for convenience
export { FEATURED_SONG_SLUGS };
