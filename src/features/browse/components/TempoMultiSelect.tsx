/**
 * TempoMultiSelect Component
 *
 * Multi-select checkbox list for filtering by tempo ranges (Slow, Medium, Fast).
 */

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { TEMPO_RANGES, type TempoRange } from '../utils/filterConstants';

interface TempoMultiSelectProps {
  selected: TempoRange[];
  onChange: (ranges: TempoRange[]) => void;
}

export default function TempoMultiSelect({ selected, onChange }: TempoMultiSelectProps) {
  const handleToggle = (range: TempoRange, checked: boolean) => {
    if (checked) {
      onChange([...selected, range]);
    } else {
      onChange(selected.filter((r) => r !== range));
    }
  };

  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Has Tempos</Label>
      <div className="space-y-2">
        {Object.entries(TEMPO_RANGES).map(([key, { label }]) => (
          <label
            key={key}
            className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted/50"
          >
            <Checkbox
              checked={selected.includes(key as TempoRange)}
              onCheckedChange={(checked) => handleToggle(key as TempoRange, checked === true)}
            />
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
