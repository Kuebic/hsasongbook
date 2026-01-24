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
import { type DifficultyOption } from '../validation/arrangementSchemas';

interface DifficultySelectorProps {
  value?: DifficultyOption;
  onChange: (value: DifficultyOption | undefined) => void;
  disabled?: boolean;
  className?: string;
}

const difficultyLabels: Record<DifficultyOption, { label: string; dots: string }> = {
  simple: { label: 'Simple', dots: '●○○' },
  standard: { label: 'Standard', dots: '●●○' },
  advanced: { label: 'Advanced', dots: '●●●' },
};

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
              <span className="font-mono text-xs opacity-70">{difficultyLabels[value].dots}</span>
              <span>{difficultyLabels[value].label}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="simple">
          <span className="flex items-center gap-2">
            <span className="font-mono text-xs opacity-70">●○○</span>
            <span>Simple</span>
          </span>
        </SelectItem>
        <SelectItem value="standard">
          <span className="flex items-center gap-2">
            <span className="font-mono text-xs opacity-70">●●○</span>
            <span>Standard</span>
          </span>
        </SelectItem>
        <SelectItem value="advanced">
          <span className="flex items-center gap-2">
            <span className="font-mono text-xs opacity-70">●●●</span>
            <span>Advanced</span>
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
