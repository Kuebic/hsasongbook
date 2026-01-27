import { useState, useMemo } from 'react';
import SongList from '../components/SongList';
import SearchBar from '../components/SearchBar';
import StatsWidget from '../components/StatsWidget';
import HeroSection from '../components/HeroSection';
import { SongListSkeleton } from '../../shared/components/LoadingStates';
import { SimplePageTransition } from '../../shared/components/PageTransition';
import { useFuzzySearch } from '@/features/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';
import AddSongDialog from '@/features/songs/components/AddSongDialog';

// New section components
import { RecentlyViewedSection } from '../components/RecentlyViewedSection';
import { FavoritesSection } from '../components/FavoritesSection';
import BrowseByTheme from '../components/BrowseByTheme';
import PopularSongsSection from '../components/PopularSongsSection';
import { default as RecentlyAddedSection } from '../components/RecentlyAddedSection';
import { BrowseByOrigin } from '../components/BrowseByOrigin';
import { BrowseByStyle } from '../components/BrowseByStyle';
import { SignInCTA } from '../components/SignInCTA';

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
              {/* Authenticated user layout */}
              {isAuthenticated ? (
                <>
                  {/* 1. Recently Viewed - personal context first */}
                  <RecentlyViewedSection limit={6} isAuthenticated={isAuthenticated} />

                  {/* 2. Favorites - quick access to saved items */}
                  <FavoritesSection limit={6} isAuthenticated={isAuthenticated} />

                  {/* 3. Browse by Theme - primary discovery */}
                  <BrowseByTheme limit={8} />

                  {/* 4. Popular Songs - social proof */}
                  <PopularSongsSection limit={6} />

                  {/* 5. Recently Added - fresh content */}
                  <RecentlyAddedSection limit={6} />

                  {/* 6. Browse by Origin - categorical browsing */}
                  <BrowseByOrigin limit={6} />

                  {/* 7. Browse by Style - genre discovery */}
                  <BrowseByStyle limit={10} />

                  {/* 8. Stats Widget - community engagement */}
                  <StatsWidget />
                </>
              ) : (
                /* Anonymous user layout */
                <>
                  {/* 1. Popular Songs - lead with social proof */}
                  <PopularSongsSection limit={6} />

                  {/* 2. Browse by Theme - primary discovery */}
                  <BrowseByTheme limit={8} />

                  {/* 3. Recently Added - fresh content */}
                  <RecentlyAddedSection limit={6} />

                  {/* 4. Browse by Origin - categorical browsing */}
                  <BrowseByOrigin limit={6} />

                  {/* 5. Browse by Style - genre discovery */}
                  <BrowseByStyle limit={10} />

                  {/* 6. Sign-in CTA - encourage account creation */}
                  <SignInCTA className="mb-8" />

                  {/* 7. Stats Widget - community stats */}
                  <StatsWidget />
                </>
              )}
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
