/**
 * AudioMiniPlayer Component
 *
 * A floating mini-player that stays visible while scrolling through the arrangement.
 * Supports both MP3 playback and YouTube embeds.
 *
 * Features:
 * - Fixed position at bottom of screen (above mobile nav)
 * - Collapsed/expanded states
 * - Play/pause, seek, volume controls for MP3
 * - YouTube iframe embed with controls
 * - Source toggle when both MP3 and YouTube are available
 */

import { useState, useRef, useEffect, useCallback } from 'react';
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
  Music,
  Youtube,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { extractYoutubeVideoId, getYoutubeEmbedUrl } from '../validation/audioSchemas';

interface AudioMiniPlayerProps {
  /** Signed URL for MP3 audio */
  audioUrl?: string | null;
  /** YouTube video URL or ID */
  youtubeUrl?: string | null;
  /** Song title for display */
  songTitle: string;
  /** Arrangement name for display */
  arrangementName: string;
  /** Callback when player is closed */
  onClose?: () => void;
}

type AudioSource = 'mp3' | 'youtube';

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function AudioMiniPlayer({
  audioUrl,
  youtubeUrl,
  songTitle,
  arrangementName,
  onClose,
}: AudioMiniPlayerProps) {
  // Player state
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Determine available sources and current source
  const hasAudio = !!audioUrl;
  const hasYoutube = !!youtubeUrl;
  const youtubeVideoId = youtubeUrl ? extractYoutubeVideoId(youtubeUrl) : null;
  const hasBothSources = hasAudio && hasYoutube && !!youtubeVideoId;

  const [activeSource, setActiveSource] = useState<AudioSource>(
    hasAudio ? 'mp3' : 'youtube'
  );

  // Audio element ref
  const audioRef = useRef<HTMLAudioElement>(null);

  // Update active source when props change
  useEffect(() => {
    if (!hasAudio && hasYoutube) {
      setActiveSource('youtube');
    } else if (hasAudio && !hasYoutube) {
      setActiveSource('mp3');
    }
  }, [hasAudio, hasYoutube]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Sync volume with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }, [isPlaying]);

  const handleSeek = useCallback((value: number[]) => {
    const audio = audioRef.current;
    if (audio && value[0] !== undefined) {
      audio.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  }, []);

  const handleVolumeChange = useCallback((value: number[]) => {
    if (value[0] !== undefined) {
      setVolume(value[0]);
      setIsMuted(value[0] === 0);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleClose = () => {
    // Pause audio before closing
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
    setIsVisible(false);
    onClose?.();
  };

  const handleSourceToggle = (source: AudioSource) => {
    // Pause current audio when switching sources
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
    setIsPlaying(false);
    setActiveSource(source);
  };

  // Don't render if closed or no sources
  if (!isVisible || (!hasAudio && !hasYoutube)) {
    return null;
  }

  return (
    <>
      {/* Hidden audio element */}
      {hasAudio && (
        <audio ref={audioRef} src={audioUrl!} preload="metadata" />
      )}

      {/* Floating player container */}
      <div
        className={cn(
          'fixed left-0 right-0 bg-card border-t shadow-lg transition-all duration-300 no-print',
          // Position above mobile nav (pb-16 = 64px)
          'bottom-16 md:bottom-0',
          // Z-index between sticky and mobile nav
          'z-[1025]'
        )}
      >
        {/* Collapsed view */}
        <div
          className={cn(
            'flex items-center gap-3 px-4 py-3',
            isExpanded && 'border-b'
          )}
        >
          {/* Play/Pause button (MP3 only in collapsed view) */}
          {activeSource === 'mp3' && (
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
          )}

          {/* YouTube indicator in collapsed view */}
          {activeSource === 'youtube' && (
            <div className="h-10 w-10 rounded-full bg-[#FF0000] flex items-center justify-center">
              <Youtube className="h-5 w-5 text-white" />
            </div>
          )}

          {/* Title and progress */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {arrangementName}
            </p>
            {activeSource === 'mp3' ? (
              // Inline seek slider with time display
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
                  className="flex-1 [&>span:first-child]:bg-muted-foreground/30 [&>span:last-child]:bg-primary [&>span:last-child]:border-0"
                />
                <span className="text-xs text-muted-foreground tabular-nums w-9 shrink-0">
                  {formatTime(duration)}
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground truncate">
                {songTitle}
              </p>
            )}
          </div>

          {/* Source toggle (if both available) */}
          {hasBothSources && (
            <div className="flex items-center gap-1 bg-muted rounded-full p-1">
              <Button
                variant={activeSource === 'mp3' ? 'default' : 'ghost'}
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={() => handleSourceToggle('mp3')}
              >
                <Music className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={activeSource === 'youtube' ? 'default' : 'ghost'}
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={() => handleSourceToggle('youtube')}
              >
                <Youtube className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Expand/Collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Expanded view */}
        {isExpanded && (
          <div className="px-4 py-3 space-y-4">
            {activeSource === 'mp3' ? (
              // MP3 Player Controls
              <div className="space-y-3">
                {/* Progress bar */}
                <div className="space-y-1">
                  <Slider
                    value={[currentTime]}
                    min={0}
                    max={duration || 100}
                    step={1}
                    onValueChange={handleSeek}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-between">
                  {/* Play/Pause */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={togglePlay}
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6 ml-0.5" />
                    )}
                  </Button>

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
                </div>
              </div>
            ) : (
              // YouTube Embed
              youtubeVideoId && (
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                  <iframe
                    src={`${getYoutubeEmbedUrl(youtubeVideoId)}?autoplay=0&rel=0`}
                    title={`${songTitle} - ${arrangementName}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              )
            )}
          </div>
        )}
      </div>
    </>
  );
}
