/**
 * Font Presets
 *
 * Available font families for the app and chord display.
 * Uses system fonts and Google Fonts via @fontsource packages.
 */

import type { FontPreset } from "../types/appearance.types";

// ============ APP FONTS ============
// General-purpose fonts for the entire application

export const appFonts: FontPreset[] = [
  {
    id: "system",
    name: "System Default",
    stack: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    category: "sans",
  },
  {
    id: "inter",
    name: "Inter",
    stack: "'Inter', system-ui, -apple-system, sans-serif",
    category: "sans",
  },
  {
    id: "source-sans",
    name: "Source Sans",
    stack: "'Source Sans 3', 'Source Sans Pro', system-ui, sans-serif",
    category: "sans",
  },
  {
    id: "lora",
    name: "Lora",
    stack: "'Lora', Georgia, 'Times New Roman', serif",
    category: "serif",
  },
  {
    id: "merriweather",
    name: "Merriweather",
    stack: "'Merriweather', Georgia, 'Times New Roman', serif",
    category: "serif",
  },
  {
    id: "crimson",
    name: "Crimson Text",
    stack: "'Crimson Text', Georgia, serif",
    category: "serif",
  },
];

// ============ CHORD FONTS ============
// Fonts specifically designed for chord display (includes monospace options)

export const chordFonts: FontPreset[] = [
  {
    id: "inherit",
    name: "Same as App",
    stack: "inherit",
    category: "sans",
  },
  {
    id: "mono",
    name: "Monospace",
    stack: "'Source Code Pro', 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', monospace",
    category: "mono",
  },
  // Include all app fonts as options for chords too
  ...appFonts,
];

// ============ HELPER FUNCTIONS ============

export function getAppFont(id: string): FontPreset | undefined {
  return appFonts.find((f) => f.id === id);
}

export function getChordFont(id: string): FontPreset | undefined {
  return chordFonts.find((f) => f.id === id);
}

// Defaults
export const DEFAULT_APP_FONT_ID = "system";
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

// Font size constraints (kept for chord font size slider if needed)
export const FONT_SIZE_MIN = 0.85;
export const FONT_SIZE_MAX = 1.25;
export const CHORD_FONT_SIZE_MIN = 0.8;
export const CHORD_FONT_SIZE_MAX = 1.4;
