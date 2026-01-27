/**
 * BrowseByOrigin Component
 *
 * Displays origin category cards for browsing songs by origin.
 * Uses the new getOriginsWithCounts query.
 */

import type { ElementType } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Music, BookOpen, Sparkles, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOriginLabel } from '@/features/songs/validation/songSchemas';

interface BrowseByOriginProps {
  limit?: number;
}

// Icon mapping for origins
const originIcons: Record<string, ElementType> = {
  'traditional-holy-songs': BookOpen,
  'new-holy-songs': Music,
  'pioneer-songs': Globe,
  'original': Sparkles,
  'traditional-hymns': BookOpen,
  'contemporary-christian': Music,
  'secular-songs': Music,
};

// Color classes for origins (subtle backgrounds)
const originColors: Record<string, string> = {
  'traditional-holy-songs': 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50',
  'new-holy-songs': 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50',
  'pioneer-songs': 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/50',
  'original': 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800/50',
  'traditional-hymns': 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/50',
  'contemporary-christian': 'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800/50',
  'secular-songs': 'bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800/50',
};

function OriginCard({ origin, count }: { origin: string; count: number }) {
  const Icon = originIcons[origin] || Music;
  const colorClass = originColors[origin] || 'bg-muted border-border';
  const label = getOriginLabel(origin) || origin;

  return (
    <Link
      to={`/songs?origin=${encodeURIComponent(origin)}`}
      className={cn(
        'flex items-center gap-3 p-4 rounded-xl border transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5 hover:border-primary/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        colorClass
      )}
    >
      <div className="p-2 rounded-lg bg-background/60">
        <Icon className="h-5 w-5 text-foreground/70" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground truncate">{label}</h3>
        <p className="text-sm text-muted-foreground">
          {count} song{count !== 1 ? 's' : ''}
        </p>
      </div>
    </Link>
  );
}

export function BrowseByOrigin({ limit = 6 }: BrowseByOriginProps) {
  const origins = useQuery(api.songs.getOriginsWithCounts, { limit });
  const isLoading = origins === undefined;

  // Don't render if no origins available
  if (!isLoading && (!origins || origins.length === 0)) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-headline text-foreground">Browse by Origin</h2>
      </div>

      {isLoading ? (
        <BrowseByOriginSkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {origins.map((item, index) => (
            <div
              key={item.origin}
              className="animate-in fade-in-0 slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
            >
              <OriginCard origin={item.origin} count={item.count} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function BrowseByOriginSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card"
        >
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default BrowseByOrigin;
