/**
 * ThemeProvider Component
 *
 * React Context provider for managing theme state across the application.
 * Handles theme persistence, system preference detection, and automatic
 * theme switching when OS theme changes.
 *
 * Pattern: Based on shadcn/ui official dark mode implementation
 * @see https://ui.shadcn.com/docs/dark-mode/vite
 */

import { createContext, useEffect, useState } from 'react';
import type { Theme, ThemeProviderProps, ThemeProviderState } from './types';
import { isValidTheme } from './types';
import logger from '@/lib/logger';

// Initial state for theme context
const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

// Create theme context with initial state
// eslint-disable-next-line react-refresh/only-export-components
export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

/**
 * Theme Provider Component
 *
 * Wraps the application to provide theme state and controls.
 *
 * Features:
 * - Persists theme preference to localStorage
 * - Detects and respects system theme preference
 * - Listens for OS theme changes (when in system mode)
 * - Applies theme class to document root
 * - Handles localStorage errors gracefully (private browsing mode)
 *
 * Usage:
 * ```tsx
 * // In App.tsx:
 * function App() {
 *   return (
 *     <ThemeProvider defaultTheme="system" storageKey="hsasongbook-theme">
 *       <YourApp />
 *     </ThemeProvider>
 *   );
 * }
 * ```
 *
 * @param props - Provider configuration
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'hsasongbook-theme',
  ...props
}: ThemeProviderProps) {
  // Initialize theme from localStorage with validation
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return isValidTheme(stored) ? stored : defaultTheme;
    } catch {
      // localStorage might throw in private browsing mode
      logger.warn('Failed to read theme from localStorage (private browsing?)');
      return defaultTheme;
    }
  });

  // Apply theme class to document root
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove both theme classes to ensure clean state
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      // Determine system preference and apply
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    // Apply selected theme (light or dark)
    root.classList.add(theme);
  }, [theme]);

  // Listen for system theme changes (only when in system mode)
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Handler for OS theme change events
    const handler = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(e.matches ? 'dark' : 'light');
    };

    // Add listener for OS theme changes
    mediaQuery.addEventListener('change', handler);

    // Cleanup: Remove listener when component unmounts or theme changes
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  // Context value with theme state and setter
  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      // Persist to localStorage with error handling
      try {
        localStorage.setItem(storageKey, newTheme);
      } catch {
        // localStorage might throw in private browsing mode
        // Log warning but continue - theme will work, just won't persist
        logger.warn('Failed to save theme preference (private browsing?)');
      }

      // Update state (triggers theme application via useEffect)
      setTheme(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

