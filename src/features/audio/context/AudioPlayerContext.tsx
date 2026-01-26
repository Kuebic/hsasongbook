/**
 * Global Media Player Context
 *
 * Provides app-wide media playback state and controls for both MP3 and YouTube.
 * The audio element and YouTube player reference live inside this provider
 * so they persist across page navigation.
 */

/* eslint-disable no-undef */ // YT is a global from YouTube IFrame API

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type MutableRefObject,
} from 'react';

// Media types
export type MediaType = 'mp3' | 'youtube';
export type YouTubePipSize = 'small' | 'medium' | 'large';

// Legacy type for backwards compatibility
export interface AudioTrack {
  audioUrl: string;
  songTitle: string;
  arrangementName: string;
  arrangementSlug: string;
  songSlug: string;
}

// Unified media track type
export interface MediaTrack {
  songTitle: string;
  arrangementName: string;
  arrangementSlug: string;
  songSlug: string;
  mediaType: MediaType;
  // MP3-specific
  audioUrl?: string;
  // YouTube-specific
  youtubeVideoId?: string;
}

interface MediaPlayerState {
  track: MediaTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isVisible: boolean;
  isExpanded: boolean;
  // YouTube-specific
  youtubePlayerReady: boolean;
  youtubePipSize: YouTubePipSize;
}

interface MediaPlayerActions {
  playTrack: (track: MediaTrack | AudioTrack) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  expand: () => void;
  collapse: () => void;
  show: () => void;
  hide: () => void;
  close: () => void;
  // YouTube-specific
  registerYouTubePlayer: (player: YT.Player) => void;
  unregisterYouTubePlayer: () => void;
  setYoutubePipSize: (size: YouTubePipSize) => void;
  setYouTubeDuration: (duration: number) => void;
  setYouTubeIsPlaying: (playing: boolean) => void;
}

interface MediaPlayerRefs {
  youtubePlayerRef: MutableRefObject<YT.Player | null>;
}

type AudioPlayerContextValue = MediaPlayerState & MediaPlayerActions & MediaPlayerRefs;

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined);

interface AudioPlayerProviderProps {
  children: ReactNode;
}

// Helper to convert legacy AudioTrack to MediaTrack
function normalizeTrack(track: MediaTrack | AudioTrack): MediaTrack {
  if ('mediaType' in track) {
    return track;
  }
  // Legacy AudioTrack - convert to MediaTrack
  return {
    ...track,
    mediaType: 'mp3' as const,
  };
}

