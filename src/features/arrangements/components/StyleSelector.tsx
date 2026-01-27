/**
 * StyleSelector Component
 *
 * A select component for choosing the musical style of an arrangement.
 * Options: Contemporary, Traditional, Hymn-style, Gospel, Folk, etc.
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STYLE_OPTIONS, type StyleOption } from '@/features/shared';

interface StyleSelectorProps {
  value?: StyleOption;
  onChange: (value: StyleOption | undefined) => void;
  disabled?: boolean;
  className?: string;
}

export default function StyleSelector({
  value,
  onChange,
  disabled = false,
  className,
}: StyleSelectorProps) {
  const selectedOption = value
    ? STYLE_OPTIONS.find((opt) => opt.value === value)
    : undefined;

  return (
    <Select
      value={value || ''}
      onValueChange={(val) => onChange(val ? (val as StyleOption) : undefined)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Not set">
          {selectedOption && <span>{selectedOption.label}</span>}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STYLE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
