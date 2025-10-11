import { useState, useEffect } from 'react';
import { SongRepository } from '../../pwa/db/repository';
import SongList from '../components/SongList';
import SearchBar from '../components/SearchBar';
import { SongListSkeleton } from '../../shared/components/LoadingStates';
import { SimplePageTransition } from '../../shared/components/PageTransition';
import type { Song } from '@/types/Song.types';

export function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all songs from IndexedDB on mount
  useEffect(() => {
    const loadSongs = async () => {
      try {
        setIsLoading(true);
        const songRepo = new SongRepository();
        const songs = await songRepo.getAll();
        setAllSongs(songs);
        setFilteredSongs(songs);
      } catch (error) {
        console.error('Failed to load songs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSongs();
  }, []);

  // Filter songs when search term changes
  useEffect(() => {
    if (!searchTerm) {
      setFilteredSongs(allSongs);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      const query = searchTerm.toLowerCase();
      const filtered = allSongs.filter(
        (song) =>
          song.title.toLowerCase().includes(query) ||
          song.artist.toLowerCase().includes(query) ||
          song.themes?.some((theme) => theme.toLowerCase().includes(query))
      );
      setFilteredSongs(filtered);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, allSongs]);

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
        </div>
      </div>
    </SimplePageTransition>
  );
}
