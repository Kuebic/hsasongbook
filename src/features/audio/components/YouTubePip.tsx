/**
 * YouTubePip Component
 *
 * A floating picture-in-picture YouTube player that persists across page navigation.
 * Uses the YouTube IFrame API for programmatic control (play, pause, seek).
 */

/* eslint-disable no-undef */ // YT is a global from YouTube IFrame API

import { useEffect, useRef, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { X, Minimize2, Maximize2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
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
    isPlaying,
    isVisible,
    volume,
    isMuted,
    youtubePipSize,
    registerYouTubePlayer,
    unregisterYouTubePlayer,
    setYoutubePipSize,
    setYouTubeDuration,
    setYouTubeIsPlaying,
    togglePlay,
    setVolume,
    toggleMute,
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

        {/* Center play/pause button */}
        <div className="flex-1 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-black/60 hover:bg-black/80 text-white"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-0.5" />
            )}
          </Button>
        </div>

        {/* Bottom: volume + title */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 bg-black/50 hover:bg-black/70 text-white shrink-0"
            onClick={toggleMute}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-3.5 w-3.5" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            min={0}
            max={1}
            step={0.1}
            onValueChange={(value) => value[0] !== undefined && setVolume(value[0])}
            className="w-16 shrink-0"
          />
          <span className="text-xs text-white/80 truncate flex-1">
            {track.arrangementName}
          </span>
          {/* YouTube link - opens video on YouTube and stops playback */}
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              // Pause playback when opening YouTube
              if (isPlaying && playerRef.current) {
                playerRef.current.pauseVideo();
              }
            }}
            className="shrink-0 p-1 rounded bg-black/50 hover:bg-black/70 transition-colors"
            title="Watch on YouTube"
          >
            <svg
              viewBox="0 0 28 20"
              className="h-4 w-5"
              fill="currentColor"
            >
              <path
                d="M27.4 3.1c-.3-1.2-1.2-2.1-2.4-2.4C22.8 0 14 0 14 0S5.2 0 3 .7C1.8 1 .9 1.9.6 3.1 0 5.3 0 10 0 10s0 4.7.6 6.9c.3 1.2 1.2 2.1 2.4 2.4 2.2.7 11 .7 11 .7s8.8 0 11-.7c1.2-.3 2.1-1.2 2.4-2.4.6-2.2.6-6.9.6-6.9s0-4.7-.6-6.9zM11 14V6l7.4 4-7.4 4z"
                fill="#FF0000"
              />
              <path d="M11 14V6l7.4 4-7.4 4z" fill="#FFFFFF" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
