/**
 * RecentlyViewedSection Component
 *
 * Displays the user's recently viewed arrangements in a horizontal scroll.
 * Only shown for authenticated users.
 */

import type { CSSProperties } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import { HorizontalScrollSection, HorizontalScrollItem } from '@/features/shared/components/HorizontalScrollSection';
import { CompactArrangementCard } from './CompactArrangementCard';
import { Clock } from 'lucide-react';

interface RecentlyViewedSectionProps {
  limit?: number;
  isAuthenticated?: boolean;
}

export function RecentlyViewedSection({ limit = 6, isAuthenticated }: RecentlyViewedSectionProps) {
  const recentViews = useQuery(
    api.userViews.getRecentViews,
    isAuthenticated ? { limit } : 'skip'
  );
  const isLoading = recentViews === undefined;

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Don't render if no recent views
  if (!isLoading && (!recentViews || recentViews.length === 0)) {
    return null;
  }

  return (
    <HorizontalScrollSection title="Recently Viewed" viewAllLink="/profile">
      {isLoading ? (
        <RecentlyViewedSkeleton />
      ) : (
        recentViews?.map((item, index) => (
          <HorizontalScrollItem
            key={item._id}
            className="animate-in fade-in-0 slide-in-from-right-2"
            style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' } as CSSProperties}
          >
            <CompactArrangementCard
              arrangement={{
                _id: item._id,
                name: item.name,
                slug: item.slug,
                key: item.key,
                favorites: item.favorites,
              }}
              song={{
                _id: item.song._id,
                title: item.song.title,
                artist: item.song.artist,
                slug: item.song.slug,
              }}
              timestamp={item.viewedAt}
              isAuthenticated={isAuthenticated}
            />
          </HorizontalScrollItem>
        ))
      )}
    </HorizontalScrollSection>
  );
}

function RecentlyViewedSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <HorizontalScrollItem key={i}>
          <div className="rounded-xl border border-border bg-card p-4 w-[280px]">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-3" />
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-12 rounded-md" />
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground/30" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </HorizontalScrollItem>
      ))}
    </>
  );
}

export default RecentlyViewedSection;
