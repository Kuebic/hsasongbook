/**
 * useSynchronizedScroll Hook
 *
 * Synchronizes scroll position between editor and viewer panels
 * Handles different content heights and prevents feedback loops
 */

import { useEffect, useRef, useCallback } from 'react';
import logger from '@/lib/logger';
import type { UseSynchronizedScrollOptions, UseSynchronizedScrollReturn } from '../types';

/**
 * Custom hook for synchronized scrolling between two elements
 * @param params - Scroll sync configuration
 * @returns Sync control methods
 */
export function useSynchronizedScroll({
  leftRef,
  rightRef,
  enabled = true,
  debounceMs = 50
}: UseSynchronizedScrollOptions): UseSynchronizedScrollReturn {
  const isScrollingRef = useRef<boolean>(false);
  const scrollSourceRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  // Calculate scroll percentage
  const getScrollPercentage = useCallback((element: HTMLElement | null): number => {
    if (!element) return 0;

    const { scrollTop, scrollHeight, clientHeight } = element;
    const maxScroll = scrollHeight - clientHeight;

    if (maxScroll <= 0) return 0;
    return scrollTop / maxScroll;
  }, []);

  // Apply scroll percentage to element
  const setScrollPercentage = useCallback((element: HTMLElement | null, percentage: number): void => {
    if (!element) return;

    const { scrollHeight, clientHeight } = element;
    const maxScroll = scrollHeight - clientHeight;

    if (maxScroll <= 0) return;
    element.scrollTop = percentage * maxScroll;
  }, []);

  // Sync scroll from source to target
  const syncScroll = useCallback((source: HTMLElement | null, target: HTMLElement | null, sourceName: string): void => {
    if (!enabled || !source || !target) return;
    if (isScrollingRef.current && scrollSourceRef.current !== sourceName) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      isScrollingRef.current = true;
      scrollSourceRef.current = sourceName;

      const percentage = getScrollPercentage(source);
      setScrollPercentage(target, percentage);

      // Reset flags after a short delay
      setTimeout(() => {
        isScrollingRef.current = false;
        scrollSourceRef.current = null;
      }, 100);
    }, debounceMs);
  }, [enabled, getScrollPercentage, setScrollPercentage, debounceMs]);

  // Handle scroll events
  const handleLeftScroll = useCallback((): void => {
    syncScroll(leftRef.current, rightRef.current, 'left');
  }, [syncScroll, leftRef, rightRef]);

  const handleRightScroll = useCallback((): void => {
    syncScroll(rightRef.current, leftRef.current, 'right');
  }, [syncScroll, leftRef, rightRef]);

  // Setup scroll event listeners
  useEffect(() => {
    if (!enabled) return;

    const leftElement = leftRef.current;
    const rightElement = rightRef.current;

    if (!leftElement || !rightElement) {
      logger.debug('Synchronized scroll: elements not ready');
      return;
    }

    // Add scroll listeners
    leftElement.addEventListener('scroll', handleLeftScroll, { passive: true });
    rightElement.addEventListener('scroll', handleRightScroll, { passive: true });

    logger.debug('Synchronized scroll: listeners attached');

    // Cleanup
    return () => {
      leftElement.removeEventListener('scroll', handleLeftScroll);
      rightElement.removeEventListener('scroll', handleRightScroll);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      logger.debug('Synchronized scroll: listeners removed');
    };
  }, [enabled, handleLeftScroll, handleRightScroll, leftRef, rightRef]);

  // Manual sync methods
  const syncToLeft = useCallback((): void => {
    if (leftRef.current && rightRef.current) {
      const percentage = getScrollPercentage(leftRef.current);
      setScrollPercentage(rightRef.current, percentage);
    }
  }, [leftRef, rightRef, getScrollPercentage, setScrollPercentage]);

  const syncToRight = useCallback((): void => {
    if (leftRef.current && rightRef.current) {
      const percentage = getScrollPercentage(rightRef.current);
      setScrollPercentage(leftRef.current, percentage);
    }
  }, [leftRef, rightRef, getScrollPercentage, setScrollPercentage]);

  // Reset scroll positions
  const resetScroll = useCallback((): void => {
    if (leftRef.current) leftRef.current.scrollTop = 0;
    if (rightRef.current) rightRef.current.scrollTop = 0;
  }, [leftRef, rightRef]);

  return {
    syncToLeft,
    syncToRight,
    resetScroll,
    isEnabled: enabled
  };
}

/**
 * Smart synchronized scrolling that accounts for ChordPro sections
 * This is a more advanced version that tries to keep sections aligned
 */
export function useSmartSynchronizedScroll({
  editorRef,
  viewerRef,
  enabled = true
}) {
  // This would require parsing the content to find section markers
  // and aligning scroll positions based on sections rather than percentages
  // For now, we'll use the basic percentage-based sync

  return useSynchronizedScroll({
    leftRef: editorRef,
    rightRef: viewerRef,
    enabled,
    debounceMs: 50
  });
}

export default useSynchronizedScroll;