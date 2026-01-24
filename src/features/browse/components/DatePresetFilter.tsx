/**
 * DatePresetFilter Component
 *
 * Buttons for filtering by date added presets.
 */

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DATE_PRESETS, type DatePreset } from '../utils/filterConstants';
import { cn } from '@/lib/utils';

interface DatePresetFilterProps {
  value: DatePreset | null;
  onChange: (preset: DatePreset | null) => void;
}

export default function DatePresetFilter({ value, onChange }: DatePresetFilterProps) {
  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Date Added</Label>
      <div className="flex flex-wrap gap-2">
        {Object.entries(DATE_PRESETS).map(([key, { label }]) => (
          <Button
            key={key}
            variant={value === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(value === key ? null : (key as DatePreset))}
            className={cn(
              'transition-colors',
              value === key && 'bg-primary text-primary-foreground'
            )}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
