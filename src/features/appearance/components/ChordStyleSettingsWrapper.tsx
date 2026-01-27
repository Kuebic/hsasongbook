/**
 * ChordStyleSettingsWrapper
 *
 * Wrapper component that provides the ChordStyleSettings with
 * the necessary context and handlers from useAppearance.
 * Used in the accordion to keep chord settings as a separate section.
 */

import { useCallback } from "react";
import { useAppearance } from "../context/UserAppearanceContext";
import { ChordStyleSettings } from "./ChordStyleSettings";
import { LivePreview } from "./LivePreview";
import { getThemePreset } from "../presets/colorPresets";

export function ChordStyleSettingsWrapper() {
  const {
    preferences,
    isLoading,
    updatePreference,
  } = useAppearance();

  // Determine current accent ID (from preset or custom)
  let currentAccentId = preferences.accentColorId;

  if (preferences.colorPreset) {
    const preset = getThemePreset(preferences.colorPreset);
    if (preset) {
      currentAccentId = preset.accentId;
    }
  }

  // Handlers
  const handleChordFontFamilyChange = useCallback(
    (fontId: string) => {
      updatePreference("chordFontFamily", fontId);
    },
    [updatePreference]
  );

  const handleChordFontSizeChange = useCallback(
    (size: number) => {
      updatePreference("chordFontSize", size);
    },
    [updatePreference]
  );

  const handleChordFontWeightChange = useCallback(
    (weight: "normal" | "medium" | "bold") => {
      updatePreference("chordFontWeight", weight);
    },
    [updatePreference]
  );

  const handleChordColorIdChange = useCallback(
    (colorId: string | null) => {
      updatePreference("chordColorId", colorId ?? undefined);
    },
    [updatePreference]
  );

  const handleChordHighlightChange = useCallback(
    (highlight: boolean) => {
      updatePreference("chordHighlight", highlight);
    },
    [updatePreference]
  );

  return (
    <div className="space-y-6">
      <ChordStyleSettings
        chordFontFamily={preferences.chordFontFamily}
        chordFontSize={preferences.chordFontSize}
        chordFontWeight={preferences.chordFontWeight}
        chordColorId={preferences.chordColorId}
        chordHighlight={preferences.chordHighlight}
        accentColorId={currentAccentId}
        onChordFontFamilyChange={handleChordFontFamilyChange}
        onChordFontSizeChange={handleChordFontSizeChange}
        onChordFontWeightChange={handleChordFontWeightChange}
        onChordColorIdChange={handleChordColorIdChange}
        onChordHighlightChange={handleChordHighlightChange}
        disabled={isLoading}
      />
      <LivePreview />
    </div>
  );
}
