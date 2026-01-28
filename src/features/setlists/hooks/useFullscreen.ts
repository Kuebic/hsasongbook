/**
 * useFullscreen Hook
 *
 * Wrapper for Fullscreen API with proper state tracking via events.
 * CRITICAL: Listens to fullscreenchange events for accurate state sync.
 */

import { useState, useEffect, useCallback, RefObject } from 'react';
import logger from '@/lib/logger';

export interface UseFullscreenOptions {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
}

export interface UseFullscreenReturn {
  isFullscreen: boolean;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
}

/**
 * IMPORTANT: If passing callbacks in options, wrap them in useCallback
 * to prevent unnecessary effect re-runs.
 */
export function useFullscreen(
  elementRef: RefObject<HTMLElement>,
  options: UseFullscreenOptions = {}
): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Destructure options to use individual callbacks in dependency arrays
  const { onOpen, onClose, onError } = options;

  // Listen to fullscreenchange events for accurate state tracking
  useEffect(() => {
    const handleChange = (): void => {
      const isActive = document.fullscreenElement === elementRef.current;
      setIsFullscreen(isActive);

      if (isActive) {
        onOpen?.();
      } else {
        onClose?.();
      }
    };

    const handleError = (): void => {
      const error = new Error('Fullscreen request failed');
      onError?.(error);
    };

    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('fullscreenerror', handleError);

    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('fullscreenerror', handleError);
    };
  }, [elementRef, onOpen, onClose, onError]);

  const enterFullscreen = useCallback(async (): Promise<void> => {
    if (!document.fullscreenEnabled || !elementRef.current) {
      const error = new Error('Fullscreen not supported');
      logger.error('Fullscreen not supported');
      onError?.(error);
      throw error;
    }

    try {
      await elementRef.current.requestFullscreen();
    } catch (error) {
      logger.error('Failed to enter fullscreen:', error);
      onError?.(error as Error);
      throw error;
    }
  }, [elementRef, onError]);

  const exitFullscreen = useCallback(async (): Promise<void> => {
    if (!document.fullscreenElement) return;

    try {
      await document.exitFullscreen();
    } catch (error) {
      logger.error('Failed to exit fullscreen:', error);
      onError?.(error as Error);
      throw error;
    }
  }, [onError]);

  const toggleFullscreen = useCallback(async (): Promise<void> => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen
  };
}
