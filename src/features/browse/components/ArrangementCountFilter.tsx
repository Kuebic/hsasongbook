/**
 * ArrangementCountFilter Component
 *
 * Toggle for filtering songs by arrangement availability.
 * - All: Show all songs
 * - Has Arrangements: Show only songs with at least one arrangement
 * - Needs Arrangements: Show only songs without arrangements (to encourage contributions)
 */

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ArrangementFilter } from '../hooks/useBrowseFilters';

const ARRANGEMENT_FILTER_OPTIONS: { value: ArrangementFilter; label: string }[] = [
  { value: 'all', label: 'All Songs' },
  { value: 'has_arrangements', label: 'Has Arrangements' },
  { value: 'needs_arrangements', label: 'Needs Arrangements' },
];

interface ArrangementCountFilterProps {
  value: ArrangementFilter;
  onChange: (filter: ArrangementFilter) => void;
}

export default function ArrangementCountFilter({ value, onChange }: ArrangementCountFilterProps) {
  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Arrangements</Label>
      <Select
        value={value}
        onValueChange={(val) => onChange(val as ArrangementFilter)}
      >
        <SelectTrigger>
          <SelectValue placeholder="All Songs" />
        </SelectTrigger>
        <SelectContent>
          {ARRANGEMENT_FILTER_OPTIONS.map(({ value: optValue, label }) => (
            <SelectItem key={optValue} value={optValue}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
