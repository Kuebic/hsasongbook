/**
 * DesktopHeader Component
 *
 * Persistent navigation header for desktop viewports (≥ 768px).
 * Features:
 * - Sticky positioning at top of viewport
 * - App branding with clickable logo (navigates to home)
 * - Main navigation links (Search, Setlists, Profile - Settings accessible via Profile)
 * - Theme toggle for quick access
 * - Active page highlighting
 * - Backdrop blur effect for frosted glass appearance
 *
 * Hidden on mobile viewports (< 768px) where MobileNav is shown instead.
 */

import { Link, NavLink } from 'react-router-dom';
import { Home, List, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getZIndexClass } from '@/lib/config/zIndex';
import { ThemeToggle } from '@/lib/theme/ThemeToggle';

interface DesktopHeaderProps {
  /**
   * Additional CSS classes to apply to the header
   */
  className?: string;
}

/**
 * Desktop navigation header component
 *
 * Usage:
 * ```tsx
 * // In App.tsx:
 * <DesktopHeader className="hidden md:block" />
 * ```
 *
 * The header uses React Router's NavLink component for navigation,
 * which automatically highlights the active page.
 * Logo is clickable to navigate home.
 */
export default function DesktopHeader({ className }: DesktopHeaderProps) {
  return (
    <header
      className={cn(
        // Layout
        'sticky top-0 w-full border-b',
        // Backdrop blur effect (frosted glass)
        'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        // Z-index for proper stacking
        getZIndexClass('desktopHeader'),
        // Custom classes
        className
      )}
      role="banner"
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo/Branding - Clickable to home */}
        <Link
          to="/"
          className={cn(
            'flex items-center space-x-2',
            // Hover effect
            'transition-opacity hover:opacity-80',
            // Focus state for keyboard navigation
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md',
            // Padding for larger click target
            'px-2 py-1 -mx-2'
          )}
          aria-label="Go to homepage"
        >
          <Home className="h-6 w-6 text-primary" aria-hidden="true" />
          <h1 className="text-xl font-bold">HSA Songbook</h1>
        </Link>

        {/* Navigation Links + Theme Toggle */}
        <div className="flex items-center space-x-4">
          <nav role="navigation" aria-label="Main navigation">
            <ul className="flex items-center space-x-6">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  cn(
                    // Base styles
                    'inline-flex items-center space-x-2 px-3 py-2 rounded-md',
                    'text-sm font-medium transition-colors',
                    // Hover state
                    'hover:bg-accent hover:text-accent-foreground',
                    // Focus state (keyboard navigation)
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    // Active state (current page)
                    isActive && 'bg-accent text-accent-foreground'
                  )
                }
                aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                <span>Search</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/setlists"
                className={({ isActive }) =>
                  cn(
                    // Base styles
                    'inline-flex items-center space-x-2 px-3 py-2 rounded-md',
                    'text-sm font-medium transition-colors',
                    // Hover state
                    'hover:bg-accent hover:text-accent-foreground',
                    // Focus state (keyboard navigation)
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    // Active state (current page)
                    isActive && 'bg-accent text-accent-foreground'
                  )
                }
                aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
              >
                <List className="h-4 w-4" aria-hidden="true" />
                <span>Setlists</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  cn(
                    // Base styles
                    'inline-flex items-center space-x-2 px-3 py-2 rounded-md',
                    'text-sm font-medium transition-colors',
                    // Hover state
                    'hover:bg-accent hover:text-accent-foreground',
                    // Focus state (keyboard navigation)
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    // Active state (current page)
                    isActive && 'bg-accent text-accent-foreground'
                  )
                }
                aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
              >
                <User className="h-4 w-4" aria-hidden="true" />
                <span>Profile</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Theme Toggle (quick access) */}
        <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
