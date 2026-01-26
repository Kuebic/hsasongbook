/**
 * Z-Index Management System for HSA Songbook PWA
 *
 * Centralized z-index configuration to prevent stacking conflicts
 * and provide semantic naming for UI layers.
 *
 * Layer hierarchy from lowest to highest:
 * - Base (0): Default document flow
 * - Dropdown (1000): Dropdown menus, popovers
 * - Sticky (1020): Sticky headers/footers
 * - Fixed Nav (1030-1040): Mobile and desktop navigation
 * - Overlay (1050-1070): Backdrops, modals, drawers
 * - Notifications (1080-1090): Toasts, update prompts
 * - Tooltip (1100): Highest priority UI elements
 *
 * Usage:
 * ```typescript
 * import { Z_INDEX, getZIndexClass } from '@/lib/config/zIndex';
 *
 * // In components:
 * <div className={getZIndexClass('mobileNav')}>...</div>
 *
 * // For inline styles:
 * <div style={{ zIndex: Z_INDEX.modal }}>...</div>
 * ```
 */

/**
 * Z-Index constants for all UI layers
 * Use these values for consistent stacking across the application
 */
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  youtubePip: 1024,      // YouTube picture-in-picture, above sticky but below player bar
  globalPlayer: 1025,    // Global media player bar
  mobileNav: 1030,
  desktopHeader: 1040,
  backdrop: 1050,
  modal: 1060,
  drawer: 1070,
  toast: 1080,
  updateNotification: 1090,
  skipLink: 1100,  // Always on top for accessibility
  tooltip: 1100,
} as const;

/**
 * Type representing all available z-index layers
 */
export type ZIndexLayer = keyof typeof Z_INDEX;

/**
 * Get Tailwind z-index class for a semantic layer
 *
 * @param layer - The semantic layer name
 * @returns Tailwind arbitrary z-index class (e.g., 'z-[1030]')
 *
 * @example
 * getZIndexClass('mobileNav') // => 'z-[1030]'
 * getZIndexClass('modal') // => 'z-[1060]'
 */
export function getZIndexClass(layer: ZIndexLayer): string {
  return `z-[${Z_INDEX[layer]}]`;
}

/**
 * Get raw z-index value for inline styles
 *
 * @param layer - The semantic layer name
 * @returns Numeric z-index value
 *
 * @example
 * getZIndexValue('modal') // => 1060
 *
 * // Usage with inline styles:
 * <div style={{ zIndex: getZIndexValue('modal') }}>...</div>
 */
export function getZIndexValue(layer: ZIndexLayer): number {
  return Z_INDEX[layer];
}

/**
 * Validate z-index hierarchy (development helper)
 * Ensures no layers have conflicting or out-of-order values
 *
 * @returns Object with validation status and any errors found
 */
export function validateZIndexHierarchy(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const layers = Object.entries(Z_INDEX);

  // Check for duplicate values (except intentional ones like skipLink and tooltip)
  const values = layers.map(([, value]) => value);
  const uniqueValues = new Set(values);

  if (values.length - uniqueValues.size > 1) {
    // More than one duplicate (skipLink and tooltip are intentionally the same)
    errors.push('Found unexpected duplicate z-index values');
  }

  // Verify expected hierarchy
  const expectedOrder: [ZIndexLayer, ZIndexLayer][] = [
    ['base', 'dropdown'],
    ['dropdown', 'sticky'],
    ['sticky', 'mobileNav'],
    ['mobileNav', 'desktopHeader'],
    ['desktopHeader', 'backdrop'],
    ['backdrop', 'modal'],
    ['modal', 'drawer'],
    ['drawer', 'toast'],
    ['toast', 'updateNotification'],
  ];

  for (const [lower, higher] of expectedOrder) {
    if (Z_INDEX[lower] >= Z_INDEX[higher]) {
      errors.push(`Z-index hierarchy violation: ${lower} (${Z_INDEX[lower]}) should be less than ${higher} (${Z_INDEX[higher]})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
