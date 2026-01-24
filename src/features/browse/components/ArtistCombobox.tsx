/**
 * ArtistCombobox Component
 *
 * Searchable dropdown for filtering by artist.
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

interface ArtistComboboxProps {
  value: string | null;
  onChange: (artist: string | null) => void;
}

export default function ArtistCombobox({ value, onChange }: ArtistComboboxProps) {
  const [open, setOpen] = useState(false);
  const artists = useQuery(api.songs.getDistinctArtists);
  const loading = artists === undefined;

  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Artist</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between"
              disabled={loading}
            >
              {value || 'Select artist...'}
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
                      onSelect={() => {
                        onChange(artist === value ? null : artist);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === artist ? 'opacity-100' : 'opacity-0'
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
