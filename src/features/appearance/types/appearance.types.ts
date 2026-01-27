/**
 * Appearance Types
 *
 * Type definitions for user appearance preferences and color/font presets.
 */

// ============ COLOR TYPES ============

/**
 * A curated color with light and dark mode HSL values
 */
export interface CuratedColor {
  id: string;
  name: string;
  light: string; // HSL values: "143 25% 40%"
  dark: string; // HSL values for dark mode
}

/**
 * A complete theme preset with primary + accent colors
 */
export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  primaryId: string; // References CuratedColor.id
  accentId: string; // References CuratedColor.id
}

// ============ FONT TYPES ============

/**
 * A font family option
 */
export interface FontPreset {
  id: string;
  name: string;
  stack: string; // CSS font-family stack
  category: "sans" | "serif" | "mono";
}

// ============ PREFERENCE TYPES ============

/**
 * User appearance preferences (matches Convex schema)
 */
export interface AppearancePreferences {
  // Color theme
  colorPreset?: string | null; // Preset ID or null for custom
  primaryColorId?: string; // For custom mix
  accentColorId?: string; // For custom mix

  // App-wide fonts
  fontFamily?: string; // Font preset ID
  fontSize?: number; // Scale: 0.85-1.25

  // Chord-specific styling
  chordFontFamily?: string; // "inherit" or font preset ID
  chordFontSize?: number; // Scale: 0.8-1.4
  chordFontWeight?: "normal" | "medium" | "bold";
  chordColorId?: string | null; // Color ID or null = use accent
  chordHighlight?: boolean;
}

/**
 * Resolved appearance values (with actual CSS values, not IDs)
 */
export interface ResolvedAppearance {
  // Colors (HSL values)
  primaryColor: string;
  accentColor: string;

  // Fonts
  fontFamily: string; // CSS font-family stack
  fontSize: number;

  // Chord styling
  chordFontFamily: string;
  chordFontSize: number;
  chordFontWeight: string;
  chordColor: string;
  chordHighlight: boolean;
}

// ============ CONTEXT TYPES ============

/**
 * Appearance context value
 */
export interface AppearanceContextValue {
  // Current preferences (raw from DB or defaults)
  preferences: AppearancePreferences;

  // Resolved values for easy access
  resolved: ResolvedAppearance;

  // Loading state
  isLoading: boolean;

  // Actions
  updatePreference: <K extends keyof AppearancePreferences>(
    key: K,
    value: AppearancePreferences[K]
  ) => Promise<void>;

  applyPreset: (presetId: string) => Promise<void>;

  setCustomColors: (primaryId: string, accentId: string) => Promise<void>;

  resetToDefaults: () => Promise<void>;
}
