/**
 * Shared constants used across multiple features
 * This file contains constants that are needed by both shared components and domain features
 */

export const SORT_OPTIONS = {
  POPULAR: 'popular',
  RATING: 'rating',
  NEWEST: 'newest',
  OLDEST: 'oldest'
} as const;

export type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS];

/**
 * Difficulty options for arrangements
 * Used in both browse filters and arrangement forms
 */
export const DIFFICULTY_OPTIONS = {
  simple: { label: 'Simple', dots: '●○○' },
  standard: { label: 'Standard', dots: '●●○' },
  advanced: { label: 'Advanced', dots: '●●●' },
} as const;

export type DifficultyOption = keyof typeof DIFFICULTY_OPTIONS;
