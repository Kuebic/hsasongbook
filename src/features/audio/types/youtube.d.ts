/**
 * YouTube IFrame API Type Declarations
 *
 * Minimal types for the YouTube IFrame Player API used by the global media player.
 * @see https://developers.google.com/youtube/iframe_api_reference
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
declare namespace YT {
  /** YouTube player state constants */
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  /** Event data passed to onStateChange callback */
  interface OnStateChangeEvent {
    data: PlayerState;
    target: Player;
  }

  /** Event data passed to onReady callback */
  interface OnReadyEvent {
    target: Player;
  }

  /** Event data passed to onError callback */
  interface OnErrorEvent {
    data: number;
    target: Player;
  }

  /** Player event handlers */
  interface Events {
    onReady?: (event: OnReadyEvent) => void;
    onStateChange?: (event: OnStateChangeEvent) => void;
    onError?: (event: OnErrorEvent) => void;
  }

  /** Player configuration options */
  interface PlayerVars {
    autoplay?: 0 | 1;
    controls?: 0 | 1;
    disablekb?: 0 | 1;
    enablejsapi?: 0 | 1;
    fs?: 0 | 1;
    modestbranding?: 0 | 1;
    origin?: string;
    playsinline?: 0 | 1;
    rel?: 0 | 1;
  }

  /** Player constructor options */
  interface PlayerOptions {
    height?: string | number;
    width?: string | number;
    videoId?: string;
    playerVars?: PlayerVars;
    events?: Events;
  }

  /** YouTube IFrame Player */
  class Player {
    constructor(elementId: string | HTMLElement, options: PlayerOptions);

    // Playback controls
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead?: boolean): void;

    // Player state
    getPlayerState(): PlayerState;
    getCurrentTime(): number;
    getDuration(): number;

    // Volume
    getVolume(): number;
    setVolume(volume: number): void;
    isMuted(): boolean;
    mute(): void;
    unMute(): void;

    // Video information
    getVideoUrl(): string;
    getVideoEmbedCode(): string;

    // Player management
    destroy(): void;
  }
}

// Extend Window interface for YouTube API
interface Window {
  YT?: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
}
