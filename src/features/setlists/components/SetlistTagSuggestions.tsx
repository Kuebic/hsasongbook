/**
 * SetlistTagSuggestions Component
 *
 * Displays categorized clickable tag suggestions for setlists.
 * Tags are organized by category with expand/collapse per section.
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SETLIST_TAG_CATEGORIES } from '../utils/setlistTagConstants';

const INITIAL_TAGS_PER_CATEGORY = 3;

interface SetlistTagSuggestionsProps {
  selectedTags: string[];
  onSelectTag: (tag: string) => void;
}

export function SetlistTagSuggestions({
  selectedTags,
  onSelectTag,
}: SetlistTagSuggestionsProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const selectedSet = new Set(selectedTags.map((t) => t.toLowerCase()));

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Filter categories to only show those with unselected tags
  const categoriesWithAvailableTags = SETLIST_TAG_CATEGORIES.map((category) => {
    const availableTags = category.tags.filter(
      (tag) => !selectedSet.has(tag.toLowerCase())
    );
    return { ...category, availableTags };
  }).filter((cat) => cat.availableTags.length > 0);

  if (categoriesWithAvailableTags.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-muted-foreground">Quick add:</p>
      {categoriesWithAvailableTags.map((category) => {
        const isExpanded = expandedCategories.has(category.id);
        const visibleTags = isExpanded
          ? category.availableTags
          : category.availableTags.slice(0, INITIAL_TAGS_PER_CATEGORY);
        const hasMore =
          category.availableTags.length > INITIAL_TAGS_PER_CATEGORY;
        const remainingCount =
          category.availableTags.length - INITIAL_TAGS_PER_CATEGORY;

        return (
          <div key={category.id} className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {category.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {visibleTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onSelectTag(tag)}
                  className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-md"
                >
                  <Badge
                    variant="secondary"
                    className="cursor-pointer select-none"
                  >
                    {tag}
                  </Badge>
                </button>
              ))}
              {hasMore && (
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-md"
                >
                  <Badge
                    variant="outline"
                    className="cursor-pointer select-none text-muted-foreground gap-1"
                  >
                    {isExpanded ? (
                      <>
                        Less
                        <ChevronUp className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        +{remainingCount}
                        <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </Badge>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
