/**
 * Lyrics Style Settings
 *
 * Controls for customizing lyrics display: font and size.
 */

import type { ChangeEvent, KeyboardEvent } from "react";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  lyricsFonts,
  DEFAULT_LYRICS_FONT_ID,
  DEFAULT_LYRICS_FONT_SIZE,
  LYRICS_FONT_SIZE_MIN,
  LYRICS_FONT_SIZE_MAX,
} from "../presets/fontPresets";

// Preset percentage options for lyrics size dropdown
const LYRICS_SIZE_PRESETS = [80, 90, 100, 110, 120, 130, 140];

interface LyricsStyleSettingsProps {
  lyricsFontFamily: string | undefined;
  lyricsFontSize: number | undefined;
  onLyricsFontFamilyChange: (fontId: string) => void;
  onLyricsFontSizeChange: (size: number) => void;
  disabled?: boolean;
}

export function LyricsStyleSettings({
  lyricsFontFamily,
  lyricsFontSize,
  onLyricsFontFamilyChange,
  onLyricsFontSizeChange,
  disabled,
}: LyricsStyleSettingsProps) {
  const currentFontId = lyricsFontFamily ?? DEFAULT_LYRICS_FONT_ID;
  const currentSize = lyricsFontSize ?? DEFAULT_LYRICS_FONT_SIZE;

  // Convert size to percentage for display
  const sizePercent = Math.round(currentSize * 100);
  const isCustomSize = !LYRICS_SIZE_PRESETS.includes(sizePercent);
  const [showCustomInput, setShowCustomInput] = useState(isCustomSize);
  const [customInputValue, setCustomInputValue] = useState(
    isCustomSize ? sizePercent.toString() : ""
  );

  // Handle dropdown selection
  const handleSizeSelect = (value: string) => {
    if (value === "custom") {
      setShowCustomInput(true);
      setCustomInputValue(sizePercent.toString());
    } else {
      setShowCustomInput(false);
      const percent = parseInt(value, 10);
      onLyricsFontSizeChange(percent / 100);
    }
  };

  // Handle custom input changes
  const handleCustomInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCustomInputValue(e.target.value);
  };

  // Apply custom input value on blur
  const handleCustomInputBlur = () => {
    const percent = parseInt(customInputValue, 10);
    const min = Math.round(LYRICS_FONT_SIZE_MIN * 100);
    const max = Math.round(LYRICS_FONT_SIZE_MAX * 100);

    if (!isNaN(percent) && percent >= min && percent <= max) {
      onLyricsFontSizeChange(percent / 100);
    } else {
      // Reset to current value if invalid
      setCustomInputValue(sizePercent.toString());
    }
  };

  // Handle Enter key
  const handleCustomInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCustomInputBlur();
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Lyrics Font Family */}
      <div className="space-y-2">
        <Label htmlFor="lyrics-font">Lyrics Font</Label>
        <Select
          value={currentFontId}
          onValueChange={onLyricsFontFamilyChange}
          disabled={disabled}
        >
          <SelectTrigger id="lyrics-font">
            <SelectValue placeholder="Select a font" />
          </SelectTrigger>
          <SelectContent>
            {lyricsFonts.map((font) => (
              <SelectItem
                key={font.id}
                value={font.id}
                style={{ fontFamily: font.id === "inherit" ? undefined : font.stack }}
              >
                {font.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lyrics Size */}
      <div className="space-y-2">
        <Label htmlFor="lyrics-size">Lyrics Size</Label>
        <div className="flex gap-2">
          <Select
            value={showCustomInput ? "custom" : sizePercent.toString()}
            onValueChange={handleSizeSelect}
            disabled={disabled}
          >
            <SelectTrigger id="lyrics-size" className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LYRICS_SIZE_PRESETS.map((percent) => (
                <SelectItem key={percent} value={percent.toString()}>
                  {percent}%
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom...</SelectItem>
            </SelectContent>
          </Select>
          {showCustomInput && (
            <div className="flex items-center gap-1">
              <Input
                type="text"
                inputMode="numeric"
                value={customInputValue}
                onChange={handleCustomInputChange}
                onBlur={handleCustomInputBlur}
                onKeyDown={handleCustomInputKeyDown}
                disabled={disabled}
                className="w-16 text-center"
                aria-label="Custom lyrics size percentage"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
