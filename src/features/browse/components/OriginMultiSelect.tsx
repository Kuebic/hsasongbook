/**
 * OriginMultiSelect Component
 *
 * Multi-select checkbox grid for filtering by song origins, grouped by type.
 */

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { SONG_ORIGIN_GROUPS } from '@/features/songs/validation/songSchemas';

interface OriginMultiSelectProps {
  selected: string[];
  onChange: (origins: string[]) => void;
}

export default function OriginMultiSelect({ selected, onChange }: OriginMultiSelectProps) {
  const handleToggle = (origin: string, checked: boolean) => {
    if (checked) {
      onChange([...selected, origin]);
    } else {
      onChange(selected.filter((o) => o !== origin));
    }
  };

  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Origins</Label>
      <div className="space-y-4 max-h-64 overflow-y-auto">
        {SONG_ORIGIN_GROUPS.map((group) => (
          <div key={group.label}>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">{group.label}</h4>
            <div className="space-y-2">
              {group.origins.map((origin) => (
                <label
                  key={origin.value}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selected.includes(origin.value)}
                    onCheckedChange={(checked) => handleToggle(origin.value, checked === true)}
                  />
                  <span className="text-sm">{origin.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
