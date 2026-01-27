/**
 * BrowseByStyle Component
 *
 * Displays style/genre chips for browsing arrangements by style.
 * Uses clickable chips that link to the browse page with style filter.
 */

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getStyleOption } from '@/features/shared/utils/tagConstants';

interface BrowseByStyleProps {
  limit?: number;
}

export function BrowseByStyle({ limit = 10 }: BrowseByStyleProps) {
  const styles = useQuery(api.arrangements.getStylesWithCounts, { limit });
  const isLoading = styles === undefined;

  // Don't render if no styles available
  if (!isLoading && (!styles || styles.length === 0)) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-headline text-foreground">Browse by Style</h2>
      </div>

      {isLoading ? (
        <BrowseByStyleSkeleton />
      ) : (
        <div className="flex flex-wrap gap-2">
          {styles.map((item, index) => {
            const styleOption = getStyleOption(item.style);
            const label = styleOption?.label || item.style;

            return (
              <Link
                key={item.style}
                to={`/songs?style=${encodeURIComponent(item.style)}`}
                className="animate-in fade-in-0 slide-in-from-bottom-1"
                style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
              >
                <Badge
                  variant="secondary"
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium cursor-pointer transition-all duration-200',
                    'hover:bg-primary hover:text-primary-foreground hover:scale-105',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  )}
                >
                  {label}
                  <span className="ml-1.5 text-xs opacity-70">({item.count})</span>
                </Badge>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

function BrowseByStyleSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-8 w-24 rounded-full" />
      ))}
    </div>
  );
}

export default BrowseByStyle;
