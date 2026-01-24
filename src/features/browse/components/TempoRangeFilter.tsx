/**
 * TempoRangeFilter Component
 *
 * Toggle for filtering by tempo range (Slow, Medium, Fast).
 */

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TEMPO_RANGES, type TempoRange } from '../utils/filterConstants';

interface TempoRangeFilterProps {
  value: TempoRange | null;
  onChange: (range: TempoRange | null) => void;
}

export default function TempoRangeFilter({ value, onChange }: TempoRangeFilterProps) {
  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Has Tempo</Label>
      <Select
        value={value || 'any'}
        onValueChange={(val) => onChange(val === 'any' ? null : (val as TempoRange))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Any tempo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any tempo</SelectItem>
          {Object.entries(TEMPO_RANGES).map(([key, { label }]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
