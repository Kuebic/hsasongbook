/**
 * RecentSongsWidget component
 *
 * Displays recently viewed songs on the homepage.
 * Layout: Horizontal scroll on mobile, grid on desktop.
 */

import { useRecentSongs } from '../hooks/useRecentSongs';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/features/shared/components/LoadingStates';
import { Clock } from 'lucide-react';

interface RecentSongsWidgetProps {
  limit?: number;
}

/**
 * Format lastAccessedAt timestamp to human-readable text
 */
function formatLastViewed(timestamp?: number): string {
  if (!timestamp) return 'Never viewed';
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
}

export default function RecentSongsWidget({ limit = 5 }: RecentSongsWidgetProps) {
  const { recentSongs, loading, error } = useRecentSongs(limit);

  // Loading state
  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recently Viewed</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-64 md:w-auto">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state (silent - don't show error to user)
  if (error) {
    return null;
  }

  // Empty state
  if (recentSongs.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recently Viewed</h2>
        <Card>
          <CardContent className="flex flex-col items-center py-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No recent activity</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start searching for songs to see your recent views here
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Display recent songs
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Recently Viewed</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3 lg:grid-cols-5">
        {recentSongs.map(song => (
          <Link
            key={song.id}
            to={`/song/${song.slug}`}
            className="flex-shrink-0 w-64 md:w-auto"
          >
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base line-clamp-2">
                  {song.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {song.artist || 'Unknown Artist'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatLastViewed(song.lastAccessedAt)}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
