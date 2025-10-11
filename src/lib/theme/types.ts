/**
 * Theme Types for HSA Songbook
 *
 * Type definitions for the theme system, including theme modes,
 * provider state, and validation functions.
 */

import type { ReactNode } from 'react';

/**
 * Theme options for HSA Songbook
 * - light: Force light mode (white background, dark text)
 * - dark: Force dark mode (dark background, light text)
 * - system: Match OS preference with automatic switching
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Theme provider state interface
 * Used by React Context to expose theme state and setter
 */
export interface ThemeProviderState {
  /**
   * Current theme setting
   */
  theme: Theme;
  /**
   * Function to update theme preference
   * Automatically persists to localStorage
   */
  setTheme: (theme: Theme) => void;
}

/**
 * Theme provider props
 */
export interface ThemeProviderProps {
  /**
   * Child components to wrap with theme context
   */
  children: ReactNode;
  /**
   * Default theme to use if no preference is saved
   * @default 'system'
   */
  defaultTheme?: Theme;
  /**
   * localStorage key for persisting theme preference
   * @default 'hsasongbook-theme'
   */
  storageKey?: string;
}

/**
 * Type guard to validate if a value is a valid Theme
 *
 * Usage:
 * ```ts
 * const stored = localStorage.getItem('theme');
 * if (isValidTheme(stored)) {
 *   setTheme(stored);  // TypeScript knows this is 'light' | 'dark' | 'system'
 * }
 * ```
 *
 * @param value - Value to check
 * @returns True if value is a valid Theme
 */
export function isValidTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}
