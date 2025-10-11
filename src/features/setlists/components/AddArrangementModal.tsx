/**
 * AddArrangementModal Component
 *
 * Two-step modal for adding arrangements to a setlist:
 * Step 1: Search and select a song
 * Step 2: Select an arrangement for that song
 *
 * Features:
 * - Debounced search input (300ms)
 * - Keyboard navigation (Arrow keys + Enter)
 * - Shows song title, artist
 * - Shows arrangement name, key, rating
 * - Loading and empty states
 * - Auto-focus search input on open
 * - Back button to return to songs list
 *
 * @example
 * ```tsx
 * <AddArrangementModal
 *   open={showModal}
 *   onOpenChange={setShowModal}
 *   onAdd={async (arrangementId, customKey) => {
 *     await addSong(arrangementId, customKey);
 *   }}
 * />
 * ```
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSongSearch } from '../hooks/useSongSearch';
import { useKeyboardNavigation } from '@/features/shared/hooks/useKeyboardNavigation';
import { ArrangementRepository } from '@/features/pwa/db/repository';
import { Search, Loader2, Music, ArrowLeft } from 'lucide-react';
import logger from '@/lib/logger';
import type { Song, Arrangement } from '@/types';

interface AddArrangementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (arrangementId: string, customKey?: string) => void;
}

export function AddArrangementModal({
  open,
  onOpenChange,
  onAdd
}: AddArrangementModalProps) {
  const { query, setQuery, results: songs, isLoading: isLoadingSongs, isEmpty: isEmptySongs } = useSongSearch();

  // Two-step state
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [isLoadingArrangements, setIsLoadingArrangements] = useState(false);

  // Load arrangements when a song is selected
  useEffect(() => {
    if (!selectedSong) {
      setArrangements([]);
      return;
    }

    async function loadArrangements(): Promise<void> {
      try {
        setIsLoadingArrangements(true);
        const repo = new ArrangementRepository();
        const songArrangements = await repo.getBySong(selectedSong.id);
        setArrangements(songArrangements);
        logger.debug('Loaded arrangements for song:', selectedSong.title, songArrangements.length);
      } catch (error) {
        logger.error('Failed to load arrangements:', error);
        setArrangements([]);
      } finally {
        setIsLoadingArrangements(false);
      }
    }

    loadArrangements();
  }, [selectedSong]);

  // Handle song selection (step 1 → step 2)
  const handleSongSelect = (index: number): void => {
    const song = songs[index];
    if (song) {
      setSelectedSong(song);
    }
  };

  // Handle arrangement selection (step 2 → add to setlist)
  const handleArrangementSelect = (index: number): void => {
    const arrangement = arrangements[index];
    if (arrangement) {
      onAdd(arrangement.id, arrangement.key);
      onOpenChange(false); // Close modal
      setSelectedSong(null); // Reset state
      setQuery(''); // Reset search
    }
  };

  // Handle back button (step 2 → step 1)
  const handleBack = (): void => {
    setSelectedSong(null);
  };

  // Keyboard navigation for songs list
  const songsNavigation = useKeyboardNavigation({
    itemCount: songs.length,
    onSelect: handleSongSelect,
    loop: true,
    disabled: isLoadingSongs || isEmptySongs || selectedSong !== null
  });

  // Keyboard navigation for arrangements list
  const arrangementsNavigation = useKeyboardNavigation({
    itemCount: arrangements.length,
    onSelect: handleArrangementSelect,
    loop: true,
    disabled: isLoadingArrangements || selectedSong === null
  });

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedSong(null);
      songsNavigation.setSelectedIndex(-1);
      arrangementsNavigation.setSelectedIndex(-1);
    }
  }, [open, setQuery, songsNavigation, arrangementsNavigation]);

  // Determine which keyboard handler to use
  const currentNavigation = selectedSong ? arrangementsNavigation : songsNavigation;

  // Compute display states
  const isLoading = selectedSong ? isLoadingArrangements : isLoadingSongs;
  const isEmpty = useMemo(() => {
    if (selectedSong) {
      return arrangements.length === 0 && !isLoadingArrangements;
    }
    return isEmptySongs;
  }, [selectedSong, arrangements.length, isLoadingArrangements, isEmptySongs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[80vh] flex flex-col"
        onKeyDown={currentNavigation.handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle>
            {selectedSong ? `Select Arrangement for "${selectedSong.title}"` : 'Add Song to Setlist'}
          </DialogTitle>
          <DialogDescription>
            {selectedSong
              ? 'Choose an arrangement to add to your setlist'
              : 'Search for a song by title or artist'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Search Input - only show in step 1 */}
        {!selectedSong && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by song title or artist..."
              autoFocus
              className="pl-9"
              role="combobox"
              aria-expanded={songs.length > 0}
              aria-controls="search-results"
              aria-activedescendant={
                songsNavigation.selectedIndex >= 0 ? `result-${songsNavigation.selectedIndex}` : undefined
              }
            />
          </div>
        )}

        {/* Back Button - only show in step 2 */}
        {selectedSong && (
          <Button
            variant="ghost"
            onClick={handleBack}
            className="self-start"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Songs
          </Button>
        )}

        {/* Results List */}
        <div
          ref={currentNavigation.containerRef}
          id="search-results"
          role="listbox"
          className="overflow-y-auto flex-1 border rounded-md"
          style={{ minHeight: '300px' }}
        >
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm">
                {selectedSong ? 'Loading arrangements...' : 'Loading songs...'}
              </p>
            </div>
          )}

          {isEmpty && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Music className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">
                {selectedSong ? 'No arrangements found for this song' : 'No songs found'}
              </p>
              {query && !selectedSong && (
                <p className="text-xs mt-1">
                  Try a different search term
                </p>
              )}
            </div>
          )}

          {/* Songs List - Step 1 */}
          {!selectedSong && !isLoadingSongs && !isEmptySongs && (
            <div className="divide-y">
              {songs.map((song, idx) => (
                <div
                  key={song.id}
                  id={`result-${idx}`}
                  data-index={idx}
                  role="option"
                  aria-selected={songsNavigation.selectedIndex === idx}
                  onClick={() => handleSongSelect(idx)}
                  onMouseEnter={() => songsNavigation.setSelectedIndex(idx)}
                  className={`
                    p-4 cursor-pointer transition-colors
                    ${songsNavigation.selectedIndex === idx
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted'
                    }
                  `}
                >
                  <h3 className="font-medium truncate">
                    {song.title}
                  </h3>
                  {song.artist && (
                    <p className="text-sm text-muted-foreground truncate">
                      {song.artist}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Arrangements List - Step 2 */}
          {selectedSong && !isLoadingArrangements && arrangements.length > 0 && (
            <div className="divide-y">
              {arrangements.map((arr, idx) => (
                <div
                  key={arr.id}
                  id={`result-${idx}`}
                  data-index={idx}
                  role="option"
                  aria-selected={arrangementsNavigation.selectedIndex === idx}
                  onClick={() => handleArrangementSelect(idx)}
                  onMouseEnter={() => arrangementsNavigation.setSelectedIndex(idx)}
                  className={`
                    p-4 cursor-pointer transition-colors
                    ${arrangementsNavigation.selectedIndex === idx
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">
                        {arr.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>Key: {arr.key}</span>
                        {arr.tempo > 0 && <span>{arr.tempo} BPM</span>}
                        {arr.capo > 0 && <span>Capo {arr.capo}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-sm">
                      {arr.rating > 0 && (
                        <span className="text-muted-foreground">
                          ★ {arr.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Keyboard Hints */}
        <div className="text-xs text-muted-foreground border-t pt-2">
          <p>
            <kbd className="px-1.5 py-0.5 bg-muted rounded">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-muted rounded ml-1">↓</kbd>
            {' '}Navigate •{' '}
            <kbd className="px-1.5 py-0.5 bg-muted rounded">Enter</kbd>
            {' '}Select •{' '}
            <kbd className="px-1.5 py-0.5 bg-muted rounded">Esc</kbd>
            {' '}Close
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Default export for convenient importing
 */
export default AddArrangementModal;
