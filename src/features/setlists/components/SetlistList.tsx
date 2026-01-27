/**
 * SetlistList Component
 *
 * Container component for displaying a list of setlists with sorting,
 * loading states, and empty state handling.
 * Pattern: Follows ArrangementList.tsx
 */

import { useState, useMemo } from 'react';
import SetlistCard from './SetlistCard';
import SortSelector from '@/features/shared/components/SortSelector';
import { Card, CardContent } from '@/components/ui/card';
import { ListMusic } from 'lucide-react';
import { sortSetlists } from '../utils/setlistSorter';
import { SETLIST_SORT_OPTIONS } from '../types';
import type { Setlist, SetlistSortOption } from '../types';

interface SetlistListProps {
  setlists: Setlist[];
  isLoading?: boolean;
  isOwnerView?: boolean;
}

export default function SetlistList({
  setlists,
  isLoading = false,
  isOwnerView = true
}: SetlistListProps) {
  const [sortBy, setSortBy] = useState<SetlistSortOption['value']>('recent');

  const sortedSetlists = useMemo(() => {
    if (!setlists || setlists.length === 0) return [];
    return sortSetlists(setlists, sortBy);
  }, [setlists, sortBy]);

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="h-7 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-36 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-64">
              <CardContent className="p-6 space-y-3">
                <div className="h-6 bg-muted animate-pulse rounded" />
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="space-y-2 mt-4">
                  <div className="h-8 bg-muted animate-pulse rounded" />
                  <div className="h-8 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!setlists || setlists.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ListMusic className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Setlists Yet</h3>
          <p className="text-muted-foreground text-sm">
            Create your first setlist to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Sort controls - mobile responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h3 className="text-lg font-medium">
          Your Setlists ({setlists.length})
        </h3>
        <SortSelector
          value={sortBy}
          onChange={setSortBy}
          options={Object.values(SETLIST_SORT_OPTIONS)}
        />
      </div>

      {/* Setlist grid - responsive */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {sortedSetlists.map(setlist => (
          <SetlistCard
            key={setlist.id}
            setlist={setlist}
            isOwner={isOwnerView}
            showPrivacyBadge={isOwnerView}
          />
        ))}
      </div>
    </div>
  );
}
