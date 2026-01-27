import { useState, useMemo } from 'react';
import SongList from '../components/SongList';
import SearchBar from '../components/SearchBar';
import StatsWidget from '../components/StatsWidget';
import HeroSection from '../components/HeroSection';
import QuickAccessBar from '../components/QuickAccessBar';
import { DiscoveryAccordion } from '../components/DiscoveryAccordion';
import { SongListSkeleton } from '../../shared/components/LoadingStates';
import { SimplePageTransition } from '../../shared/components/PageTransition';
import { useFuzzySearch } from '@/features/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';
import AddSongDialog from '@/features/songs/components/AddSongDialog';

export function SearchPage() {
  const [addSongDialogOpen, setAddSongDialogOpen] = useState(false);
  const { user } = useAuth();
  const isAuthenticated = !!(user && !user.isAnonymous);

  // Fuzzy search with debouncing
  const {
    query: searchTerm,
    setQuery: setSearchTerm,
    results: fuzzyResults,
    isLoading,
    isSearching,
  } = useFuzzySearch('');

  // Extract songs from fuzzy results
  const filteredSongs = useMemo(() => {
    return fuzzyResults.map((r) => r.item);
  }, [fuzzyResults]);

  return (
    <SimplePageTransition>
      <div className="min-h-screen bg-background">
        {/* Hero Section with Search */}
        <HeroSection
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onAddSongClick={() => setAddSongDialogOpen(true)}
          isAuthenticated={isAuthenticated}
        />

        {/* Add Song Dialog */}
        <AddSongDialog open={addSongDialogOpen} onOpenChange={setAddSongDialogOpen} />

        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Show discovery sections when not searching */}
          {!searchTerm && !isSearching && (
            <>
              <QuickAccessBar isAuthenticated={isAuthenticated} />
              <div className="mb-8">
                <DiscoveryAccordion limit={6} />
              </div>
              <StatsWidget />
            </>
          )}

          {/* Show search results count and list */}
          {(searchTerm || isSearching) && (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-headline text-foreground">
                    Search Results
                  </h2>
                  <span className="flex-1 h-px bg-border" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {isSearching ? (
                    'Searching...'
                  ) : (
                    `${filteredSongs.length} ${filteredSongs.length === 1 ? 'song' : 'songs'} found`
                  )}
                </p>
              </div>

              {isLoading || isSearching ? (
                <SongListSkeleton count={6} />
              ) : (
                <SongList songs={filteredSongs} />
              )}

              {/* Show simplified search bar at bottom for refinement */}
              <div className="mt-12 pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Refine your search
                </p>
                <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  compact
                />
              </div>
            </>
          )}
        </div>
      </div>
    </SimplePageTransition>
  );
}
