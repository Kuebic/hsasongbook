import { useState, useEffect, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import SongList from '../components/SongList';
import SearchBar from '../components/SearchBar';
import StatsWidget from '../components/StatsWidget';
import HeroSection from '../components/HeroSection';
import QuickAccessBar from '../components/QuickAccessBar';
import BrowseByTheme from '../components/BrowseByTheme';
import RecentlyAddedSection from '../components/RecentlyAddedSection';
import PopularSongsSection from '../components/PopularSongsSection';
import { SongListSkeleton } from '../../shared/components/LoadingStates';
import { SimplePageTransition } from '../../shared/components/PageTransition';
import { useAuth } from '@/features/auth/hooks/useAuth';
import AddSongDialog from '@/features/songs/components/AddSongDialog';
import type { Song } from '@/types/Song.types';

export function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [addSongDialogOpen, setAddSongDialogOpen] = useState(false);
  const { user } = useAuth();
  const isAuthenticated = !!(user && !user.isAnonymous);

  // Load all songs from Convex
  const convexSongs = useQuery(api.songs.list);
  const isLoading = convexSongs === undefined;

  // Map Convex songs to frontend Song type
  const allSongs: Song[] = useMemo(() => {
    if (!convexSongs) return [];
    return convexSongs.map((song) => ({
      id: song._id,
      slug: song.slug,
      title: song.title,
      artist: song.artist ?? '',
      themes: song.themes,
      copyright: song.copyright,
      lyrics: song.lyrics ? { en: song.lyrics } : undefined,
      createdAt: new Date(song._creationTime).toISOString(),
      updatedAt: new Date(song._creationTime).toISOString(),
    }));
  }, [convexSongs]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter songs client-side
  const filteredSongs = useMemo(() => {
    if (!debouncedSearchTerm) {
      return allSongs;
    }

    const query = debouncedSearchTerm.toLowerCase();
    return allSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        song.themes?.some((theme) => theme.toLowerCase().includes(query))
    );
  }, [debouncedSearchTerm, allSongs]);

  const isSearching = searchTerm !== debouncedSearchTerm;

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
              <BrowseByTheme limit={6} />
              <RecentlyAddedSection limit={6} />
              <PopularSongsSection limit={6} />
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
