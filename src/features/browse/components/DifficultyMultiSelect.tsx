/**
 * DifficultyMultiSelect Component
 *
 * Multi-select checkbox list for filtering by arrangement difficulty.
 */

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DIFFICULTY_OPTIONS, type DifficultyLevel } from '../utils/filterConstants';

interface DifficultyMultiSelectProps {
  selected: DifficultyLevel[];
  onChange: (difficulties: DifficultyLevel[]) => void;
}

export default function DifficultyMultiSelect({ selected, onChange }: DifficultyMultiSelectProps) {
  const handleToggle = (difficulty: DifficultyLevel, checked: boolean) => {
    if (checked) {
      onChange([...selected, difficulty]);
    } else {
      onChange(selected.filter((d) => d !== difficulty));
    }
  };

  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Has Difficulties</Label>
      <div className="space-y-2">
        {Object.entries(DIFFICULTY_OPTIONS).map(([key, { label, dots }]) => (
          <label
            key={key}
            className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted/50"
          >
            <Checkbox
              checked={selected.includes(key as DifficultyLevel)}
              onCheckedChange={(checked) => handleToggle(key as DifficultyLevel, checked === true)}
            />
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs opacity-70">{dots}</span>
              <span className="text-sm">{label}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
