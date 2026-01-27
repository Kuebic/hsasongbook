/**
 * ChipInput Component
 *
 * A reusable multi-value input with removable chips and fuzzy autocomplete.
 * Supports three modes:
 * - Curated only: Only allow selections from predefined list
 * - Curated + custom: Allow predefined + free-form input
 * - Open + autocomplete: Free-form with suggestions from existing data
 */

import React, { useState, useRef, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandEmpty,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from '@/components/ui/popover';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ChipVariant = 'default' | 'secondary' | 'outline' | 'theme' | 'setting' | 'tag';

export interface ChipInputProps {
  /** Currently selected values */
  value: string[];
  /** Callback when values change */
  onChange: (value: string[]) => void;

  /** Static curated suggestions to show */
  suggestions?: readonly string[];
  /** Dynamic suggestions (e.g., from database) */
  dynamicSuggestions?: string[];
  /** Whether to allow custom entries beyond suggestions */
  allowCustom?: boolean;
  /** Maximum number of items allowed (undefined = unlimited) */
  maxItems?: number;

  /** Label displayed above the input */
  label?: string;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Whether the input is disabled */
  disabled?: boolean;

  /** Visual variant for chips (for color-coding by category) */
  chipVariant?: ChipVariant;
  /** Custom class name */
  className?: string;
}

// Fuse.js options for fuzzy matching
const FUSE_OPTIONS: Fuse.IFuseOptions<string> = {
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 1,
};

/**
 * Normalize a tag value: lowercase, trim, replace spaces with hyphens
 */
function normalizeTag(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Get chip styling based on variant
 */
function getChipClasses(variant: ChipVariant): string {
  switch (variant) {
    case 'theme':
      return 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200';
    case 'setting':
      return 'bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-200';
    case 'tag':
      return 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200';
    case 'secondary':
      return 'bg-secondary text-secondary-foreground border-transparent';
    case 'outline':
      return 'bg-transparent text-foreground border-border';
    case 'default':
    default:
      return 'bg-primary/10 text-primary border-primary/20';
  }
}

export function ChipInput({
  value,
  onChange,
  suggestions = [],
  dynamicSuggestions = [],
  allowCustom = true,
  maxItems,
  label,
  placeholder = 'Add item...',
  helperText,
  disabled = false,
  chipVariant = 'default',
  className,
}: ChipInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Combine static and dynamic suggestions
  const allSuggestions = useMemo(() => {
    const combined = [...suggestions, ...dynamicSuggestions];
    // Remove duplicates
    return [...new Set(combined)];
  }, [suggestions, dynamicSuggestions]);

  // Create Fuse instance for fuzzy matching
  const fuse = useMemo(() => {
    if (allSuggestions.length === 0) return null;
    return new Fuse(allSuggestions, FUSE_OPTIONS);
  }, [allSuggestions]);

  // Get filtered suggestions based on input
  const filteredSuggestions = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    const selectedSet = new Set(value.map((v) => v.toLowerCase()));

    // Filter out already selected items
    const available = allSuggestions.filter(
      (s) => !selectedSet.has(s.toLowerCase())
    );

    if (!query) {
      // Show all available when no query
      return available.slice(0, 8);
    }

    if (fuse) {
      // Use fuzzy matching
      const results = fuse.search(query);
      return results
        .map((r) => r.item)
        .filter((s) => !selectedSet.has(s.toLowerCase()))
        .slice(0, 8);
    }

    // Fallback to simple includes match
    return available
      .filter((s) => s.toLowerCase().includes(query))
      .slice(0, 8);
  }, [inputValue, value, allSuggestions, fuse]);

  // Check if the current input can be added as a custom value
  const canAddCustom = useMemo(() => {
    if (!allowCustom) return false;
    const normalized = normalizeTag(inputValue);
    if (!normalized || normalized.length < 2) return false;
    // Check if already in values
    if (value.some((v) => v.toLowerCase() === normalized)) return false;
    // Check if at max items
    if (maxItems !== undefined && value.length >= maxItems) return false;
    return true;
  }, [allowCustom, inputValue, value, maxItems]);

  // Add a value
  const handleAdd = useCallback(
    (item: string) => {
      const normalized = normalizeTag(item);
      if (!normalized) return;
      if (value.some((v) => v.toLowerCase() === normalized)) return;
      if (maxItems !== undefined && value.length >= maxItems) return;

      onChange([...value, normalized]);
      setInputValue('');
      setOpen(false);
      inputRef.current?.focus();
    },
    [value, onChange, maxItems]
  );

  // Remove a value
  const handleRemove = useCallback(
    (item: string) => {
      onChange(value.filter((v) => v !== item));
    },
    [value, onChange]
  );

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && inputValue.trim()) {
        e.preventDefault();
        // If there are suggestions and one matches exactly, add it
        const exact = filteredSuggestions.find(
          (s) => s.toLowerCase() === inputValue.toLowerCase()
        );
        if (exact) {
          handleAdd(exact);
        } else if (canAddCustom) {
          handleAdd(inputValue);
        }
      } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
        // Remove last chip when backspace on empty input
        handleRemove(value[value.length - 1]);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    },
    [inputValue, filteredSuggestions, canAddCustom, value, handleAdd, handleRemove]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      if (e.target.value.length >= 1) {
        setOpen(true);
      }
    },
    []
  );

  const handleInputFocus = useCallback(() => {
    // Only open if user has already typed something
    // This prevents flash of dropdown on initial focus
    if (allSuggestions.length > 0 && inputValue.length > 0) {
      setOpen(true);
    }
  }, [allSuggestions.length, inputValue.length]);

  const handleInputBlur = useCallback(() => {
    // Delay closing to allow click on suggestion
    setTimeout(() => setOpen(false), 150);
  }, []);

  const showSuggestions = open && (filteredSuggestions.length > 0 || canAddCustom);
  const isMaxed = maxItems !== undefined && value.length >= maxItems;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      <div className="space-y-2">
        {/* Selected chips */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {value.map((item) => (
              <Badge
                key={item}
                variant="outline"
                className={cn(
                  'pl-2 pr-1 py-1 gap-1 text-sm font-normal',
                  getChipClasses(chipVariant)
                )}
              >
                {item}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(item)}
                  disabled={disabled}
                  className="h-5 w-5 p-0 hover:bg-transparent hover:text-destructive"
                  aria-label={`Remove ${item}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Input with autocomplete */}
        {!isMaxed && (
          <Popover open={showSuggestions} onOpenChange={setOpen}>
            <PopoverAnchor asChild>
              <Input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete="off"
                className="h-9"
              />
            </PopoverAnchor>
            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] p-0"
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <Command>
                <CommandList>
                  {filteredSuggestions.length === 0 && !canAddCustom && (
                    <CommandEmpty>No suggestions</CommandEmpty>
                  )}
                  {filteredSuggestions.length > 0 && (
                    <CommandGroup heading="Suggestions">
                      {filteredSuggestions.map((suggestion) => (
                        <CommandItem
                          key={suggestion}
                          value={suggestion}
                          onSelect={() => handleAdd(suggestion)}
                          className="cursor-pointer"
                        >
                          {suggestion}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {canAddCustom && inputValue.trim() && (
                    <CommandGroup heading="Add custom">
                      <CommandItem
                        value={normalizeTag(inputValue)}
                        onSelect={() => handleAdd(inputValue)}
                        className="cursor-pointer"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add "{normalizeTag(inputValue)}"
                      </CommandItem>
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {isMaxed && (
          <p className="text-xs text-muted-foreground">
            Maximum of {maxItems} items reached
          </p>
        )}
      </div>

      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

export default ChipInput;
