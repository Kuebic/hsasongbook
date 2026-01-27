/**
 * ArtistMultiSelect Component
 *
 * Searchable multi-select with checkboxes for filtering by artists.
 */

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ArtistMultiSelectProps {
  selected: string[];
  onChange: (artists: string[]) => void;
}

export default function ArtistMultiSelect({ selected, onChange }: ArtistMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const artists = useQuery(api.songs.getDistinctArtists);
  const loading = artists === undefined;

  const handleToggle = (artist: string) => {
    if (selected.includes(artist)) {
      onChange(selected.filter((a) => a !== artist));
    } else {
      onChange([...selected, artist]);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Artists</Label>
      <div className="space-y-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={loading}
            >
              {selected.length > 0 ? `${selected.length} selected` : 'Select artists...'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search artists..." />
              <CommandList>
                <CommandEmpty>No artist found.</CommandEmpty>
                <CommandGroup>
                  {(artists || []).map((artist) => (
                    <CommandItem
                      key={artist}
                      value={artist}
                      onSelect={() => handleToggle(artist)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selected.includes(artist) ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {artist}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selected.map((artist) => (
              <Badge key={artist} variant="secondary" className="text-xs">
                {artist}
                <button
                  onClick={() => handleToggle(artist)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 px-2 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
