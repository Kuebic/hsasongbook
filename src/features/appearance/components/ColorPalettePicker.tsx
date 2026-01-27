/**
 * Color Palette Picker
 *
 * Allows users to mix and match primary + accent colors from curated palettes.
 */

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { primaryColors, accentColors } from "../presets/colorPresets";
import type { CuratedColor } from "../types/appearance.types";

interface ColorSwatchProps {
  color: CuratedColor;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function ColorSwatch({ color, isSelected, onClick, disabled }: ColorSwatchProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative h-8 w-8 rounded-full border-2 transition-all",
        "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isSelected
          ? "border-foreground shadow-md"
          : "border-transparent hover:border-muted-foreground/50",
        disabled && "cursor-not-allowed opacity-50 hover:scale-100"
      )}
      style={{ backgroundColor: `hsl(${color.light})` }}
      title={color.name}
    >
      {isSelected && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Check className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
        </div>
      )}
    </button>
  );
}

interface ColorRowProps {
  label: string;
  colors: CuratedColor[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

function ColorRow({ label, colors, selectedId, onSelect, disabled }: ColorRowProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <ColorSwatch
            key={color.id}
            color={color}
            isSelected={selectedId === color.id}
            onClick={() => onSelect(color.id)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

interface ColorPalettePickerProps {
  primaryColorId: string | undefined;
  accentColorId: string | undefined;
  onPrimaryChange: (id: string) => void;
  onAccentChange: (id: string) => void;
  disabled?: boolean;
}

export function ColorPalettePicker({
  primaryColorId,
  accentColorId,
  onPrimaryChange,
  onAccentChange,
  disabled,
}: ColorPalettePickerProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or mix & match</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <ColorRow
        label="Primary Color"
        colors={primaryColors}
        selectedId={primaryColorId}
        onSelect={onPrimaryChange}
        disabled={disabled}
      />

      <ColorRow
        label="Accent Color"
        colors={accentColors}
        selectedId={accentColorId}
        onSelect={onAccentChange}
        disabled={disabled}
      />
    </div>
  );
}
