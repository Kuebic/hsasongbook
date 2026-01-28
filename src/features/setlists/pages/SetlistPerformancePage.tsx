/**
 * SetlistPerformancePage
 *
 * Fullscreen performance mode for setlist playback with keyboard navigation.
 * Features: ChordPro viewer, fullscreen support, arrow key navigation, progress tracking.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useRef, useEffect } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  const { setlist, arrangements, loading, error } = useSetlistData(setlistId);
  const { isOnline } = useOnlineStatus();

  // Convert arrangements map to array in setlist order
  const arrangementArray = setlist?.songs
    .map(song => arrangements.get(song.arrangementId))
    .filter((arr): arr is Arrangement => arr !== undefined) || [];

  const {
    currentIndex,
    currentArrangement,
    nextArrangement,
    previousArrangement
  } = usePerformanceMode(containerRef, {
    arrangements: arrangementArray,
    initialIndex: parseInt(arrangementIndex || '0', 10),
    onExit: () => navigate(`/setlist/${setlistId}`),
    autoFullscreen: true // Auto-enter fullscreen on load
  });

  // Add swipe navigation
  useSwipeNavigation(containerRef, {
    onSwipeLeft: nextArrangement,
    onSwipeRight: previousArrangement,
    enabled: true
  });

  // Get the current setlist song to access customKey
  const currentSetlistSong = setlist?.songs[currentIndex];

  // Sync URL with current index
  useEffect(() => {
    if (setlistId) {
      navigate(`/setlist/${setlistId}/performance/${currentIndex}`, { replace: true });
    }
  }, [currentIndex, setlistId, navigate]);

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
        onExit={() => navigate(`/setlist/${setlistId}`)}
      >
        {currentArrangement && (
          <ChordProViewer
            content={currentArrangement.chordProContent}
            arrangementMetadata={{
              key: currentSetlistSong?.customKey || currentArrangement.key,
              tempo: currentArrangement.tempo,
              capo: currentArrangement.capo,
              timeSignature: currentArrangement.timeSignature
            }}
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
