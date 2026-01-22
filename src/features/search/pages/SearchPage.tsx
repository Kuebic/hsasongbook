import { useState, useEffect, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import SongList from '../components/SongList';
import SearchBar from '../components/SearchBar';
import StatsWidget from '../components/StatsWidget';
import FeaturedArrangementsWidget from '../components/FeaturedArrangementsWidget';
import { SongListSkeleton } from '../../shared/components/LoadingStates';
import { SimplePageTransition } from '../../shared/components/PageTransition';
import type { Song } from '@/types/Song.types';

export function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

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
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              HSA Songbook
            </h1>
            <p className="text-muted-foreground">
              Search and discover worship songs
            </p>
          </header>

          <div className="mb-8">
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
          </div>

          {/* Show widgets only when not searching */}
          {!searchTerm && !isSearching && (
            <>
              <StatsWidget />
              <FeaturedArrangementsWidget limit={6} />
            </>
          )}

          {/* Show search results count and list */}
          {(searchTerm || isSearching) && (
            <>
              <div className="mb-4">
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
            </>
          )}
        </div>
      </div>
    </SimplePageTransition>
  );
}
