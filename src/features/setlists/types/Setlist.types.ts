/**
 * Setlist feature types
 *
 * Re-exports global types and defines feature-specific types
 * for setlist management functionality.
 */

import type { Setlist, SetlistSong } from '@/types';
import type { Arrangement } from '@/types';

// Re-export global types for convenience
export type { Setlist, SetlistSong };

/**
 * Sort options for setlist list view
 */
export interface SetlistSortOption {
  value: 'name' | 'date' | 'recent';
  label: string;
}

export const SETLIST_SORT_OPTIONS: Record<string, SetlistSortOption> = {
  NAME: { value: 'name', label: 'Name (A-Z)' },
  DATE: { value: 'date', label: 'Performance Date' },
  RECENT: { value: 'recent', label: 'Recently Updated' }
} as const;

/**
 * Validation errors for setlist form
 */
export interface SetlistValidationErrors {
  name?: string;
  performanceDate?: string;
  songs?: string;
}

/**
 * Form data for creating/editing setlists
 */
export interface SetlistFormData {
  name: string;
  description?: string;
  performanceDate?: string;
  // Phase 6 fields
  privacyLevel?: 'private' | 'unlisted' | 'public';
  tags?: string[];
  estimatedDuration?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Result from drag-and-drop operation
 */
export interface DragDropResult {
  sourceIndex: number;
  destinationIndex: number;
  setlistId: string;
}

/**
 * Performance mode settings
 */
export interface PerformanceModeSettings {
  showProgressBar: boolean;
  showControls: boolean;
  showChords: boolean;
  transposition: number;
}

/**
 * Setlist with loaded arrangements data
 * Used for displaying song details in performance mode
 */
export interface SetlistWithArrangements extends Setlist {
  arrangements: Map<string, Arrangement>; // arrangementId -> Arrangement
}
