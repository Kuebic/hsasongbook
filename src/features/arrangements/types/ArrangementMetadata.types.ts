/**
 * Arrangements feature types
 *
 * Re-export global types and add feature-specific types
 */

import type { ArrangementMetadata, SortOption } from '@/types';

// Re-export for convenience
export type { ArrangementMetadata, SortOption };

/**
 * Arrangement form validation errors
 */
export interface ArrangementValidationErrors {
  key?: string;
  tempo?: string;
  timeSignature?: string;
  capo?: string;
}

/**
 * Arrangement sorting configuration
 */
export interface SortConfiguration {
  option: SortOption;
  direction: 'asc' | 'desc';
}
