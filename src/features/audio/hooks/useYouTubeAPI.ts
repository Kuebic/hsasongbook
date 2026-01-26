/**
 * useYouTubeAPI Hook
 *
 * Dynamically loads the YouTube IFrame API script and provides ready state.
 * The API is loaded once and shared across the app.
 */

/* eslint-disable no-undef */ // YT is a global from YouTube IFrame API

import { useState, useEffect } from 'react';

const YOUTUBE_API_URL = 'https://www.youtube.com/iframe_api';

// Track global loading state to avoid multiple script loads
let isLoading = false;
let isLoaded = false;
const callbacks: Array<() => void> = [];

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    // Already loaded
    if (isLoaded && window.YT?.Player) {
      resolve();
      return;
    }

    // Add to callback queue
    callbacks.push(resolve);

    // Already loading, just wait for callback
    if (isLoading) {
      return;
    }

    isLoading = true;

    // Set up the global callback that YouTube API calls when ready
    window.onYouTubeIframeAPIReady = () => {
      isLoaded = true;
      isLoading = false;
      // Notify all waiting callbacks
      callbacks.forEach((cb) => cb());
      callbacks.length = 0;
    };

    // Check if script already exists (e.g., from a previous session)
    const existingScript = document.querySelector(
      `script[src="${YOUTUBE_API_URL}"]`
    );
    if (existingScript) {
      // Script exists but API not ready yet - wait for callback
      return;
    }

    // Load the YouTube IFrame API script
    const script = document.createElement('script');
    script.src = YOUTUBE_API_URL;
    script.async = true;
    document.body.appendChild(script);
  });
}

interface UseYouTubeAPIResult {
  /** Whether the YouTube IFrame API is ready to use */
  isReady: boolean;
  /** The YT namespace (available when isReady is true) */
  YT: typeof YT | undefined;
}

/**
 * Hook to load and access the YouTube IFrame API
 *
 * @example
 * ```tsx
 * function YouTubePlayer() {
 *   const { isReady, YT } = useYouTubeAPI();
 *
 *   useEffect(() => {
 *     if (!isReady || !YT) return;
 *
 *     const player = new YT.Player('player', {
 *       videoId: 'dQw4w9WgXcQ',
 *       events: {
 *         onReady: () => console.log('Player ready'),
 *       },
 *     });
 *
 *     return () => player.destroy();
 *   }, [isReady, YT]);
 *
 *   return <div id="player" />;
 * }
 * ```
 */
export function useYouTubeAPI(): UseYouTubeAPIResult {
  const [isReady, setIsReady] = useState(isLoaded && !!window.YT?.Player);

  useEffect(() => {
    // Already ready
    if (isLoaded && window.YT?.Player) {
      setIsReady(true);
      return;
    }

    // Load the API
    loadYouTubeAPI().then(() => {
      setIsReady(true);
    });
  }, []);

  return {
    isReady,
    YT: isReady ? window.YT : undefined,
  };
}
