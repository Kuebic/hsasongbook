/**
 * User Appearance Provider
 *
 * Manages user appearance preferences:
 * - Loads preferences from Convex DB for authenticated users
 * - Applies CSS variables to document root
 * - Provides actions to update preferences
 */

import React, { useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/features/auth";
import { UserAppearanceContext } from "./UserAppearanceContext";
import type {
  AppearancePreferences,
  AppearanceContextValue,
  ResolvedAppearance,
} from "../types/appearance.types";
import {
  getPrimaryColor,
  getAccentColor,
  getThemePreset,
  getColorById,
  DEFAULT_PRESET_ID,
} from "../presets/colorPresets";
import {
  getAppFont,
  getLyricsFont,
  getChordFont,
  DEFAULT_APP_FONT_ID,
  DEFAULT_LYRICS_FONT_ID,
  DEFAULT_LYRICS_FONT_SIZE,
  DEFAULT_CHORD_FONT_ID,
  DEFAULT_FONT_SIZE,
  DEFAULT_CHORD_FONT_SIZE,
  DEFAULT_CHORD_FONT_WEIGHT,
} from "../presets/fontPresets";

interface UserAppearanceProviderProps {
  children: React.ReactNode;
}

/**
 * Resolve preferences to actual CSS values
 */
function resolveAppearance(
  prefs: AppearancePreferences | null,
  isDarkMode: boolean
): ResolvedAppearance {
  // Determine colors
  let primaryColorHsl: string;
  let accentColorHsl: string;

  if (prefs?.colorPreset) {
    // Using a preset
    const preset = getThemePreset(prefs.colorPreset);
    if (preset) {
      const primaryColor = getPrimaryColor(preset.primaryId);
      const accentColor = getAccentColor(preset.accentId);
      primaryColorHsl = isDarkMode
        ? (primaryColor?.dark ?? "143 30% 55%")
        : (primaryColor?.light ?? "143 25% 40%");
      accentColorHsl = isDarkMode
        ? (accentColor?.dark ?? "16 45% 50%")
        : (accentColor?.light ?? "16 50% 55%");
    } else {
      // Fallback to defaults
      primaryColorHsl = isDarkMode ? "143 30% 55%" : "143 25% 40%";
      accentColorHsl = isDarkMode ? "16 45% 50%" : "16 50% 55%";
    }
  } else if (prefs?.primaryColorId && prefs?.accentColorId) {
    // Custom mix
    const primaryColor = getPrimaryColor(prefs.primaryColorId);
    const accentColor = getAccentColor(prefs.accentColorId);
    primaryColorHsl = isDarkMode
      ? (primaryColor?.dark ?? "143 30% 55%")
      : (primaryColor?.light ?? "143 25% 40%");
    accentColorHsl = isDarkMode
      ? (accentColor?.dark ?? "16 45% 50%")
      : (accentColor?.light ?? "16 50% 55%");
  } else {
    // Default preset
    const defaultPreset = getThemePreset(DEFAULT_PRESET_ID)!;
    const primaryColor = getPrimaryColor(defaultPreset.primaryId)!;
    const accentColor = getAccentColor(defaultPreset.accentId)!;
    primaryColorHsl = isDarkMode ? primaryColor.dark : primaryColor.light;
    accentColorHsl = isDarkMode ? accentColor.dark : accentColor.light;
  }

  // Determine fonts
  const appFont = getAppFont(prefs?.fontFamily ?? DEFAULT_APP_FONT_ID);
  const lyricsFont = getLyricsFont(prefs?.lyricsFontFamily ?? DEFAULT_LYRICS_FONT_ID);
  const chordFont = getChordFont(prefs?.chordFontFamily ?? DEFAULT_CHORD_FONT_ID);

  // Determine chord color
  let chordColorHsl: string;
  if (prefs?.chordColorId) {
    const chordColor = getColorById(prefs.chordColorId);
    chordColorHsl = isDarkMode
      ? (chordColor?.dark ?? accentColorHsl)
      : (chordColor?.light ?? accentColorHsl);
  } else {
    // Default to accent color
    chordColorHsl = accentColorHsl;
  }

  // Map font weight to numeric value
  const weightMap = {
    normal: "400",
    medium: "500",
    bold: "700",
  };
  const chordWeight =
    weightMap[prefs?.chordFontWeight ?? DEFAULT_CHORD_FONT_WEIGHT] ?? "700";

  return {
    primaryColor: primaryColorHsl,
    accentColor: accentColorHsl,
    fontFamily: appFont?.stack ?? "system-ui, sans-serif",
    fontSize: prefs?.fontSize ?? DEFAULT_FONT_SIZE,
    lyricsFontFamily:
      lyricsFont?.id === "inherit" ? "inherit" : (lyricsFont?.stack ?? "inherit"),
    lyricsFontSize: prefs?.lyricsFontSize ?? DEFAULT_LYRICS_FONT_SIZE,
    chordFontFamily:
      chordFont?.id === "inherit" ? "inherit" : (chordFont?.stack ?? "inherit"),
    chordFontSize: prefs?.chordFontSize ?? DEFAULT_CHORD_FONT_SIZE,
    chordFontWeight: chordWeight,
    chordColor: chordColorHsl,
    chordHighlight: prefs?.chordHighlight ?? false,
  };
}

/**
 * Apply resolved appearance to CSS variables
 */
function applyCssVariables(resolved: ResolvedAppearance): void {
  const root = document.documentElement;

  // Apply primary and accent colors
  root.style.setProperty("--primary", resolved.primaryColor);
  root.style.setProperty("--accent", resolved.accentColor);

  // Sync ring and input colors with primary for consistent theming
  root.style.setProperty("--ring", resolved.primaryColor);
  root.style.setProperty("--input", resolved.primaryColor);

  // Apply font settings
  root.style.setProperty("--font-app", resolved.fontFamily);
  root.style.setProperty("--font-scale", resolved.fontSize.toString());

  // Apply lyrics settings
  root.style.setProperty(
    "--font-lyrics",
    resolved.lyricsFontFamily === "inherit" ? "var(--font-app)" : resolved.lyricsFontFamily
  );
  root.style.setProperty("--lyrics-size-scale", resolved.lyricsFontSize.toString());

  // Apply chord settings
  root.style.setProperty(
    "--font-chord",
    resolved.chordFontFamily === "inherit" ? "var(--font-app)" : resolved.chordFontFamily
  );
  root.style.setProperty("--chord-color", resolved.chordColor);
  root.style.setProperty("--chord-weight", resolved.chordFontWeight);
  root.style.setProperty("--chord-size-scale", resolved.chordFontSize.toString());

  // Apply chord highlight
  if (resolved.chordHighlight) {
    root.style.setProperty("--chord-highlight-bg", "hsl(var(--muted) / 0.5)");
    root.style.setProperty("--chord-highlight-padding", "0.125rem 0.25rem");
  } else {
    root.style.setProperty("--chord-highlight-bg", "transparent");
    root.style.setProperty("--chord-highlight-padding", "0");
  }
}

/**
 * Reset CSS variables to defaults
 */
function resetCssVariables(): void {
  const root = document.documentElement;
  const propsToRemove = [
    "--primary",
    "--accent",
    "--ring",
    "--input",
    "--font-app",
    "--font-scale",
    "--font-lyrics",
    "--lyrics-size-scale",
    "--font-chord",
    "--chord-color",
    "--chord-weight",
    "--chord-size-scale",
    "--chord-highlight-bg",
    "--chord-highlight-padding",
  ];
  propsToRemove.forEach((prop) => root.style.removeProperty(prop));
}

export function UserAppearanceProvider({ children }: UserAppearanceProviderProps) {
  const { user } = useAuth();
  const isAuthenticated = user && !user.isAnonymous;

  // Query preferences from Convex (only for authenticated users)
  const dbPreferences = useQuery(
    api.userAppearancePreferences.get,
    isAuthenticated ? {} : "skip"
  );

  // Mutations
  const upsertMutation = useMutation(api.userAppearancePreferences.upsert);
  const resetMutation = useMutation(api.userAppearancePreferences.reset);

  // Determine if dark mode is active
  const isDarkMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  }, []);

  // Convert DB preferences to our type
  const preferences: AppearancePreferences = useMemo(() => {
    if (!dbPreferences) return {};
    return {
      colorPreset: dbPreferences.colorPreset ?? undefined,
      primaryColorId: dbPreferences.primaryColorId ?? undefined,
      accentColorId: dbPreferences.accentColorId ?? undefined,
      fontFamily: dbPreferences.fontFamily ?? undefined,
      fontSize: dbPreferences.fontSize ?? undefined,
      lyricsFontFamily: dbPreferences.lyricsFontFamily ?? undefined,
      lyricsFontSize: dbPreferences.lyricsFontSize ?? undefined,
      chordFontFamily: dbPreferences.chordFontFamily ?? undefined,
      chordFontSize: dbPreferences.chordFontSize ?? undefined,
      chordFontWeight: dbPreferences.chordFontWeight as AppearancePreferences["chordFontWeight"],
      chordColorId: dbPreferences.chordColorId ?? undefined,
      chordHighlight: dbPreferences.chordHighlight ?? undefined,
    };
  }, [dbPreferences]);

  // Resolve to CSS values
  const resolved = useMemo(
    () => resolveAppearance(preferences, isDarkMode),
    [preferences, isDarkMode]
  );

  // Apply CSS variables when resolved values change
  useEffect(() => {
    if (isAuthenticated) {
      applyCssVariables(resolved);
    }
    return () => {
      // Cleanup when provider unmounts or user logs out
      if (!isAuthenticated) {
        resetCssVariables();
      }
    };
  }, [resolved, isAuthenticated]);

  // Listen for theme changes to re-apply with correct dark/light colors
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          // Theme changed, re-resolve and apply
          const newIsDarkMode = document.documentElement.classList.contains("dark");
          const newResolved = resolveAppearance(preferences, newIsDarkMode);
          if (isAuthenticated) {
            applyCssVariables(newResolved);
          }
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, [preferences, isAuthenticated]);

  // Actions
  const updatePreference = useCallback(
    async <K extends keyof AppearancePreferences>(
      key: K,
      value: AppearancePreferences[K]
    ) => {
      if (!isAuthenticated) return;
      try {
        await upsertMutation({ [key]: value });
      } catch (error) {
        console.error("Failed to update preference:", error);
      }
    },
    [isAuthenticated, upsertMutation]
  );

  const applyPreset = useCallback(
    async (presetId: string) => {
      if (!isAuthenticated) return;
      try {
        await upsertMutation({
          colorPreset: presetId,
          primaryColorId: null, // Clear custom colors when using preset
          accentColorId: null, // Clear custom colors when using preset
        });
      } catch (error) {
        console.error("Failed to apply preset:", error);
      }
    },
    [isAuthenticated, upsertMutation]
  );

  const setCustomColors = useCallback(
    async (primaryId: string, accentId: string) => {
      if (!isAuthenticated) return;
      try {
        await upsertMutation({
          colorPreset: null, // Must explicitly set to null to clear preset
          primaryColorId: primaryId,
          accentColorId: accentId,
        });
      } catch (error) {
        console.error("Failed to set custom colors:", error);
      }
    },
    [isAuthenticated, upsertMutation]
  );

  const resetToDefaults = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      await resetMutation();
      resetCssVariables();
    } catch (error) {
      console.error("Failed to reset preferences:", error);
    }
  }, [isAuthenticated, resetMutation]);

  const contextValue: AppearanceContextValue = useMemo(
    () => ({
      preferences,
      resolved,
      isLoading: isAuthenticated && dbPreferences === undefined,
      updatePreference,
      applyPreset,
      setCustomColors,
      resetToDefaults,
    }),
    [
      preferences,
      resolved,
      isAuthenticated,
      dbPreferences,
      updatePreference,
      applyPreset,
      setCustomColors,
      resetToDefaults,
    ]
  );

  return (
    <UserAppearanceContext.Provider value={contextValue}>
      {children}
    </UserAppearanceContext.Provider>
  );
}
