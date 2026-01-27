/**
 * Appearance Feature
 *
 * User appearance customization including colors, fonts, and chord styling.
 */

// Context
export { UserAppearanceProvider } from "./context/UserAppearanceProvider";
export { useAppearance, useAppearanceSafe } from "./context/UserAppearanceContext";

// Components
export { AppearanceSettings } from "./components/AppearanceSettings";
export { LivePreview } from "./components/LivePreview";

// Types
export type {
  AppearancePreferences,
  ResolvedAppearance,
  AppearanceContextValue,
  CuratedColor,
  ThemePreset,
  FontPreset,
} from "./types/appearance.types";

// Presets (for use in other parts of the app if needed)
export {
  primaryColors,
  accentColors,
  themePresets,
  getPrimaryColor,
  getAccentColor,
  getThemePreset,
  DEFAULT_PRESET_ID,
} from "./presets/colorPresets";

export {
  appFonts,
  chordFonts,
  getAppFont,
  getChordFont,
  DEFAULT_APP_FONT_ID,
  DEFAULT_CHORD_FONT_ID,
} from "./presets/fontPresets";
