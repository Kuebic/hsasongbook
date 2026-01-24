/**
 * BrowsePage Component
 *
 * Full song browsing page with filtering and sorting.
 */

import { SimplePageTransition } from '@/features/shared/components/PageTransition';
import Breadcrumbs from '@/features/shared/components/Breadcrumbs';
import SearchBar from '@/features/search/components/SearchBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Music } from 'lucide-react';
import FilterPanel from './FilterPanel';
import SortSelector from './SortSelector';
import SongCardEnhanced from './SongCardEnhanced';
import FilterChips from './FilterChips';
import { useBrowseFilters } from '../hooks/useBrowseFilters';
import { useSongsWithArrangementSummary } from '../hooks/useSongsWithArrangementSummary';

export default function BrowsePage() {
  const { filters, setFilter, clearFilters, activeFilterCount, dateRange } = useBrowseFilters();
  const { songs, loading, totalCount } = useSongsWithArrangementSummary({
    filters,
    dateRange,
    limit: 100,
  });

  const breadcrumbs = [
    { label: 'Home', to: '/' },
    { label: 'Browse Songs' },
  ];

  return (
    <SimplePageTransition>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-6">
            <Breadcrumbs items={breadcrumbs} />
          </div>

          <header className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Browse Songs</h1>
            <p className="text-muted-foreground">
              Discover and filter songs by various criteria
            </p>
          </header>

          {/* Search and Controls */}
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <SearchBar
              value={filters.searchQuery}
              onChange={(value) => setFilter('searchQuery', value)}
              placeholder="Search songs..."
            />

            {/* Filter and Sort Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <FilterPanel
                filters={filters}
                onFilterChange={setFilter}
                onClearFilters={clearFilters}
                activeFilterCount={activeFilterCount}
              />
              <SortSelector
                value={filters.sortBy}
                onChange={(sort) => setFilter('sortBy', sort)}
              />
            </div>

            {/* Active Filter Chips */}
            {activeFilterCount > 0 && (
              <FilterChips
                filters={filters}
                onRemoveFilter={setFilter}
                onClearAll={clearFilters}
              />
            )}
          </div>

          {/* Results Count */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {loading ? (
                'Loading songs...'
              ) : (
                `${totalCount} ${totalCount === 1 ? 'song' : 'songs'} found`
              )}
            </p>
          </div>

          {/* Results Grid */}
          {loading ? (
            <BrowsePageSkeleton />
          ) : songs.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {songs.map((song) => (
                <SongCardEnhanced key={song.id} song={song} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </SimplePageTransition>
  );
}

function BrowsePageSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="p-4 border rounded-lg">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-3" />
          <Skeleton className="h-4 w-full mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No songs found</h3>
      <p className="text-muted-foreground text-sm">
        Try adjusting your filters or search terms
      </p>
    </div>
  );
}
