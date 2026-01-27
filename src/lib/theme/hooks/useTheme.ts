/**
 * Custom hook to access theme context
 *
 * Must be used within a ThemeProvider component tree.
 * Throws an error if used outside of provider.
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { theme, setTheme } = useTheme();
 *
 *   return (
 *     <button onClick={() => setTheme('dark')}>
 *       Switch to dark mode
 *     </button>
 *   );
 * }
 * ```
 *
 * @returns Theme state and setter function
 * @throws Error if used outside ThemeProvider
 */

import { useContext } from 'react';
import { ThemeProviderContext } from '../ThemeProvider';

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
