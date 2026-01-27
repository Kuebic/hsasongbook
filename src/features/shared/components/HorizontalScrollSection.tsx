/**
 * HorizontalScrollSection Component
 *
 * A reusable container for horizontally scrollable content sections.
 * Used for homepage discovery sections like Recently Viewed, Favorites, etc.
 *
 * Features:
 * - Horizontal scroll with snap points on mobile
 * - Shows "peek" of next item to invite scrolling
 * - Hides scrollbar for cleaner look
 * - Converts to grid layout on desktop
 */

import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HorizontalScrollSectionProps {
  /** Section title */
  title: string;
  /** Optional "View all" link URL */
  viewAllLink?: string;
  /** Section content (cards, chips, etc.) */
  children: ReactNode;
  /** Additional class name for the scroll container */
  className?: string;
  /** Gap between items (default: gap-4) */
  gap?: 'sm' | 'md' | 'lg';
  /** Whether to use grid layout on desktop (default: true) */
  gridOnDesktop?: boolean;
  /** Number of columns on desktop (default: 3) */
  desktopColumns?: 2 | 3 | 4;
}

const gapClasses = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

const columnClasses = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
};

export function HorizontalScrollSection({
  title,
  viewAllLink,
  children,
  className,
  gap = 'md',
  gridOnDesktop = true,
  desktopColumns = 3,
}: HorizontalScrollSectionProps) {
  return (
    <section className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-headline text-foreground">{title}</h2>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="group flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            <span>View all</span>
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      {/* Scrollable container */}
      <div
        className={cn(
          // Base styles
          'flex overflow-x-auto pb-2',
          // Horizontal scroll behavior
          'snap-x snap-mandatory scroll-smooth',
          // Hide scrollbar
          'scrollbar-hide',
          // Gap
          gapClasses[gap],
          // Convert to grid on desktop if enabled
          gridOnDesktop && `md:grid ${columnClasses[desktopColumns]} md:overflow-visible`,
          className
        )}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * HorizontalScrollItem - Wrapper for items in a horizontal scroll section
 *
 * Provides consistent sizing and snap behavior for scroll items.
 */
interface HorizontalScrollItemProps {
  children: ReactNode;
  className?: string;
  /** Width of the item (default: w-[280px]) */
  width?: 'sm' | 'md' | 'lg' | 'auto';
}

const widthClasses = {
  sm: 'w-[200px] min-w-[200px]',
  md: 'w-[280px] min-w-[280px]',
  lg: 'w-[320px] min-w-[320px]',
  auto: 'w-auto min-w-0',
};

export function HorizontalScrollItem({
  children,
  className,
  width = 'md',
}: HorizontalScrollItemProps) {
  return (
    <div
      className={cn(
        // Snap alignment
        'snap-start',
        // Fixed width on mobile, auto on desktop (grid takes over)
        widthClasses[width],
        'md:w-auto md:min-w-0',
        // Animation
        'animate-in fade-in-0 slide-in-from-right-2',
        className
      )}
    >
      {children}
    </div>
  );
}

export default HorizontalScrollSection;
