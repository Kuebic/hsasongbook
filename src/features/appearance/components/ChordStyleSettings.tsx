/**
 * Chord Style Settings
 *
 * Controls for customizing chord display: font, size, weight, color, and highlight.
 */

import type { ChangeEvent, KeyboardEvent } from "react";
import { useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  chordFonts,
  DEFAULT_CHORD_FONT_ID,
  DEFAULT_CHORD_FONT_SIZE,
  DEFAULT_CHORD_FONT_WEIGHT,
  CHORD_FONT_SIZE_MIN,
  CHORD_FONT_SIZE_MAX,
} from "../presets/fontPresets";
import { accentColors, primaryColors } from "../presets/colorPresets";
import type { CuratedColor } from "../types/appearance.types";

// Preset percentage options for chord size dropdown
const CHORD_SIZE_PRESETS = [80, 90, 100, 110, 120, 130, 140];

// Combine colors for chord color picker
const allChordColors: CuratedColor[] = [...accentColors, ...primaryColors];

interface ChordStyleSettingsProps {
  chordFontFamily: string | undefined;
  chordFontSize: number | undefined;
  chordFontWeight: "normal" | "medium" | "bold" | undefined;
  chordColorId: string | null | undefined;
  chordHighlight: boolean | undefined;
  accentColorId: string | undefined; // For "use accent" option
  onChordFontFamilyChange: (fontId: string) => void;
  onChordFontSizeChange: (size: number) => void;
  onChordFontWeightChange: (weight: "normal" | "medium" | "bold") => void;
  onChordColorIdChange: (colorId: string | null) => void;
  onChordHighlightChange: (highlight: boolean) => void;
  disabled?: boolean;
}

export function ChordStyleSettings({
  chordFontFamily,
  chordFontSize,
  chordFontWeight,
  chordColorId,
  chordHighlight,
  accentColorId,
  onChordFontFamilyChange,
  onChordFontSizeChange,
  onChordFontWeightChange,
  onChordColorIdChange,
  onChordHighlightChange,
  disabled,
}: ChordStyleSettingsProps) {
  const currentFontId = chordFontFamily ?? DEFAULT_CHORD_FONT_ID;
  const currentSize = chordFontSize ?? DEFAULT_CHORD_FONT_SIZE;
  const currentWeight = chordFontWeight ?? DEFAULT_CHORD_FONT_WEIGHT;
  const useAccentColor = chordColorId === null || chordColorId === undefined;

  // Convert size to percentage for display
  const sizePercent = Math.round(currentSize * 100);
  const isCustomSize = !CHORD_SIZE_PRESETS.includes(sizePercent);
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
      onChordFontSizeChange(percent / 100);
    }
  };

  // Handle custom input changes
  const handleCustomInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCustomInputValue(e.target.value);
  };

  // Apply custom input value on blur
  const handleCustomInputBlur = () => {
    const percent = parseInt(customInputValue, 10);
    const min = Math.round(CHORD_FONT_SIZE_MIN * 100);
    const max = Math.round(CHORD_FONT_SIZE_MAX * 100);

    if (!isNaN(percent) && percent >= min && percent <= max) {
      onChordFontSizeChange(percent / 100);
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
      {/* Chord Font Family */}
      <div className="space-y-2">
        <Label htmlFor="chord-font">Chord Font</Label>
        <Select
          value={currentFontId}
          onValueChange={onChordFontFamilyChange}
          disabled={disabled}
        >
          <SelectTrigger id="chord-font">
            <SelectValue placeholder="Select a font" />
          </SelectTrigger>
          <SelectContent>
            {chordFonts.map((font) => (
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

      {/* Chord Weight */}
      <div className="space-y-2">
        <Label htmlFor="chord-weight">Chord Weight</Label>
        <Select
          value={currentWeight}
          onValueChange={(value) =>
            onChordFontWeightChange(value as "normal" | "medium" | "bold")
          }
          disabled={disabled}
        >
          <SelectTrigger id="chord-weight">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chord Size */}
      <div className="space-y-2">
        <Label htmlFor="chord-size">Chord Size</Label>
        <div className="flex gap-2">
          <Select
            value={showCustomInput ? "custom" : sizePercent.toString()}
            onValueChange={handleSizeSelect}
            disabled={disabled}
          >
            <SelectTrigger id="chord-size" className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHORD_SIZE_PRESETS.map((percent) => (
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
                aria-label="Custom chord size percentage"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          )}
        </div>
      </div>

      {/* Chord Color - spans both columns */}
      <div className="space-y-3 sm:col-span-2">
        <Label>Chord Color</Label>

        {/* "Use accent color" option */}
        <button
          onClick={() => onChordColorIdChange(null)}
          disabled={disabled}
          className={cn(
            "flex w-full items-center gap-2 rounded-md border p-2.5 text-sm transition-colors",
            "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            useAccentColor ? "border-primary bg-primary/5" : "border-border",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <div
            className="h-5 w-5 rounded-full border"
            style={{
              backgroundColor: `hsl(${
                accentColors.find((c) => c.id === accentColorId)?.light ??
                "16 50% 55%"
              })`,
            }}
          />
          <span className="flex-1 text-left">Use accent color</span>
          {useAccentColor && <Check className="h-4 w-4 text-primary" />}
        </button>

        {/* Color palette */}
        <div className="flex flex-wrap gap-1.5">
          {allChordColors.map((color) => {
            const isSelected = chordColorId === color.id;
            return (
              <button
                key={color.id}
                onClick={() => onChordColorIdChange(color.id)}
                disabled={disabled}
                className={cn(
                  "relative h-7 w-7 rounded-full border-2 transition-all",
                  "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  isSelected
                    ? "border-foreground shadow-md"
                    : "border-transparent hover:border-muted-foreground/30",
                  disabled && "cursor-not-allowed opacity-50 hover:scale-100"
                )}
                style={{ backgroundColor: `hsl(${color.light})` }}
                title={color.name}
              >
                {isSelected && (
                  <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chord Highlight - spans both columns */}
      <div className="flex items-center justify-between sm:col-span-2">
        <div className="space-y-0.5">
          <Label htmlFor="chord-highlight">Highlight Chords</Label>
          <p className="text-xs text-muted-foreground">
            Add a subtle background to chords
          </p>
        </div>
        <Switch
          id="chord-highlight"
          checked={chordHighlight ?? false}
          onCheckedChange={onChordHighlightChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
