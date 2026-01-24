/**
 * DifficultySelector Component
 *
 * A select component for choosing arrangement difficulty level.
 * Shows visual indicators (dots) for each level.
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DIFFICULTY_OPTIONS, type DifficultyOption } from '@/features/shared';

interface DifficultySelectorProps {
  value?: DifficultyOption;
  onChange: (value: DifficultyOption | undefined) => void;
  disabled?: boolean;
  className?: string;
}

export default function DifficultySelector({
  value,
  onChange,
  disabled = false,
  className,
}: DifficultySelectorProps) {
  return (
    <Select
      value={value || ''}
      onValueChange={(val) => onChange(val ? (val as DifficultyOption) : undefined)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Not set">
          {value && (
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs opacity-70">{DIFFICULTY_OPTIONS[value].dots}</span>
              <span>{DIFFICULTY_OPTIONS[value].label}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(DIFFICULTY_OPTIONS) as DifficultyOption[]).map((key) => (
          <SelectItem key={key} value={key}>
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs opacity-70">{DIFFICULTY_OPTIONS[key].dots}</span>
              <span>{DIFFICULTY_OPTIONS[key].label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
