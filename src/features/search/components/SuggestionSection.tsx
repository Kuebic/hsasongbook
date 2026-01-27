/**
 * SuggestionSection Component
 *
 * Reusable section for displaying a list of songs with a header and "See All" link.
 *
 * Exports:
 * - SuggestionSection: Full component with section wrapper (for standalone use)
 * - SuggestionSectionContent: Content only (for use in accordion)
 */

import { Skeleton } from '@/components/ui/skeleton';
import type { Song } from '@/types/Song.types';
import SongList from './SongList';
import SectionHeader from './SectionHeader';

interface SuggestionSectionProps {
  title: string;
  seeAllLink: string;
  songs: Song[];
  loading?: boolean;
  emptyMessage?: string;
}

interface SuggestionSectionContentProps {
  songs: Song[];
  loading?: boolean;
  emptyMessage?: string;
}

/**
 * SuggestionSectionContent - Content without section wrapper
 * For use in accordion or other container layouts
 */
export function SuggestionSectionContent({
  songs,
  loading = false,
  emptyMessage = 'No songs found',
}: SuggestionSectionContentProps) {
  if (loading) {
    return <SuggestionSectionSkeleton />;
  }

  if (songs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {emptyMessage}
      </p>
    );
  }

  return <SongList songs={songs} />;
}

/**
 * SuggestionSection - Full component with section wrapper
 * For standalone use
 */
export default function SuggestionSection({
  title,
  seeAllLink,
  songs,
  loading = false,
  emptyMessage = 'No songs found',
}: SuggestionSectionProps) {
  // Don't render if no songs and not loading
  if (!loading && songs.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <SectionHeader title={title} viewAllLink={seeAllLink} />

      {/* Content */}
      {loading ? (
        <SuggestionSectionSkeleton />
      ) : songs.length > 0 ? (
        <SongList songs={songs} />
      ) : (
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      )}
    </section>
  );
}

function SuggestionSectionSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border rounded-lg">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}
