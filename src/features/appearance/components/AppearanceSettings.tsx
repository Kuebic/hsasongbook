/**
 * Appearance Settings
 *
 * Main component for the appearance customization section in settings.
 * Combines all appearance controls with live preview.
 *
 * Exports:
 * - AppearanceSettings: Full component with Card wrapper (for standalone use)
 * - AppearanceSettingsContent: Content only (for use in accordion)
 */

import { useCallback } from "react";
import { RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/lib/theme/ThemeToggle";
import { useAuth } from "@/features/auth";
import { useAppearance } from "../context/UserAppearanceContext";
import { ThemePresetPicker } from "./ThemePresetPicker";
import { ColorPalettePicker } from "./ColorPalettePicker";
import { FontSelector } from "./FontSelector";
import { getThemePreset } from "../presets/colorPresets";

/**
 * AppearanceSettingsContent - Content without Card wrapper
 * For use in accordion or other container layouts
 */
export function AppearanceSettingsContent({ isAuthenticated }: { isAuthenticated: boolean }) {
  if (!isAuthenticated) {
    return <AppearanceSettingsLockedContent />;
  }
  return <AppearanceSettingsAuthenticatedContent />;
}

/**
 * AppearanceSettings - Full component with Card wrapper
 * For standalone use
 */
export function AppearanceSettings() {
  const { user } = useAuth();
  const isAuthenticated = user && !user.isAnonymous;

  // Only render the full settings if authenticated
  if (!isAuthenticated) {
    return <AppearanceSettingsLocked />;
  }

  return <AppearanceSettingsAuthenticated />;
}

/**
 * Locked content for anonymous users (no Card wrapper)
 */
function AppearanceSettingsLockedContent() {
  return (
    <div className="space-y-4">
      {/* Theme toggle is available for everyone */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="theme-toggle">Theme</Label>
          <p className="text-sm text-muted-foreground">
            Select your preferred theme or sync with your system
          </p>
        </div>
        <ThemeToggle />
      </div>

      <Separator />

      {/* Message about signing in */}
      <div className="rounded-lg bg-muted/50 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Sign in to unlock color themes, font customization, and chord styling options.
        </p>
      </div>
    </div>
  );
}

/**
 * Locked state for anonymous users (with Card wrapper)
 */
function AppearanceSettingsLocked() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize how the app looks and feels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AppearanceSettingsLockedContent />
      </CardContent>
    </Card>
  );
}

/**
 * Full settings for authenticated users
 */
function AppearanceSettingsAuthenticated() {
  const {
    preferences,
    isLoading,
    updatePreference,
    applyPreset,
    setCustomColors,
    resetToDefaults,
  } = useAppearance();

  // Determine current primary/accent IDs (from preset or custom)
  let currentPrimaryId = preferences.primaryColorId;
  let currentAccentId = preferences.accentColorId;

  if (preferences.colorPreset) {
    const preset = getThemePreset(preferences.colorPreset);
    if (preset) {
      currentPrimaryId = preset.primaryId;
      currentAccentId = preset.accentId;
    }
  }

  // Handlers
  const handlePresetSelect = useCallback(
    (presetId: string) => {
      applyPreset(presetId);
    },
    [applyPreset]
  );

  const handlePrimaryChange = useCallback(
    (colorId: string) => {
      setCustomColors(colorId, currentAccentId ?? "terracotta");
    },
    [setCustomColors, currentAccentId]
  );

  const handleAccentChange = useCallback(
    (colorId: string) => {
      setCustomColors(currentPrimaryId ?? "sage", colorId);
    },
    [setCustomColors, currentPrimaryId]
  );

  const handleFontFamilyChange = useCallback(
    (fontId: string) => {
      updatePreference("fontFamily", fontId);
    },
    [updatePreference]
  );

  const handleFontSizeChange = useCallback(
    (size: number) => {
      updatePreference("fontSize", size);
    },
    [updatePreference]
  );

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
      {/* Appearance Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize colors and fonts
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefaults}
              disabled={isLoading}
              className="text-muted-foreground"
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Theme Mode</Label>
              <p className="text-sm text-muted-foreground">
                Light, dark, or match your system
              </p>
            </div>
            <ThemeToggle />
          </div>

          <Separator />

          {/* Color Theme */}
          <div className="space-y-4">
            <ThemePresetPicker
              selectedPresetId={preferences.colorPreset}
              onSelectPreset={handlePresetSelect}
              disabled={isLoading}
            />

            <ColorPalettePicker
              primaryColorId={currentPrimaryId}
              accentColorId={currentAccentId}
              onPrimaryChange={handlePrimaryChange}
              onAccentChange={handleAccentChange}
              disabled={isLoading}
            />
          </div>

          <Separator />

          {/* Font Settings */}
          <FontSelector
            fontFamily={preferences.fontFamily}
            fontSize={preferences.fontSize}
            onFontFamilyChange={handleFontFamilyChange}
            onFontSizeChange={handleFontSizeChange}
            disabled={isLoading}
          />
        </CardContent>
      </Card>

      {/* Chord Display Card */}
      <Card>
        <CardHeader>
          <CardTitle>Chord Display</CardTitle>
          <CardDescription>
            Customize how chords appear in songs
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Live Preview */}
      <LivePreview className="sticky bottom-4" />
    </div>
  );
}
