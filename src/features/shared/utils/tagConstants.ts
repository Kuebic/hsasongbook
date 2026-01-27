/**
 * Curated constants for tags, themes, and categorization.
 * Used for autocomplete suggestions and validation.
 */

// Curated theme suggestions for songs
// Unification Church theology-specific themes
export const THEME_SUGGESTIONS = [
  // Core Unification Themes
  'true-love',
  'true-parents',
  'heart-of-god',
  'restoration',
  'indemnity',
  'blessing',
  'lineage',
  'unity',
  'liberation',
  'kingdom',
  'family',

  // Providence & Mission
  'victory',
  'dedication',
  'mission',
  'sacrifice',
  'pioneering',

  // Spiritual Life
  'heart',
  'attendance',
  'offering',
  'devotion',
  'gratitude',
  'faith',

  // Vision & Hope
  'new-age',
  'fatherland',
  'eden',
  'peace',
  'hope',
  'joy',

  // Creation & Nature
  'creation',
  'nature',

  // Relationships
  'filial-piety',
  'brotherhood',
  'service',

  // Occasions
  'holy-days',
  'blessing-ceremony',

  // General Worship Themes
  'praise',
  'worship',
  'prayer',
  'guidance',

  // Additional UC-Specific Themes
  'homecoming',
  'youth',
  'cultural',
  'christmas',
] as const;

export type ThemeSuggestion = (typeof THEME_SUGGESTIONS)[number];

// Arrangement instrument options
export const INSTRUMENT_OPTIONS = [
  { value: 'guitar', label: 'Guitar' },
  { value: 'piano', label: 'Piano' },
] as const;

export type InstrumentOption = (typeof INSTRUMENT_OPTIONS)[number]['value'];

// Arrangement energy level options
export const ENERGY_OPTIONS = [
  { value: 'high', label: 'High Energy', colorClass: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'medium', label: 'Medium', colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'reflective', label: 'Reflective', colorClass: 'bg-blue-100 text-blue-800 border-blue-200' },
] as const;

export type EnergyOption = (typeof ENERGY_OPTIONS)[number]['value'];

// Arrangement style options
export const STYLE_OPTIONS = [
  { value: 'contemporary', label: 'Contemporary' },
  { value: 'traditional', label: 'Traditional' },
  { value: 'hymn-style', label: 'Hymn-style' },
  { value: 'gospel', label: 'Gospel' },
  { value: 'folk', label: 'Folk' },
  { value: 'acoustic-worship', label: 'Acoustic Worship' },
  { value: 'anthemic', label: 'Anthemic' },
] as const;

export type StyleOption = (typeof STYLE_OPTIONS)[number]['value'];

// Arrangement setting options (multi-select)
export const SETTING_OPTIONS = [
  { value: 'acoustic', label: 'Acoustic' },
  { value: 'full-band', label: 'Full Band' },
  { value: 'rock-band', label: 'Rock Band' },
  { value: 'camp', label: 'Camp' },
  { value: 'special-music', label: 'Special Music' },
  { value: 'congregational', label: 'Congregational' },
  { value: 'solo', label: 'Solo' },
  { value: 'small-group', label: 'Small Group' },
] as const;

export type SettingOption = (typeof SETTING_OPTIONS)[number]['value'];

// Free-form tag suggestions for arrangements (based on common usage patterns)
export const TAG_SUGGESTIONS = [
  'beginner-friendly',
  'wedding',
  'funeral',
  'baptism',
  'communion',
  'opening',
  'closing',
  'medley-ready',
  'singalong',
  'instrumental-intro',
] as const;

// Helper functions
export function getEnergyOption(value: string) {
  return ENERGY_OPTIONS.find((opt) => opt.value === value);
}

export function getStyleOption(value: string) {
  return STYLE_OPTIONS.find((opt) => opt.value === value);
}

export function getSettingOption(value: string) {
  return SETTING_OPTIONS.find((opt) => opt.value === value);
}

export function getInstrumentOption(value: string) {
  return INSTRUMENT_OPTIONS.find((opt) => opt.value === value);
}
