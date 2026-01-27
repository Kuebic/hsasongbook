/**
 * ArtistInput Component
 *
 * Autocomplete input for artist names with fuzzy-matched suggestions.
 * Allows free text entry while suggesting existing artists to prevent typos.
 */

import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from '@/components/ui/popover';
import { useArtistSuggestions } from '../hooks/useArtistSuggestions';

interface ArtistInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}

export function ArtistInput({
  value,
  onChange,
  disabled = false,
  placeholder = 'e.g., John Newton',
  id,
}: ArtistInputProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { suggestions } = useArtistSuggestions(value);

  const handleSelect = (artist: string) => {
    onChange(artist);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (e.target.value.length >= 2) {
      setOpen(true);
    }
  };

  const handleInputFocus = () => {
    if (value.length >= 2 && suggestions.length > 0) {
      setOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow click on suggestion
    setTimeout(() => setOpen(false), 150);
  };

  return (
    <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
        />
      </PopoverAnchor>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            <CommandGroup>
              {suggestions.map((artist) => (
                <CommandItem
                  key={artist}
                  value={artist}
                  onSelect={() => handleSelect(artist)}
                >
                  {artist}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default ArtistInput;
