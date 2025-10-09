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
import ChordProViewer from '@/features/chordpro';
import PerformanceControls from '../components/PerformanceControls';
import PerformanceProgressBar from '../components/PerformanceProgressBar';
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

  // Convert arrangements map to array in setlist order
  const arrangementArray = setlist?.songs
    .map(song => arrangements.get(song.arrangementId))
    .filter((arr): arr is Arrangement => arr !== undefined) || [];

  const {
    currentIndex,
    currentArrangement,
    isFullscreen,
    nextArrangement,
    previousArrangement,
    goToArrangement,
    toggleFullscreen
  } = usePerformanceMode(containerRef, {
    arrangements: arrangementArray,
    initialIndex: parseInt(arrangementIndex || '0', 10),
    onExit: () => navigate(`/setlist/${setlistId}`)
  });

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
      className="performance-mode-container min-h-screen bg-background"
    >
      {/* Screen reader instructions */}
      <div className="sr-only">
        Use arrow keys to navigate between arrangements.
        Press F to toggle fullscreen.
        Press Escape to exit performance mode.
      </div>

      <PerformanceControls
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onExit={() => navigate(`/setlist/${setlistId}`)}
        canGoNext={currentIndex < arrangementArray.length - 1}
        canGoPrevious={currentIndex > 0}
        onNext={nextArrangement}
        onPrevious={previousArrangement}
      />

      <PerformanceProgressBar
        currentIndex={currentIndex}
        total={arrangementArray.length}
        onNavigate={goToArrangement}
      />

      {currentArrangement && (
        <div className="performance-content p-8">
          <ChordProViewer
            content={currentArrangement.chordProContent}
            arrangementMetadata={{
              key: currentArrangement.key,
              tempo: currentArrangement.tempo,
              capo: currentArrangement.capo,
              timeSignature: currentArrangement.timeSignature
            }}
            showChords={true}
            showToggle={false}
            showTranspose={true}
          />
        </div>
      )}
    </div>
  );
}
