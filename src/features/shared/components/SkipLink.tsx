/**
 * SkipLink Component
 *
 * Provides a "Skip to main content" link for keyboard users (WCAG 2.4.1 compliance).
 * The link is visually hidden by default and becomes visible when focused via Tab key.
 *
 * This allows keyboard and screen reader users to bypass repetitive navigation
 * and jump directly to the main content area.
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html
 */

import type { ReactNode } from 'react';
import { getZIndexClass } from '@/lib/config/zIndex';

interface SkipLinkProps {
  /**
   * The ID of the target element to skip to
   * @default 'main-content'
   */
  targetId?: string;

  /**
   * Custom text for the skip link
   * @default 'Skip to main content'
   */
  children?: ReactNode;
}

/**
 * Skip-to-content link component
 *
 * Usage:
 * ```tsx
 * // In App.tsx or layout component:
 * <SkipLink />
 *
 * // On target page:
 * <main id="main-content" tabIndex={-1}>
 *   {/* Page content *\/}
 * </main>
 * ```
 *
 * The target element should have `tabIndex={-1}` to allow programmatic focus
 * but not add it to the normal tab order.
 */
export default function SkipLink({
  targetId = 'main-content',
  children = 'Skip to main content',
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={`
        absolute left-0 top-0
        ${getZIndexClass('skipLink')}
        -translate-y-full
        focus:translate-y-0
        bg-primary text-primary-foreground
        px-4 py-2 rounded-b-md
        font-medium text-sm
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        transition-transform duration-200
      `}
    >
      {children}
    </a>
  );
}
