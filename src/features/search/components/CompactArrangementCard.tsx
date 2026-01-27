/**
 * CompactArrangementCard Component
 *
 * A compact card for displaying arrangements in horizontal scroll sections.
 * Shows essential info: song title, artist, arrangement name, key, and relative time.
 * Includes "Add to Setlist" action on hover/tap.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Music, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AddToSetlistDialog } from '@/features/setlists/components/AddToSetlistDialog';
import FavoriteButton from '@/features/shared/components/FavoriteButton';
import type { Id } from '../../../../convex/_generated/dataModel';

interface CompactArrangementCardProps {
  arrangement: {
    _id: Id<'arrangements'>;
    name: string;
    slug: string;
    key?: string;
    favorites?: number;
  };
  song: {
    _id: Id<'songs'>;
    title: string;
    artist?: string;
    slug: string;
  };
  /** Optional timestamp for "viewed at" or "favorited at" display */
  timestamp?: number;
  /** Whether user is authenticated (shows Add to Setlist) */
  isAuthenticated?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Format relative time (e.g., "2h ago", "Yesterday", "3 days ago")
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }
  if (days > 1) return `${days} days ago`;
  if (days === 1) return 'Yesterday';
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export function CompactArrangementCard({
  arrangement,
  song,
  timestamp,
  isAuthenticated,
  className,
}: CompactArrangementCardProps) {
  const [showAddToSetlist, setShowAddToSetlist] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const arrangementUrl = `/song/${song.slug}/${arrangement.slug}`;

  return (
    <>
      <Link
        to={arrangementUrl}
        className={cn(
          'block rounded-xl border border-border bg-card p-4 transition-all duration-200',
          'hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col gap-2 min-w-0">
          {/* Song title */}
          <h3 className="font-semibold text-foreground line-clamp-1">{song.title}</h3>

          {/* Artist */}
          {song.artist && (
            <p className="text-sm text-muted-foreground line-clamp-1">{song.artist}</p>
          )}

          {/* Arrangement name + key */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground line-clamp-1 flex-1 min-w-0">
              {arrangement.name}
            </span>
            {arrangement.key && (
              <Badge variant="secondary" className="text-xs font-medium shrink-0">
                <Music className="h-3 w-3 mr-1" />
                {arrangement.key}
              </Badge>
            )}
          </div>

          {/* Bottom row: timestamp + actions */}
          <div className="flex items-center justify-between gap-2 mt-1">
            {timestamp && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(timestamp)}
              </span>
            )}

            {/* Actions: Favorite + Add to Setlist */}
            <div className="flex items-center gap-1 ml-auto">
              <FavoriteButton
                targetType="arrangement"
                targetId={arrangement._id}
                count={arrangement.favorites || 0}
                size="sm"
              />

              {/* Add to Setlist button - visible on hover/tap */}
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-7 px-2 text-xs gap-1 transition-opacity',
                    isHovered ? 'opacity-100' : 'opacity-0 md:opacity-0'
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAddToSetlist(true);
                  }}
                >
                  <Plus className="h-3 w-3" />
                  Add to Set
                </Button>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Add to Setlist Dialog */}
      {isAuthenticated && (
        <AddToSetlistDialog
          arrangementId={arrangement._id}
          arrangementName={arrangement.name}
          songTitle={song.title}
          open={showAddToSetlist}
          onOpenChange={setShowAddToSetlist}
        />
      )}
    </>
  );
}

export default CompactArrangementCard;
