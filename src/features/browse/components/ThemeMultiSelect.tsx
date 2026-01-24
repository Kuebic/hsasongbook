/**
 * ThemeMultiSelect Component
 *
 * Multi-select checkbox list for filtering by themes.
 */

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

interface ThemeMultiSelectProps {
  selected: string[];
  onChange: (themes: string[]) => void;
}

export default function ThemeMultiSelect({ selected, onChange }: ThemeMultiSelectProps) {
  const themes = useQuery(api.songs.getDistinctThemes);
  const loading = themes === undefined;

  const handleToggle = (theme: string, checked: boolean) => {
    if (checked) {
      onChange([...selected, theme]);
    } else {
      onChange(selected.filter((t) => t !== theme));
    }
  };

  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Themes</Label>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-6 w-32" />
          ))}
        </div>
      ) : themes && themes.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {themes.map((theme) => (
            <label
              key={theme}
              className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted/50"
            >
              <Checkbox
                checked={selected.includes(theme)}
                onCheckedChange={(checked) => handleToggle(theme, checked === true)}
              />
              <span className="text-sm truncate">{theme}</span>
            </label>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No themes available</p>
      )}
    </div>
  );
}
