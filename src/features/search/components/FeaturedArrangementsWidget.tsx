/**
 * FeaturedArrangementsWidget component
 *
 * Displays featured arrangements (highest rated + most popular)
 * on the homepage using the existing ArrangementCard component.
 */

import { useFeaturedArrangements } from '../hooks/useFeaturedArrangements';
import ArrangementCard from '@/features/arrangements/components/ArrangementCard';
import { ArrangementCardSkeleton } from '@/features/shared/components/LoadingStates';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

interface FeaturedArrangementsWidgetProps {
  limit?: number;
}

export default function FeaturedArrangementsWidget({ limit = 6 }: FeaturedArrangementsWidgetProps) {
  const { featured, loading, error } = useFeaturedArrangements(limit);

  // Loading state
  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Featured Arrangements</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ArrangementCardSkeleton key={i} />
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
  if (featured.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Featured Arrangements</h2>
        <Card>
          <CardContent className="flex flex-col items-center py-8 text-center">
            <Star className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No featured arrangements yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add some ratings and favorites to see featured content here
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Display featured arrangements
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Featured Arrangements</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map(arrangement => (
          <ArrangementCard
            key={arrangement.id}
            arrangement={arrangement}
            // No songSlug prop needed - arrangement has embedded song data
          />
        ))}
      </div>
    </div>
  );
}
