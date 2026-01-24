/**
 * SuggestionSection Component
 *
 * Reusable section for displaying a list of songs with a header and "See All" link.
 */

import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Song } from '@/types/Song.types';
import SongList from './SongList';

interface SuggestionSectionProps {
  title: string;
  seeAllLink: string;
  songs: Song[];
  loading?: boolean;
  emptyMessage?: string;
}

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
    <section className="mb-8">
      {/* Header with title and See All link */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link
          to={seeAllLink}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          See all
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

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