export function AudioPlayerProvider({ children }: AudioPlayerProviderProps) {
  // Track and playback state
  const [track, setTrack] = useState<MediaTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // UI state
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // YouTube-specific state
  const [youtubePlayerReady, setYoutubePlayerReady] = useState(false);
  const [youtubePipSize, setYoutubePipSizeState] = useState<YouTubePipSize>('medium');

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const youtubePlayerRef = useRef<YT.Player | null>(null);
  const youtubeTimeUpdateRef = useRef<number | null>(null);

  // Create audio element on mount
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Sync volume with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // YouTube time update polling
  useEffect(() => {
    // Only poll when YouTube is playing
    if (!isPlaying || track?.mediaType !== 'youtube' || !youtubePlayerRef.current) {
      if (youtubeTimeUpdateRef.current) {
        clearInterval(youtubeTimeUpdateRef.current);
        youtubeTimeUpdateRef.current = null;
      }
      return;
    }

    youtubeTimeUpdateRef.current = window.setInterval(() => {
      const player = youtubePlayerRef.current;
      if (player) {
        try {
          setCurrentTime(player.getCurrentTime());
        } catch {
          // Player might be destroyed
        }
      }
    }, 500);

    return () => {
      if (youtubeTimeUpdateRef.current) {
        clearInterval(youtubeTimeUpdateRef.current);
        youtubeTimeUpdateRef.current = null;
      }
    };
  }, [isPlaying, track?.mediaType]);

  // Actions
  const playTrack = useCallback((newTrackInput: MediaTrack | AudioTrack) => {
    const newTrack = normalizeTrack(newTrackInput);

    // Stop current media if switching types
    if (track?.mediaType === 'youtube' && newTrack.mediaType === 'mp3') {
      youtubePlayerRef.current?.pauseVideo();
    }
    if (track?.mediaType === 'mp3' && newTrack.mediaType === 'youtube') {
      audioRef.current?.pause();
    }

    if (newTrack.mediaType === 'mp3') {
      const audio = audioRef.current;
      if (!audio || !newTrack.audioUrl) return;

      // If same track, just resume
      if (track?.mediaType === 'mp3' && track?.audioUrl === newTrack.audioUrl) {
        audio.play();
        setIsVisible(true);
        return;
      }

      // New MP3 track
      setTrack(newTrack);
      setCurrentTime(0);
      setDuration(0);
      audio.src = newTrack.audioUrl;
      audio.load();
      audio.play();
      setIsVisible(true);
      setIsExpanded(false);
    } else if (newTrack.mediaType === 'youtube') {
      // If same YouTube video, just resume
      if (
        track?.mediaType === 'youtube' &&
        track?.youtubeVideoId === newTrack.youtubeVideoId
      ) {
        youtubePlayerRef.current?.playVideo();
        setIsVisible(true);
        return;
      }

      // New YouTube track - the YouTubePip component will handle loading
      setTrack(newTrack);
      setCurrentTime(0);
      setDuration(0);
      setIsVisible(true);
      setIsExpanded(false);
      setYoutubePlayerReady(false);
    }
  }, [track]);

  const pause = useCallback(() => {
    if (track?.mediaType === 'youtube') {
      youtubePlayerRef.current?.pauseVideo();
    } else {
      audioRef.current?.pause();
    }
    setIsPlaying(false);
  }, [track?.mediaType]);

  const resume = useCallback(() => {
    if (track?.mediaType === 'youtube') {
      youtubePlayerRef.current?.playVideo();
    } else {
      audioRef.current?.play();
    }
  }, [track?.mediaType]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      if (track?.mediaType === 'youtube') {
        youtubePlayerRef.current?.pauseVideo();
      } else {
        audioRef.current?.pause();
      }
    } else {
      if (track?.mediaType === 'youtube') {
        youtubePlayerRef.current?.playVideo();
      } else {
        audioRef.current?.play();
      }
    }
  }, [isPlaying, track?.mediaType]);

  const seek = useCallback((time: number) => {
    if (track?.mediaType === 'youtube') {
      youtubePlayerRef.current?.seekTo(time, true);
      setCurrentTime(time);
    } else {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = time;
        setCurrentTime(time);
      }
    }
  }, [track?.mediaType]);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    setIsMuted(newVolume === 0);
    // Also apply to YouTube player if active
    if (youtubePlayerRef.current) {
      try {
        youtubePlayerRef.current.setVolume(newVolume * 100); // YouTube uses 0-100
        if (newVolume === 0) {
          youtubePlayerRef.current.mute();
        } else {
          youtubePlayerRef.current.unMute();
        }
      } catch {
        // Player might not be ready
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      // Also apply to YouTube player if active
      if (youtubePlayerRef.current) {
        try {
          if (newMuted) {
            youtubePlayerRef.current.mute();
          } else {
            youtubePlayerRef.current.unMute();
          }
        } catch {
          // Player might not be ready
        }
      }
      return newMuted;
    });
  }, []);

  const expand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const collapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const show = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
    if (track?.mediaType === 'youtube') {
      youtubePlayerRef.current?.pauseVideo();
    } else {
      audioRef.current?.pause();
    }
    setIsPlaying(false);
  }, [track?.mediaType]);

  const close = useCallback(() => {
    setIsVisible(false);
    if (track?.mediaType === 'youtube') {
      youtubePlayerRef.current?.pauseVideo();
    } else {
      audioRef.current?.pause();
    }
    setIsPlaying(false);
  }, [track?.mediaType]);

  // YouTube-specific actions
  const registerYouTubePlayer = useCallback((player: YT.Player) => {
    youtubePlayerRef.current = player;
    setYoutubePlayerReady(true);
  }, []);

  const unregisterYouTubePlayer = useCallback(() => {
    youtubePlayerRef.current = null;
    setYoutubePlayerReady(false);
  }, []);

  const setYoutubePipSize = useCallback((size: YouTubePipSize) => {
    setYoutubePipSizeState(size);
  }, []);

  const setYouTubeDuration = useCallback((dur: number) => {
    setDuration(dur);
  }, []);

  const setYouTubeIsPlaying = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  // Add to context value so YouTubePip can use it
  const value: AudioPlayerContextValue = {
    // State
    track,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isVisible,
    isExpanded,
    youtubePlayerReady,
    youtubePipSize,
    // Actions
    playTrack,
    pause,
    resume,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    expand,
    collapse,
    show,
    hide,
    close,
    registerYouTubePlayer,
    unregisterYouTubePlayer,
    setYoutubePipSize,
    setYouTubeDuration,
    setYouTubeIsPlaying,
    // Refs
    youtubePlayerRef,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
}

