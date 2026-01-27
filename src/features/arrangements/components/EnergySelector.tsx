/**
 * EnergySelector Component
 *
 * A select component for choosing the energy level of an arrangement.
 * Options: High, Medium, Reflective (low/slow)
 * Shows color-coded indicators for each level.
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ENERGY_OPTIONS, type EnergyOption } from '@/features/shared';
import { cn } from '@/lib/utils';

interface EnergySelectorProps {
  value?: EnergyOption;
  onChange: (value: EnergyOption | undefined) => void;
  disabled?: boolean;
  className?: string;
}

export default function EnergySelector({
  value,
  onChange,
  disabled = false,
  className,
}: EnergySelectorProps) {
  const selectedOption = value
    ? ENERGY_OPTIONS.find((opt) => opt.value === value)
    : undefined;

  return (
    <Select
      value={value || ''}
      onValueChange={(val) => onChange(val ? (val as EnergyOption) : undefined)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Not set">
          {selectedOption && (
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full',
                  selectedOption.value === 'high' && 'bg-red-500',
                  selectedOption.value === 'medium' && 'bg-yellow-500',
                  selectedOption.value === 'reflective' && 'bg-blue-500'
                )}
              />
              <span>{selectedOption.label}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ENERGY_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full',
                  option.value === 'high' && 'bg-red-500',
                  option.value === 'medium' && 'bg-yellow-500',
                  option.value === 'reflective' && 'bg-blue-500'
                )}
              />
              <span>{option.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
