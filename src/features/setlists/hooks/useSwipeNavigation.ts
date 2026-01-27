/**
 * useSwipeNavigation Hook
 *
 * Custom hook for detecting horizontal swipe gestures.
 * Prevents conflicts with vertical scrolling by only triggering
 * when horizontal movement dominates.
 */

import React, { useEffect, useRef } from 'react';

interface SwipeNavigationOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  enabled?: boolean;
  minSwipeDistance?: number; // Minimum distance to trigger swipe (px)
  maxVerticalDistance?: number; // Max vertical movement to still be horizontal swipe (px)
}

export function useSwipeNavigation(
  elementRef: React.RefObject<HTMLElement>,
  options: SwipeNavigationOptions = {}
) {
  const {
    onSwipeLeft,
    onSwipeRight,
    enabled = true,
    minSwipeDistance = 50,
    maxVerticalDistance = 100
  } = options;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    if (!enabled || !elementRef.current) return;

    const element = elementRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Reset touch start
      touchStartRef.current = null;

      // Check if horizontal movement dominates
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Must be primarily horizontal movement
      if (absDeltaY > maxVerticalDistance) return;
      if (absDeltaX < minSwipeDistance) return;
      if (absDeltaX < absDeltaY) return; // Vertical dominates

      // Must complete within reasonable time (prevent slow drags)
      if (deltaTime > 500) return;

      // Determine direction and call handler
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    };

    const handleTouchCancel = () => {
      touchStartRef.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [
    enabled,
    elementRef,
    onSwipeLeft,
    onSwipeRight,
    minSwipeDistance,
    maxVerticalDistance
  ]);
}
