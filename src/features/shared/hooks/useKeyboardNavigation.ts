/**
 * useKeyboardNavigation Hook
 *
 * Provides keyboard navigation for list items (arrow keys + Enter).
 * Useful for search results, dropdowns, and other selectable lists.
 *
 * Features:
 * - Arrow Up/Down navigation
 * - Enter to select
 * - Home/End to jump to first/last
 * - Auto-scroll selected item into view
 * - Optional looping behavior
 *
 * @example
 * ```tsx
 * const { selectedIndex, setSelectedIndex, handleKeyDown, containerRef } = useKeyboardNavigation({
 *   itemCount: results.length,
 *   onSelect: (index) => selectItem(results[index]),
 *   loop: true
 * });
 *
 * <div ref={containerRef} onKeyDown={handleKeyDown}>
 *   {results.map((item, idx) => (
 *     <div key={item.id} aria-selected={selectedIndex === idx}>
 *       {item.name}
 *     </div>
 *   ))}
 * </div>
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type React from 'react';

export interface UseKeyboardNavigationOptions {
  itemCount: number;
  onSelect: (index: number) => void;
  loop?: boolean;
  disabled?: boolean;
}

export interface UseKeyboardNavigationReturn {
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Hook for keyboard navigation through a list of items
 */
export function useKeyboardNavigation({
  itemCount,
  onSelect,
  loop = false,
  disabled = false
}: UseKeyboardNavigationOptions): UseKeyboardNavigationReturn {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLElement>): void => {
    if (disabled || itemCount === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => {
          if (prev >= itemCount - 1) {
            return loop ? 0 : prev;
          }
          return prev + 1;
        });
        break;

      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => {
          if (prev <= 0) {
            return loop ? itemCount - 1 : 0;
          }
          return prev - 1;
        });
        break;

      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < itemCount) {
          onSelect(selectedIndex);
        }
        break;

      case 'Home':
        event.preventDefault();
        setSelectedIndex(0);
        break;

      case 'End':
        event.preventDefault();
        setSelectedIndex(itemCount - 1);
        break;

      case 'Escape':
        event.preventDefault();
        setSelectedIndex(-1);
        break;
    }
  }, [disabled, itemCount, loop, onSelect, selectedIndex]);

  /**
   * Auto-scroll selected item into view
   */
  useEffect(() => {
    if (selectedIndex < 0 || !containerRef.current) return;

    const container = containerRef.current;
    const selectedElement = container.querySelector(`[data-index="${selectedIndex}"]`);

    if (selectedElement) {
      selectedElement.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  /**
   * Reset selected index when item count changes
   */
  useEffect(() => {
    if (selectedIndex >= itemCount) {
      setSelectedIndex(-1);
    }
  }, [itemCount, selectedIndex]);

  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    containerRef
  };
}

/**
 * Default export for convenient importing
 */
export default useKeyboardNavigation;
