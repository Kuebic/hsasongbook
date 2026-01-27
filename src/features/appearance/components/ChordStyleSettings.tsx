/**
 * Chord Style Settings
 *
 * Controls for customizing chord display: font, size, weight, color, and highlight.
 */

import { Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
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

  return (
    <div className="space-y-5">
      {/* Chord Font Family */}
      <div className="space-y-2">
        <Label htmlFor="chord-font">Chord Font</Label>
        <Select
          value={currentFontId}
          onValueChange={onChordFontFamilyChange}
          disabled={disabled}
        >
          <SelectTrigger id="chord-font" className="w-full">
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

      {/* Chord Size */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Chord Size</Label>
          <span className="text-sm text-muted-foreground">{sizePercent}%</span>
        </div>
        <Slider
          value={[currentSize]}
          onValueChange={([value]) => onChordFontSizeChange(value)}
          min={CHORD_FONT_SIZE_MIN}
          max={CHORD_FONT_SIZE_MAX}
          step={0.05}
          disabled={disabled}
        />
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
          <SelectTrigger id="chord-weight" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chord Color */}
      <div className="space-y-3">
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

      {/* Chord Highlight */}
      <div className="flex items-center justify-between">
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
