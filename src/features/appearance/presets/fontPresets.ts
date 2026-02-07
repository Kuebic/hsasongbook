/**
 * Font Presets
 *
 * Available font families for the app and chord display.
 * Uses system fonts and Google Fonts via @fontsource packages.
 */

import type { FontPreset } from "../types/appearance.types";

// ============ APP FONTS ============
// Simplified to 3 visually distinct categories (sans, serif, mono).
// Named fonts like Inter, Lora, etc. were removed because they were never
// actually loaded (no @fontsource packages, no Google Fonts link), so they
// all fell back to the same system font anyway.

export const appFonts: FontPreset[] = [
  {
    id: "system",
    name: "Sans-serif",
    stack: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    category: "sans",
  },
  {
    id: "serif",
    name: "Serif",
    stack: "Georgia, 'Times New Roman', 'Noto Serif', serif",
    category: "serif",
  },
  {
    id: "mono",
    name: "Monospace",
    stack: "'SF Mono', Monaco, 'Cascadia Code', 'Fira Mono', 'Courier New', monospace",
    category: "mono",
  },
];

// ============ LYRICS FONTS ============
// "Same as App" + all app font categories

export const lyricsFonts: FontPreset[] = [
  {
    id: "inherit",
    name: "Same as App",
    stack: "inherit",
    category: "sans",
  },
  ...appFonts,
];

// ============ CHORD FONTS ============
// "Same as App" + all app font categories

export const chordFonts: FontPreset[] = [
  {
    id: "inherit",
    name: "Same as App",
    stack: "inherit",
    category: "sans",
  },
  ...appFonts,
];

// ============ HELPER FUNCTIONS ============

export function getAppFont(id: string): FontPreset | undefined {
  return appFonts.find((f) => f.id === id);
}

export function getLyricsFont(id: string): FontPreset | undefined {
  return lyricsFonts.find((f) => f.id === id);
}

export function getChordFont(id: string): FontPreset | undefined {
  return chordFonts.find((f) => f.id === id);
}

// Defaults
export const DEFAULT_APP_FONT_ID = "system";
export const DEFAULT_LYRICS_FONT_ID = "inherit";
export const DEFAULT_LYRICS_FONT_SIZE = 1;
export const DEFAULT_CHORD_FONT_ID = "inherit";
export const DEFAULT_FONT_SIZE = 1;
export const DEFAULT_CHORD_FONT_SIZE = 1;
export const DEFAULT_CHORD_FONT_WEIGHT = "bold" as const;

// ============ DISCRETE FONT SIZE OPTIONS ============
// Simplified font size choices instead of granular slider

export interface FontSizeOption {
  id: string;
  label: string;
  scale: number;
}

export const fontSizeOptions: FontSizeOption[] = [
  { id: "compact", label: "Compact", scale: 0.85 },
  { id: "normal", label: "Normal", scale: 1.0 },
  { id: "large", label: "Large", scale: 1.15 },
  { id: "x-large", label: "Extra Large", scale: 1.25 },
];

export function getFontSizeOption(id: string): FontSizeOption | undefined {
  return fontSizeOptions.find((o) => o.id === id);
}

export function getFontSizeIdFromScale(scale: number): string {
  // Find the closest matching option
  const closest = fontSizeOptions.reduce((prev, curr) =>
    Math.abs(curr.scale - scale) < Math.abs(prev.scale - scale) ? curr : prev
  );
  return closest.id;
}

// Font size constraints
export const FONT_SIZE_MIN = 0.85;
export const FONT_SIZE_MAX = 1.25;
export const LYRICS_FONT_SIZE_MIN = 0.8;
export const LYRICS_FONT_SIZE_MAX = 1.4;
export const CHORD_FONT_SIZE_MIN = 0.8;
export const CHORD_FONT_SIZE_MAX = 1.4;
