import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';

const INITIAL_DISPLAY_COUNT = 3;

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
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedSet = new Set(selectedThemes.map((t) => t.toLowerCase()));

  // Filter out already-selected themes
  const unselectedSuggestions = suggestions.filter(
    (theme) => !selectedSet.has(theme.toLowerCase())
  );

  // Reset to collapsed when suggestions change significantly
  useEffect(() => {
    setIsExpanded(false);
  }, [suggestions.length]);

  // Hide entire section if no suggestions or all have been selected
  if (unselectedSuggestions.length === 0) {
    return null;
  }

  const visibleSuggestions = isExpanded
    ? unselectedSuggestions
    : unselectedSuggestions.slice(0, INITIAL_DISPLAY_COUNT);

  const hasMore = unselectedSuggestions.length > INITIAL_DISPLAY_COUNT;
  const remainingCount = unselectedSuggestions.length - INITIAL_DISPLAY_COUNT;

  return (
    <div className="mt-2">
      <p className="text-xs text-muted-foreground mb-1.5">
        Suggested themes based on lyrics:
      </p>
      <div className="flex flex-wrap gap-1.5">
        {visibleSuggestions.map((theme) => (
          <button
            key={theme}
            type="button"
            onClick={() => onSelect(theme)}
            className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-md"
          >
            <Badge variant="secondary" className="cursor-pointer select-none">
              {theme}
            </Badge>
          </button>
        ))}
        {hasMore && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-md"
          >
            <Badge
              variant="outline"
              className="cursor-pointer select-none text-muted-foreground gap-1"
            >
              {isExpanded ? (
                <>
                  Show less
                  <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  +{remainingCount} more
                  <ChevronDown className="h-3 w-3" />
                </>
              )}
            </Badge>
          </button>
        )}
      </div>
    </div>
  );
}
