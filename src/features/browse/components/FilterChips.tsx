/**
 * FilterChips Component
 *
 * Displays active filters as removable chips.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { BrowseFilters } from '../hooks/useBrowseFilters';
import { TEMPO_RANGES, DATE_PRESETS, DIFFICULTY_OPTIONS } from '../utils/filterConstants';

interface FilterChipsProps {
  filters: BrowseFilters;
  onRemoveFilter: <K extends keyof BrowseFilters>(key: K, value: BrowseFilters[K]) => void;
  onClearAll: () => void;
}

export default function FilterChips({
  filters,
  onRemoveFilter,
  onClearAll,
}: FilterChipsProps) {
  const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];

  // Theme chips
  filters.themes.forEach((theme) => {
    chips.push({
      key: `theme-${theme}`,
      label: `Theme: ${theme}`,
      onRemove: () =>
        onRemoveFilter('themes', filters.themes.filter((t) => t !== theme)),
    });
  });

  // Artist chip
  if (filters.artist) {
    chips.push({
      key: 'artist',
      label: `Artist: ${filters.artist}`,
      onRemove: () => onRemoveFilter('artist', null),
    });
  }

  // Date preset chip
  if (filters.datePreset) {
    chips.push({
      key: 'date',
      label: `Added: ${DATE_PRESETS[filters.datePreset].label}`,
      onRemove: () => onRemoveFilter('datePreset', null),
    });
  }

  // Key chip
  if (filters.hasKey) {
    chips.push({
      key: 'key',
      label: `Key: ${filters.hasKey}`,
      onRemove: () => onRemoveFilter('hasKey', null),
    });
  }

  // Tempo chip
  if (filters.tempoRange) {
    chips.push({
      key: 'tempo',
      label: `Tempo: ${TEMPO_RANGES[filters.tempoRange].label}`,
      onRemove: () => onRemoveFilter('tempoRange', null),
    });
  }

  // Difficulty chip
  if (filters.hasDifficulty) {
    chips.push({
      key: 'difficulty',
      label: `Difficulty: ${DIFFICULTY_OPTIONS[filters.hasDifficulty].label}`,
      onRemove: () => onRemoveFilter('hasDifficulty', null),
    });
  }

  // Min arrangements chip
  if (filters.minArrangements > 0) {
    chips.push({
      key: 'minArr',
      label: `Min. ${filters.minArrangements}+ arrangements`,
      onRemove: () => onRemoveFilter('minArrangements', 0),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Badge
          key={chip.key}
          variant="secondary"
          className="flex items-center gap-1 pr-1"
        >
          {chip.label}
          <button
            onClick={chip.onRemove}
            className="ml-1 p-0.5 rounded-full hover:bg-muted-foreground/20"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {chips.length > 1 && (
        <Button variant="ghost" size="sm" onClick={onClearAll} className="h-6 px-2 text-xs">
          Clear all
        </Button>
      )}
    </div>
  );
}
