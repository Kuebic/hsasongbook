/**
 * useDebounce Hook
 *
 * Generic hook for debouncing values (delays updating the value until
 * the specified delay has passed without changes).
 *
 * Use case: Search inputs - avoid filtering on every keystroke
 *
 * @example
 * ```tsx
 * const [query, setQuery] = useState('');
 * const debouncedQuery = useDebouncedValue(query, { delay: 300 });
 * // debouncedQuery updates 300ms after last change to query
 * ```
 */

import { useState, useEffect } from 'react';

export interface UseDebouncedValueOptions<T> {
  delay?: number;
  equalityFn?: (left: T, right: T) => boolean;
}

/**
 * Debounces a value, delaying updates until the specified delay has passed
 * without the value changing.
 *
 * @param value - The value to debounce
 * @param options - Configuration options
 * @param options.delay - Delay in milliseconds (default: 300)
 * @param options.equalityFn - Custom equality function (default: ===)
 * @returns The debounced value
 */
export function useDebouncedValue<T>(
  value: T,
  options?: UseDebouncedValueOptions<T>
): T {
  const { delay = 300, equalityFn } = options ?? {};
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // If custom equality function provided, check if values are equal
    if (equalityFn && equalityFn(value, debouncedValue)) {
      return;
    }

    // Set up timeout to update debounced value
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timeout on unmount or when value/delay changes
    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, delay, debouncedValue, equalityFn]);

  return debouncedValue;
}

/**
 * Simple debounce hook with direct delay parameter.
 * Alias for useDebouncedValue with simpler API.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  return useDebouncedValue(value, { delay });
}

/**
 * Default export for convenient importing
 */
export default useDebouncedValue;
