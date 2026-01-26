/**
 * YouTubePip Component
 *
 * A floating picture-in-picture YouTube player that persists across page navigation.
 * Uses the YouTube IFrame API for programmatic control (play, pause, seek).
 */

/* eslint-disable no-undef */ // YT is a global from YouTube IFrame API

import { useEffect, useRef, useId } from 'react';
import { Button } from '@/components/ui/button';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudioPlayer, type YouTubePipSize } from '../context/AudioPlayerContext';
import { useYouTubeAPI } from '../hooks/useYouTubeAPI';

// PiP size configurations (16:9 aspect ratio)
const PIP_SIZES: Record<YouTubePipSize, { width: number; height: number }> = {
  small: { width: 160, height: 90 },
  medium: { width: 280, height: 158 },
  large: { width: 400, height: 225 },
};

// Size cycle order for toggle
const SIZE_ORDER: YouTubePipSize[] = ['small', 'medium', 'large'];

export default function YouTubePip() {
  const {
    track,
    isVisible,
    youtubePipSize,
    registerYouTubePlayer,
    unregisterYouTubePlayer,
    setYoutubePipSize,
    setYouTubeDuration,
    setYouTubeIsPlaying,
    close,
  } = useAudioPlayer();

  const { isReady: isAPIReady, YT } = useYouTubeAPI();
  const playerContainerId = useId().replace(/:/g, '-');
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine if we should show the player
  const isYouTubeTrack = track?.mediaType === 'youtube';
  const videoId = isYouTubeTrack ? track.youtubeVideoId : null;
  const shouldRender = isYouTubeTrack && isVisible && videoId;

  // Initialize YouTube player when API is ready
  useEffect(() => {
    if (!shouldRender || !isAPIReady || !YT || !videoId) return;

    // Small delay to ensure container is in DOM
    const timeoutId = setTimeout(() => {
      const container = document.getElementById(playerContainerId);
      if (!container) return;

      // Destroy existing player if any
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore errors during cleanup
        }
        playerRef.current = null;
      }

      // Create new player
      playerRef.current = new YT.Player(playerContainerId, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          enablejsapi: 1,
        },
        events: {
          onReady: (event: YT.OnReadyEvent) => {
            registerYouTubePlayer(event.target);
            // Get duration when ready
            const dur = event.target.getDuration();
            if (dur > 0) {
              setYouTubeDuration(dur);
            }
          },
          onStateChange: (event: YT.OnStateChangeEvent) => {
            // Map YouTube player states to isPlaying
            const state = event.data;
            if (state === YT.PlayerState.PLAYING) {
              setYouTubeIsPlaying(true);
              // Update duration in case it wasn't available on ready
              const dur = event.target.getDuration();
              if (dur > 0) {
                setYouTubeDuration(dur);
              }
            } else if (
              state === YT.PlayerState.PAUSED ||
              state === YT.PlayerState.ENDED
            ) {
              setYouTubeIsPlaying(false);
            }
          },
          onError: () => {
            setYouTubeIsPlaying(false);
          },
        },
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore errors during cleanup
        }
        playerRef.current = null;
        unregisterYouTubePlayer();
      }
    };
  }, [
    shouldRender,
    isAPIReady,
    YT,
    videoId,
    playerContainerId,
    registerYouTubePlayer,
    unregisterYouTubePlayer,
    setYouTubeDuration,
    setYouTubeIsPlaying,
  ]);

  // Don't render if conditions aren't met
  if (!shouldRender || !track) {
    return null;
  }

  const size = PIP_SIZES[youtubePipSize];

  // Handle size toggle (cycle through sizes)
  const handleSizeToggle = () => {
    const currentIndex = SIZE_ORDER.indexOf(youtubePipSize);
    const nextIndex = (currentIndex + 1) % SIZE_ORDER.length;
    setYoutubePipSize(SIZE_ORDER[nextIndex]);
  };

  // Get size icon based on current size
  const SizeIcon = youtubePipSize === 'large' ? Minimize2 : Maximize2;

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed right-4 bg-black rounded-lg overflow-hidden shadow-2xl transition-all duration-200 no-print',
        // Position above mobile nav (64px) + player bar (~80px) + margin
        'bottom-[168px] md:bottom-[96px]',
        // Z-index just below player bar
        'z-[1024]'
      )}
      style={{
        width: size.width,
        height: size.height,
      }}
    >
      {/* YouTube player container */}
      <div id={playerContainerId} className="w-full h-full" />

      {/* Control overlay (appears on hover) */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40',
          'opacity-0 hover:opacity-100 transition-opacity duration-200',
          'flex flex-col justify-between p-2'
        )}
      >
        {/* Top controls */}
        <div className="flex justify-end gap-1">
          {/* Size toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-black/50 hover:bg-black/70 text-white"
            onClick={handleSizeToggle}
            title={`Size: ${youtubePipSize}`}
          >
            <SizeIcon className="h-4 w-4" />
          </Button>

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-black/50 hover:bg-black/70 text-white"
            onClick={close}
            title="Close player"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Bottom info (optional - could show title) */}
        <div className="text-xs text-white/80 truncate px-1">
          {track.arrangementName}
        </div>
      </div>
    </div>
  );
}
