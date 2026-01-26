import React from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search by title, artist, or theme...',
  compact = false,
}: SearchBarProps) {
  const handleClear = (): void => {
    onChange('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange(e.target.value);
  };

  return (
    <div className="relative max-w-2xl mx-auto">
      <Search
        className={cn(
          'absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground',
          compact ? 'h-4 w-4' : 'h-4 w-4'
        )}
      />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className={cn(
          'pl-10 pr-10',
          compact ? 'h-10 text-sm' : 'h-12 text-base'
        )}
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className={cn(
            'absolute right-1 top-1/2 -translate-y-1/2 p-0',
            compact ? 'h-7 w-7' : 'h-8 w-8'
          )}
        >
          <X className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  );
}
