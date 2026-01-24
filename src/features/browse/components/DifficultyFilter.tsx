/**
 * DifficultyFilter Component
 *
 * Dropdown for filtering by arrangement difficulty.
 */

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DIFFICULTY_OPTIONS, type DifficultyLevel } from '../utils/filterConstants';

interface DifficultyFilterProps {
  value: DifficultyLevel | null;
  onChange: (difficulty: DifficultyLevel | null) => void;
}

export default function DifficultyFilter({ value, onChange }: DifficultyFilterProps) {
  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Has Difficulty</Label>
      <Select
        value={value || 'any'}
        onValueChange={(val) => onChange(val === 'any' ? null : (val as DifficultyLevel))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Any difficulty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any difficulty</SelectItem>
          {Object.entries(DIFFICULTY_OPTIONS).map(([key, { label, dots }]) => (
            <SelectItem key={key} value={key}>
              <span className="flex items-center gap-2">
                <span className="font-mono text-xs opacity-70">{dots}</span>
                <span>{label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
