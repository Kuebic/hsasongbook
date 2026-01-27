/**
 * InstrumentSelector Component
 *
 * A select component for choosing the instrument the chords are designed for.
 * Options: Guitar, Piano
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Guitar, Piano, type LucideIcon } from 'lucide-react';
import { INSTRUMENT_OPTIONS, type InstrumentOption } from '@/features/shared';

interface InstrumentSelectorProps {
  value?: InstrumentOption;
  onChange: (value: InstrumentOption | undefined) => void;
  disabled?: boolean;
  className?: string;
}

const INSTRUMENT_ICONS: Record<InstrumentOption, LucideIcon> = {
  guitar: Guitar,
  piano: Piano,
};

export default function InstrumentSelector({
  value,
  onChange,
  disabled = false,
  className,
}: InstrumentSelectorProps) {
  const selectedOption = value
    ? INSTRUMENT_OPTIONS.find((opt) => opt.value === value)
    : undefined;

  return (
    <Select
      value={value || ''}
      onValueChange={(val) => onChange(val ? (val as InstrumentOption) : undefined)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Not set">
          {selectedOption && (
            <span className="flex items-center gap-2">
              {(() => {
                const Icon = INSTRUMENT_ICONS[selectedOption.value];
                return <Icon className="h-4 w-4 opacity-70" />;
              })()}
              <span>{selectedOption.label}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {INSTRUMENT_OPTIONS.map((option) => {
          const Icon = INSTRUMENT_ICONS[option.value];
          return (
            <SelectItem key={option.value} value={option.value}>
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 opacity-70" />
                <span>{option.label}</span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
