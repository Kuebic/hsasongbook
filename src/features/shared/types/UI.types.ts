/**
 * Shared UI component types
 */

import type { ComponentType } from 'react';

/**
 * Loading state
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Navigation item
 */
export interface NavigationItem {
  label: string;
  path: string;
  icon?: ComponentType;
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  label: string;
  path?: string;
}

/**
 * Sort selector option
 */
export interface SortSelectorOption<T = string> {
  value: T;
  label: string;
  icon?: ComponentType;
}
