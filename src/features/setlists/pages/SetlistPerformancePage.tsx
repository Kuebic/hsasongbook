/**
 * SetlistPerformancePage
 *
 * Fullscreen performance mode for setlist playback with keyboard navigation.
 * Features: ChordPro viewer, fullscreen support, arrow key navigation, progress tracking.
 */

import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useRef, useEffect, useMemo } from 'react';
import { usePerformanceMode } from '../hooks/usePerformanceMode';
import { useSetlistData } from '../hooks/useSetlistData';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { useOnlineStatus } from '@/features/pwa/hooks/useOnlineStatus';
import ChordProViewer from '@/features/chordpro';
import PerformanceLayout from '../components/PerformanceLayout';
import { PageSpinner } from '@/features/shared/components/LoadingStates';
import type { Arrangement } from '@/types';

export function SetlistPerformancePage() {
  const { setlistId, arrangementIndex = '0' } = useParams<{
    setlistId: string;
    arrangementIndex?: string;
  }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);

  const { setlist, arrangements, loading, error } = useSetlistData(setlistId);

  // Parse temporary key overrides from URL (for viewers who set session-only keys)
  const tempKeyOverrides = useMemo(() => {
    const tempKeysParam = searchParams.get('tempKeys');
    if (!tempKeysParam) return new Map<string, string>();
    const map = new Map<string, string>();
    try {
      tempKeysParam.split(',').forEach(entry => {
        const [id, key] = entry.split(':');
        if (id && key) map.set(id, key);
      });
    } catch {
      // Invalid format, ignore
    }
    return map;
  }, [searchParams]);

  // Build exit URL that preserves temp keys
  const exitUrl = useMemo(() => {
    const tempKeysParam = searchParams.get('tempKeys');
    return `/setlist/${setlistId}${tempKeysParam ? `?tempKeys=${encodeURIComponent(tempKeysParam)}` : ''}`;
  }, [setlistId, searchParams]);
  const { isOnline } = useOnlineStatus();

  // Build array of valid songs (with their arrangements) in setlist order
  // This preserves the relationship between setlist song data (customKey) and arrangement data
  const setlistSongs = setlist?.songs ?? [];
  const validSongsWithArrangements = setlistSongs
    .map(song => {
      const arrangement = arrangements.get(song.arrangementId);
      return arrangement ? { song, arrangement } : null;
    })
    .filter((item): item is { song: (typeof setlistSongs)[0]; arrangement: Arrangement } =>
      item !== null
    );

  // Extract just the arrangements for usePerformanceMode
  const arrangementArray = validSongsWithArrangements.map(item => item.arrangement);

  const {
    currentIndex,
    currentArrangement,
    nextArrangement,
    previousArrangement
  } = usePerformanceMode(containerRef, {
    arrangements: arrangementArray,
    initialIndex: parseInt(arrangementIndex || '0', 10),
    onExit: () => navigate(exitUrl),
    autoFullscreen: true // Auto-enter fullscreen on load
  });

  // Add swipe navigation
  useSwipeNavigation(containerRef, {
    onSwipeLeft: nextArrangement,
    onSwipeRight: previousArrangement,
    enabled: true
  });

  // Get the current setlist song from the filtered array to access customKey
  // This ensures currentIndex correctly maps to the song data
  const currentSetlistSong = validSongsWithArrangements[currentIndex]?.song;

  // Determine the effective key: temp override > persisted customKey > arrangement default
  const effectiveCustomKey = useMemo(() => {
    if (!currentSetlistSong) return currentArrangement?.key;
    // Check for temporary key override first (from URL params)
    const tempKey = tempKeyOverrides.get(currentSetlistSong.arrangementId);
    if (tempKey) return tempKey;
    // Fall back to persisted customKey or arrangement default
    return currentSetlistSong.customKey || currentArrangement?.key;
  }, [currentSetlistSong, tempKeyOverrides, currentArrangement?.key]);

  // Sync URL with current index (preserve query params like tempKeys)
  useEffect(() => {
    if (setlistId) {
      const search = searchParams.toString();
      const url = `/setlist/${setlistId}/performance/${currentIndex}${search ? `?${search}` : ''}`;
      navigate(url, { replace: true });
    }
  }, [currentIndex, setlistId, navigate, searchParams]);

  if (loading) return <PageSpinner message="Loading performance mode..." />;
  if (error || !setlist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">{error || 'Setlist not found'}</p>
      </div>
    );
  }

  if (arrangementArray.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No songs in this setlist</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Setlist performance mode"
      className="performance-mode-container"
    >
      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-sm text-center fixed top-0 left-0 right-0 z-50">
          Offline mode - viewing cached version
        </div>
      )}

      {/* Screen reader instructions */}
      <div className="sr-only">
        Use arrow keys to navigate between arrangements.
        Swipe left or right to change songs.
        Press Escape to exit performance mode.
      </div>

      <PerformanceLayout
        currentIndex={currentIndex}
        total={arrangementArray.length}
        canGoPrevious={currentIndex > 0}
        canGoNext={currentIndex < arrangementArray.length - 1}
        onPrevious={previousArrangement}
        onNext={nextArrangement}
        onExit={() => navigate(exitUrl)}
      >
        {currentArrangement && (
          <ChordProViewer
            content={currentArrangement.chordProContent}
            arrangementMetadata={{
              key: effectiveCustomKey ?? currentArrangement.key ?? '',
              tempo: currentArrangement.tempo,
              capo: currentArrangement.capo,
              timeSignature: currentArrangement.timeSignature
            }}
            originalArrangementKey={currentArrangement.key}
            showChords={true}
            showToggle={false}
            showTranspose={false}
            performanceMode={true}
          />
        )}
      </PerformanceLayout>
    </div>
  );
}
