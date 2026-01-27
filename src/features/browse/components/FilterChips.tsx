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
import { getOriginLabel } from '@/features/songs/validation/songSchemas';

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

  // Artist chips
  filters.artists.forEach((artist) => {
    chips.push({
      key: `artist-${artist}`,
      label: `Artist: ${artist}`,
      onRemove: () =>
        onRemoveFilter('artists', filters.artists.filter((a) => a !== artist)),
    });
  });

  // Origin chips
  filters.origins.forEach((origin) => {
    chips.push({
      key: `origin-${origin}`,
      label: `Origin: ${getOriginLabel(origin) || origin}`,
      onRemove: () =>
        onRemoveFilter('origins', filters.origins.filter((o) => o !== origin)),
    });
  });

  // Date preset chip
  if (filters.datePreset) {
    chips.push({
      key: 'date',
      label: `Added: ${DATE_PRESETS[filters.datePreset].label}`,
      onRemove: () => onRemoveFilter('datePreset', null),
    });
  }

  // Key chips
  filters.hasKeys.forEach((key) => {
    chips.push({
      key: `key-${key}`,
      label: `Key: ${key}`,
      onRemove: () =>
        onRemoveFilter('hasKeys', filters.hasKeys.filter((k) => k !== key)),
    });
  });

  // Tempo chips
  filters.tempoRanges.forEach((tempoRange) => {
    chips.push({
      key: `tempo-${tempoRange}`,
      label: `Tempo: ${TEMPO_RANGES[tempoRange].label}`,
      onRemove: () =>
        onRemoveFilter('tempoRanges', filters.tempoRanges.filter((t) => t !== tempoRange)),
    });
  });

  // Difficulty chips
  filters.hasDifficulties.forEach((difficulty) => {
    chips.push({
      key: `difficulty-${difficulty}`,
      label: `Difficulty: ${DIFFICULTY_OPTIONS[difficulty].label}`,
      onRemove: () =>
        onRemoveFilter('hasDifficulties', filters.hasDifficulties.filter((d) => d !== difficulty)),
    });
  });

  // Arrangement filter chip
  if (filters.arrangementFilter === 'has_arrangements') {
    chips.push({
      key: 'arrFilter',
      label: 'Has Arrangements',
      onRemove: () => onRemoveFilter('arrangementFilter', 'all'),
    });
  } else if (filters.arrangementFilter === 'needs_arrangements') {
    chips.push({
      key: 'arrFilter',
      label: 'Needs Arrangements',
      onRemove: () => onRemoveFilter('arrangementFilter', 'all'),
    });
  }

  // Favorites filter chip
  if (filters.showFavoritesOnly) {
    chips.push({
      key: 'favorites',
      label: 'My Favorites',
      onRemove: () => onRemoveFilter('showFavoritesOnly', false),
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
