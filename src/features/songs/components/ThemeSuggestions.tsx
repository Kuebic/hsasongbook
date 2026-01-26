import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ThemeSuggestionsProps {
  suggestions: string[];
  selectedThemes: string[];
  onSelect: (theme: string) => void;
}

export function ThemeSuggestions({
  suggestions,
  selectedThemes,
  onSelect,
}: ThemeSuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  const selectedSet = new Set(selectedThemes.map((t) => t.toLowerCase()));

  return (
    <div className="mt-2">
      <p className="text-xs text-muted-foreground mb-1.5">
        Suggested themes based on lyrics:
      </p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((theme) => {
          const isSelected = selectedSet.has(theme.toLowerCase());
          return (
            <button
              key={theme}
              type="button"
              onClick={() => !isSelected && onSelect(theme)}
              disabled={isSelected}
              className={cn(
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-md',
                isSelected && 'cursor-default'
              )}
            >
              <Badge
                variant={isSelected ? 'outline' : 'secondary'}
                className={cn(
                  'cursor-pointer select-none',
                  isSelected && 'opacity-50 cursor-default'
                )}
              >
                {isSelected && <Check className="w-3 h-3 mr-1" />}
                {theme}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
