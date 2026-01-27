/**
 * Curated Color Presets
 *
 * All colors are designed to:
 * - Work in both light and dark modes
 * - Look professional and worship-appropriate
 * - Harmonize with any other color in the palette
 */

import type { CuratedColor, ThemePreset } from "../types/appearance.types";

// ============ PRIMARY COLORS ============
// Muted, professional colors suitable for main UI elements

export const primaryColors: CuratedColor[] = [
  // Greens
  {
    id: "sage",
    name: "Sage",
    light: "143 25% 40%",
    dark: "143 30% 55%",
  },
  {
    id: "teal",
    name: "Teal",
    light: "187 50% 40%",
    dark: "187 55% 50%",
  },
  {
    id: "forest",
    name: "Forest",
    light: "150 40% 30%",
    dark: "150 45% 45%",
  },
  {
    id: "emerald",
    name: "Emerald",
    light: "160 45% 35%",
    dark: "160 50% 50%",
  },

  // Blues
  {
    id: "navy",
    name: "Navy",
    light: "220 50% 35%",
    dark: "220 55% 50%",
  },
  {
    id: "slate",
    name: "Slate Blue",
    light: "215 30% 45%",
    dark: "215 35% 55%",
  },
  {
    id: "indigo",
    name: "Indigo",
    light: "245 40% 45%",
    dark: "245 45% 55%",
  },

  // Purples
  {
    id: "plum",
    name: "Plum",
    light: "300 25% 40%",
    dark: "300 30% 55%",
  },
  {
    id: "purple",
    name: "Purple",
    light: "270 35% 45%",
    dark: "270 40% 55%",
  },
  {
    id: "lavender-primary",
    name: "Lavender",
    light: "270 30% 50%",
    dark: "270 35% 60%",
  },

  // Warm tones
  {
    id: "terracotta-primary",
    name: "Terracotta",
    light: "16 45% 45%",
    dark: "16 50% 55%",
  },
  {
    id: "rust",
    name: "Rust",
    light: "20 55% 40%",
    dark: "20 60% 50%",
  },
  {
    id: "burgundy",
    name: "Burgundy",
    light: "345 45% 35%",
    dark: "345 50% 50%",
  },

  // Neutrals
  {
    id: "charcoal",
    name: "Charcoal",
    light: "220 15% 30%",
    dark: "220 20% 50%",
  },
  {
    id: "warm-gray",
    name: "Warm Gray",
    light: "30 10% 40%",
    dark: "30 15% 55%",
  },
];

// ============ ACCENT COLORS ============
// Vibrant colors that complement any primary color

export const accentColors: CuratedColor[] = [
  // Warm accents
  {
    id: "terracotta",
    name: "Terracotta",
    light: "16 50% 55%",
    dark: "16 45% 50%",
  },
  {
    id: "coral",
    name: "Coral",
    light: "15 70% 60%",
    dark: "15 65% 55%",
  },
  {
    id: "rose",
    name: "Rose",
    light: "340 50% 60%",
    dark: "340 45% 55%",
  },
  {
    id: "blush",
    name: "Blush",
    light: "350 40% 65%",
    dark: "350 35% 60%",
  },

  // Golden accents
  {
    id: "gold",
    name: "Gold",
    light: "45 80% 50%",
    dark: "45 75% 45%",
  },
  {
    id: "amber",
    name: "Amber",
    light: "38 90% 50%",
    dark: "38 85% 45%",
  },
  {
    id: "honey",
    name: "Honey",
    light: "42 70% 55%",
    dark: "42 65% 50%",
  },

  // Cool accents
  {
    id: "cyan",
    name: "Cyan",
    light: "190 80% 50%",
    dark: "190 75% 45%",
  },
  {
    id: "sky",
    name: "Sky Blue",
    light: "200 70% 55%",
    dark: "200 65% 50%",
  },
  {
    id: "seafoam",
    name: "Seafoam",
    light: "170 50% 50%",
    dark: "170 45% 45%",
  },

  // Purple accents
  {
    id: "lavender",
    name: "Lavender",
    light: "270 40% 60%",
    dark: "270 35% 55%",
  },
  {
    id: "lilac",
    name: "Lilac",
    light: "280 35% 65%",
    dark: "280 30% 60%",
  },

  // Soft accents
  {
    id: "cream",
    name: "Cream",
    light: "40 40% 75%",
    dark: "40 35% 70%",
  },
  {
    id: "peach",
    name: "Peach",
    light: "25 60% 70%",
    dark: "25 55% 65%",
  },
];

// ============ THEME PRESETS ============
// Complete themes with harmonious primary + accent combinations

export const themePresets: ThemePreset[] = [
  {
    id: "earth-tones",
    name: "Earth Tones",
    description: "Warm, natural",
    primaryId: "sage",
    accentId: "terracotta",
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Fresh, calming",
    primaryId: "teal",
    accentId: "coral",
  },
  {
    id: "forest",
    name: "Forest",
    description: "Rich, earthy",
    primaryId: "forest",
    accentId: "gold",
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Vibrant, warm",
    primaryId: "rust",
    accentId: "lavender",
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Cool, modern",
    primaryId: "navy",
    accentId: "cyan",
  },
  {
    id: "lavender-dreams",
    name: "Lavender",
    description: "Soft, gentle",
    primaryId: "purple",
    accentId: "rose",
  },
];

// ============ HELPER FUNCTIONS ============

export function getPrimaryColor(id: string): CuratedColor | undefined {
  return primaryColors.find((c) => c.id === id);
}

export function getAccentColor(id: string): CuratedColor | undefined {
  return accentColors.find((c) => c.id === id);
}

export function getThemePreset(id: string): ThemePreset | undefined {
  return themePresets.find((t) => t.id === id);
}

/**
 * Get all colors (for chord color picker which can use any color)
 */
export function getAllColors(): CuratedColor[] {
  return [...primaryColors, ...accentColors];
}

export function getColorById(id: string): CuratedColor | undefined {
  return getAllColors().find((c) => c.id === id);
}

// Default preset
export const DEFAULT_PRESET_ID = "earth-tones";
