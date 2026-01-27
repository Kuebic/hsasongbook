/**
 * Font Selector
 *
 * Controls for selecting app font and font size.
 */

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  appFonts,
  fontSizeOptions,
  getFontSizeIdFromScale,
  DEFAULT_APP_FONT_ID,
  DEFAULT_FONT_SIZE,
} from "../presets/fontPresets";

interface FontSelectorProps {
  fontFamily: string | undefined;
  fontSize: number | undefined;
  onFontFamilyChange: (fontId: string) => void;
  onFontSizeChange: (size: number) => void;
  disabled?: boolean;
}

export function FontSelector({
  fontFamily,
  fontSize,
  onFontFamilyChange,
  onFontSizeChange,
  disabled,
}: FontSelectorProps) {
  const currentFontId = fontFamily ?? DEFAULT_APP_FONT_ID;
  const currentSize = fontSize ?? DEFAULT_FONT_SIZE;

  // Get the current size option ID
  const currentSizeId = getFontSizeIdFromScale(currentSize);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Font Family */}
      <div className="space-y-2">
        <Label htmlFor="app-font">App Font</Label>
        <Select
          value={currentFontId}
          onValueChange={onFontFamilyChange}
          disabled={disabled}
        >
          <SelectTrigger id="app-font">
            <SelectValue placeholder="Select a font" />
          </SelectTrigger>
          <SelectContent>
            {appFonts.map((font) => (
              <SelectItem
                key={font.id}
                value={font.id}
                style={{ fontFamily: font.stack }}
              >
                {font.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <Label>Text Size</Label>
        <div className="flex gap-1">
          {fontSizeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onFontSizeChange(option.scale)}
              disabled={disabled}
              className={cn(
                "flex-1 rounded-md px-2 sm:px-3 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                currentSizeId === option.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
