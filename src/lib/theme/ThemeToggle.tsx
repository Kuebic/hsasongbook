/**
 * ThemeToggle Component
 *
 * Dropdown menu for switching between light, dark, and system themes.
 * Uses animated Sun/Moon icons to indicate current theme.
 *
 * Pattern: Based on shadcn/ui official theme toggle component
 * @see https://ui.shadcn.com/docs/dark-mode/vite
 */

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from './ThemeProvider';

/**
 * Theme Toggle Component
 *
 * Displays a button with animated Sun/Moon icon that opens a dropdown
 * menu to select theme preference (Light, Dark, or System).
 *
 * Features:
 * - Animated icon transition between Sun (light) and Moon (dark)
 * - Keyboard accessible (Tab, Enter, Arrow keys)
 * - Screen reader support (aria-label, sr-only text)
 * - Dropdown with 3 theme options
 *
 * Usage:
 * ```tsx
 * // In DesktopHeader or Settings page:
 * import { ThemeToggle } from '@/lib/theme/ThemeToggle';
 *
 * function Header() {
 *   return (
 *     <div>
 *       <ThemeToggle />
 *     </div>
 *   );
 * }
 * ```
 *
 * The component automatically reads and updates theme state via useTheme() hook.
 */
export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Toggle theme">
          {/* Sun icon - visible in light mode, hidden in dark mode */}
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          {/* Moon icon - hidden in light mode, visible in dark mode */}
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          {/* Screen reader only text */}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
