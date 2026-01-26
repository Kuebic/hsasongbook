/**
 * GlobalAudioPlayer Component
 *
 * A floating audio player that persists across page navigation.
 * Renders at the app root level (in App.tsx) so it survives route changes.
 *
 * States:
 * - Hidden: Player not visible, but track may exist (show reopen FAB)
 * - Collapsed: Mini bar with play/pause + title
 * - Expanded: Full controls with seek, volume, etc.
 */

import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  X,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudioPlayer } from '../context/AudioPlayerContext';

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function GlobalAudioPlayer() {
  const {
    track,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isVisible,
    isExpanded,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    expand,
    collapse,
    close,
  } = useAudioPlayer();

  const handleSeek = useCallback(
    (value: number[]) => {
      if (value[0] !== undefined) {
        seek(value[0]);
      }
    },
    [seek]
  );

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      if (value[0] !== undefined) {
        setVolume(value[0]);
      }
    },
    [setVolume]
  );

  // No track loaded - don't render anything
  if (!track) {
    return null;
  }

  // Track exists but player is hidden - don't render anything
  // (users can restart playback from the "Play Audio" button on the arrangement page)
  if (!isVisible) {
    return null;
  }

  const arrangementUrl = `/song/${track.songSlug}/${track.arrangementSlug}`;

  return (
    <div
      className={cn(
        'fixed left-0 right-0 bg-card border-t shadow-lg transition-all duration-300 no-print',
        // Position above mobile nav (pb-16 = 64px)
        'bottom-16 md:bottom-0',
        // Z-index between sticky and mobile nav
        'z-[1025]'
      )}
    >
      {/* Collapsed view - always visible */}
      <div
        className={cn('flex items-center gap-3 px-4 py-3', isExpanded && 'border-b')}
      >
        {/* Play/Pause button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        {/* Title and seek */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{track.arrangementName}</p>
          {/* Inline seek slider with time display */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground tabular-nums w-9 shrink-0">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground tabular-nums w-9 shrink-0">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Expand/Collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={isExpanded ? collapse : expand}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>

        {/* Close button */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={close}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Expanded view - volume control only */}
      {isExpanded && (
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Volume control */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>

            {/* Go to arrangement link */}
            <Link
              to={arrangementUrl}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              <span className="hidden sm:inline">View</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
