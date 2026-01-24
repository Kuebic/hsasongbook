/**
 * Filter Constants for Browse Page
 *
 * Centralized constants for filtering and sorting options.
 */

// Re-export shared difficulty options
export {
  DIFFICULTY_OPTIONS,
  type DifficultyOption as DifficultyLevel,
} from '@/features/shared';

export const TEMPO_RANGES = {
  slow: { label: 'Slow (<70 BPM)', min: 0, max: 69 },
  medium: { label: 'Medium (70-110 BPM)', min: 70, max: 110 },
  fast: { label: 'Fast (>110 BPM)', min: 111, max: 999 },
} as const;

export type TempoRange = keyof typeof TEMPO_RANGES;

export const DATE_PRESETS = {
  this_week: { label: 'This week', days: 7 },
  this_month: { label: 'This month', days: 30 },
  this_year: { label: 'This year', days: 365 },
} as const;

export type DatePreset = keyof typeof DATE_PRESETS;

export const MUSICAL_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F',
  'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
] as const;

export type MusicalKey = typeof MUSICAL_KEYS[number];

export const SORT_OPTIONS = {
  popular: { label: 'Most Popular', description: 'By arrangement count' },
  rating: { label: 'Highest Rated', description: 'By average rating' },
  newest: { label: 'Newest First', description: 'Recently added' },
  oldest: { label: 'Oldest First', description: 'First added' },
  alphabetical: { label: 'A to Z', description: 'Alphabetical' },
  alphabetical_desc: { label: 'Z to A', description: 'Reverse alphabetical' },
} as const;

export type SortOption = keyof typeof SORT_OPTIONS;

export const MIN_ARRANGEMENT_OPTIONS = [
  { value: 0, label: 'Any' },
  { value: 1, label: '1+' },
  { value: 2, label: '2+' },
  { value: 3, label: '3+' },
] as const;
