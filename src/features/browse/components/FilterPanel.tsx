/**
 * FilterPanel Component
 *
 * Mobile-friendly filter panel using Sheet for bottom drawer.
 */

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter, X } from 'lucide-react';
import ThemeMultiSelect from './ThemeMultiSelect';
import ArtistCombobox from './ArtistCombobox';
import KeyFilter from './KeyFilter';
import TempoRangeFilter from './TempoRangeFilter';
import DifficultyFilter from './DifficultyFilter';
import ArrangementCountFilter from './ArrangementCountFilter';
import DatePresetFilter from './DatePresetFilter';
import type { BrowseFilters } from '../hooks/useBrowseFilters';

interface FilterPanelProps {
  filters: BrowseFilters;
  onFilterChange: <K extends keyof BrowseFilters>(key: K, value: BrowseFilters[K]) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

export default function FilterPanel({
  filters,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
}: FilterPanelProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Filter Songs</SheetTitle>
          <SheetDescription>
            Narrow down songs by various criteria
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 py-4 h-[calc(85vh-180px)]">
          <div className="space-y-6 px-1">
            {/* Song-Level Filters */}
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-3">Song Filters</h3>
              <div className="space-y-4">
                <ThemeMultiSelect
                  selected={filters.themes}
                  onChange={(themes) => onFilterChange('themes', themes)}
                />
                <ArtistCombobox
                  value={filters.artist}
                  onChange={(artist) => onFilterChange('artist', artist)}
                />
                <DatePresetFilter
                  value={filters.datePreset}
                  onChange={(preset) => onFilterChange('datePreset', preset)}
                />
              </div>
            </div>

            <Separator />

            {/* Arrangement-Level Filters */}
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-3">Arrangement Filters</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Show songs that have arrangements matching these criteria
              </p>
              <div className="space-y-4">
                <KeyFilter
                  value={filters.hasKey}
                  onChange={(key) => onFilterChange('hasKey', key)}
                />
                <TempoRangeFilter
                  value={filters.tempoRange}
                  onChange={(range) => onFilterChange('tempoRange', range)}
                />
                <DifficultyFilter
                  value={filters.hasDifficulty}
                  onChange={(difficulty) => onFilterChange('hasDifficulty', difficulty)}
                />
                <ArrangementCountFilter
                  value={filters.minArrangements}
                  onChange={(count) => onFilterChange('minArrangements', count)}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="flex-row gap-2 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClearFilters}
            disabled={activeFilterCount === 0}
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
