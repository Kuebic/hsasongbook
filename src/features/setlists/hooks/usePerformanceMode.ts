/**
 * usePerformanceMode Hook
 *
 * Composite hook combining fullscreen + keyboard navigation
 * for performance mode functionality.
 */

import { useState, useCallback, RefObject } from 'react';
import { useFullscreen } from './useFullscreen';
import { useArrowKeyNavigation } from './useArrowKeyNavigation';
import type { Arrangement } from '@/types';

export interface UsePerformanceModeOptions {
  arrangements: Arrangement[];
  initialIndex?: number;
  onExit?: () => void;
}

export interface UsePerformanceModeReturn {
  currentIndex: number;
  currentArrangement: Arrangement | null;
  isFullscreen: boolean;
  nextArrangement: () => void;
  previousArrangement: () => void;
  goToArrangement: (index: number) => void;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
}

export function usePerformanceMode(
  containerRef: RefObject<HTMLElement>,
  options: UsePerformanceModeOptions
): UsePerformanceModeReturn {
  const { arrangements, initialIndex = 0, onExit } = options;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen
  } = useFullscreen(containerRef, {
    onClose: onExit
  });

  useArrowKeyNavigation(
    currentIndex,
    arrangements.length,
    setCurrentIndex,
    { enabled: isFullscreen }
  );

  const nextArrangement = useCallback((): void => {
    setCurrentIndex(prev => Math.min(prev + 1, arrangements.length - 1));
  }, [arrangements.length]);

  const previousArrangement = useCallback((): void => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const goToArrangement = useCallback((index: number): void => {
    if (index >= 0 && index < arrangements.length) {
      setCurrentIndex(index);
    }
  }, [arrangements.length]);

  return {
    currentIndex,
    currentArrangement: arrangements[currentIndex] || null,
    isFullscreen,
    nextArrangement,
    previousArrangement,
    goToArrangement,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen
  };
}
