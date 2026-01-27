/**
 * Theme Preset Picker
 *
 * Grid of quick theme presets that users can apply with one click.
 */

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { themePresets, getPrimaryColor, getAccentColor } from "../presets/colorPresets";

interface ThemePresetPickerProps {
  selectedPresetId: string | null | undefined;
  onSelectPreset: (presetId: string) => void;
  disabled?: boolean;
}

export function ThemePresetPicker({
  selectedPresetId,
  onSelectPreset,
  disabled,
}: ThemePresetPickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Quick Themes</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {themePresets.map((preset) => {
          const primaryColor = getPrimaryColor(preset.primaryId);
          const accentColor = getAccentColor(preset.accentId);
          const isSelected = selectedPresetId === preset.id;

          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              disabled={disabled}
              className={cn(
                "group relative flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-all",
                "hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-muted/30",
                disabled && "cursor-not-allowed opacity-50"
              )}
              title={preset.description}
            >
              {/* Color swatch showing primary + accent */}
              <div className="relative h-8 w-8 overflow-hidden rounded-full">
                {/* Primary color (left half) */}
                <div
                  className="absolute inset-y-0 left-0 w-1/2"
                  style={{ backgroundColor: `hsl(${primaryColor?.light})` }}
                />
                {/* Accent color (right half) */}
                <div
                  className="absolute inset-y-0 right-0 w-1/2"
                  style={{ backgroundColor: `hsl(${accentColor?.light})` }}
                />
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Check className="h-4 w-4 text-white drop-shadow-md" />
                  </div>
                )}
              </div>
              {/* Label */}
              <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
                {preset.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
