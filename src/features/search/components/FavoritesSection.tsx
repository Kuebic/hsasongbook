/**
 * FavoritesSection Component
 *
 * Displays the user's favorited arrangements in a horizontal scroll.
 * Only shown for authenticated users who have favorites.
 */

import type { CSSProperties } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import { HorizontalScrollSection, HorizontalScrollItem } from '@/features/shared/components/HorizontalScrollSection';
import { CompactArrangementCard } from './CompactArrangementCard';
import { Heart } from 'lucide-react';

interface FavoritesSectionProps {
  limit?: number;
  isAuthenticated?: boolean;
}

export function FavoritesSection({ limit = 6, isAuthenticated }: FavoritesSectionProps) {
  const favorites = useQuery(
    api.favorites.getUserFavoriteArrangements,
    isAuthenticated ? {} : 'skip'
  );
  const isLoading = favorites === undefined;

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Don't render if no favorites
  if (!isLoading && (!favorites || favorites.length === 0)) {
    return null;
  }

  // Limit the results
  const limitedFavorites = favorites?.slice(0, limit);

  return (
    <HorizontalScrollSection title="Your Favorites" viewAllLink="/profile#favorites">
      {isLoading ? (
        <FavoritesSkeleton />
      ) : (
        limitedFavorites?.map((item, index) => (
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
              timestamp={item.favoritedAt}
              isAuthenticated={isAuthenticated}
            />
          </HorizontalScrollItem>
        ))
      )}
    </HorizontalScrollSection>
  );
}

function FavoritesSkeleton() {
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
              <Heart className="h-3 w-3 text-muted-foreground/30" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </HorizontalScrollItem>
      ))}
    </>
  );
}

export default FavoritesSection;
