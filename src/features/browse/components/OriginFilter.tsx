/**
 * OriginFilter Component
 *
 * Dropdown for filtering songs by origin category, grouped by type.
 */

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { SONG_ORIGIN_GROUPS } from '@/features/songs/validation/songSchemas';

interface OriginFilterProps {
  value: string | null;
  onChange: (origin: string | null) => void;
}

export default function OriginFilter({ value, onChange }: OriginFilterProps) {
  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Origin</Label>
      <div className="flex gap-2">
        <Select
          value={value || ''}
          onValueChange={(v) => onChange(v || null)}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select origin..." />
          </SelectTrigger>
          <SelectContent>
            {SONG_ORIGIN_GROUPS.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.origins.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        {value && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChange(null)}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
