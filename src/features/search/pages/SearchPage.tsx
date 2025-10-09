import { useState, useMemo, useEffect } from 'react';
import { searchSongs } from '../../shared/utils/dataHelpers';
import SongList from '../components/SongList';
import SearchBar from '../components/SearchBar';
import { SongListSkeleton } from '../../shared/components/LoadingStates';
import { SimplePageTransition } from '../../shared/components/PageTransition';

export function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const filteredSongs = useMemo(() => {
    return searchSongs(searchTerm);
  }, [searchTerm]);

  // Simulate search delay for better UX
  useEffect(() => {
    if (searchTerm) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [searchTerm]);

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

          {isSearching ? (
            <SongListSkeleton count={6} />
          ) : (
            <SongList songs={filteredSongs} />
          )}
        </div>
      </div>
    </SimplePageTransition>
  );
}
