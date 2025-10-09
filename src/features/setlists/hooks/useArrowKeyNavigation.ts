/**
 * useArrowKeyNavigation Hook
 *
 * Handles keyboard navigation for performance mode.
 * Supports: ArrowLeft, ArrowRight, Space, Home, End, Escape, n/p keys.
 * Filters out events from input/textarea elements.
 */

import { useEffect } from 'react';

export interface UseArrowKeyNavigationOptions {
  enabled: boolean;
}

export function useArrowKeyNavigation(
  currentIndex: number,
  totalItems: number,
  onNavigate: (newIndex: number) => void,
  options: UseArrowKeyNavigationOptions = { enabled: true }
): void {
  useEffect(() => {
    if (!options.enabled) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      // Don't interfere with input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      let newIndex = currentIndex;

      switch (event.key) {
        case 'ArrowRight':
        case ' ': // Space
        case 'n':
        case 'N':
          event.preventDefault();
          newIndex = Math.min(currentIndex + 1, totalItems - 1);
          break;

        case 'ArrowLeft':
        case 'p':
        case 'P':
        case 'Backspace':
          event.preventDefault();
          newIndex = Math.max(currentIndex - 1, 0);
          break;

        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;

        case 'End':
          event.preventDefault();
          newIndex = totalItems - 1;
          break;

        case 'Escape':
          // Handled by fullscreen hook
          break;

        default:
          return;
      }

      if (newIndex !== currentIndex) {
        onNavigate(newIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, totalItems, onNavigate, options.enabled]);
}
