/**
 * KeySelector Component
 *
 * Compact grid-based selector for choosing musical keys
 * Features a Major/Minor toggle and 7x3 key grid layout
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Key grid layout: [flat, natural, sharp] for each row
// null represents empty cells (non-existent keys like B#, E#, Cb, Fb)
const KEY_GRID: (string | null)[][] = [
  ['Ab', 'A', 'A#'],
  ['Bb', 'B', null],
  [null, 'C', 'C#'],
  ['Db', 'D', 'D#'],
  ['Eb', 'E', null],
  [null, 'F', 'F#'],
  ['Gb', 'G', 'G#'],
]

interface KeySelectorProps {
  value?: string;
  onChange?: (key: string) => void;
  showEnharmonics?: boolean; // Ignored - grid shows all enharmonics
  className?: string;
  disabled?: boolean;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  originalKey?: string | null; // Not displayed in minimal design
  includeMinorKeys?: boolean;
  id?: string;
}

interface ModeToggleProps {
  mode: 'major' | 'minor';
  onChange: (mode: 'major' | 'minor') => void;
  disabled?: boolean;
}

function ModeToggle({ mode, onChange, disabled }: ModeToggleProps) {
  return (
    <div className="flex rounded-md border overflow-hidden mb-2">
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "flex-1 px-3 py-1.5 text-sm font-medium transition-colors",
          mode === 'major'
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted"
        )}
        onClick={() => onChange('major')}
        aria-pressed={mode === 'major'}
      >
        Major
      </button>
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "flex-1 px-3 py-1.5 text-sm font-medium transition-colors border-l",
          mode === 'minor'
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted"
        )}
        onClick={() => onChange('minor')}
        aria-pressed={mode === 'minor'}
      >
        Minor
      </button>
    </div>
  )
}

interface KeyGridProps {
  mode: 'major' | 'minor';
  selectedKey: string | undefined;
  onSelect: (key: string) => void;
  disabled?: boolean;
}

function KeyGrid({ mode, selectedKey, onSelect, disabled }: KeyGridProps) {
  const formatKey = (baseKey: string): string => {
    return mode === 'minor' ? `${baseKey}m` : baseKey
  }

  const isSelected = (baseKey: string): boolean => {
    return selectedKey === formatKey(baseKey)
  }

  return (
    <div
      className="grid grid-cols-3 gap-1"
      role="grid"
      aria-label={`${mode} keys`}
    >
      {KEY_GRID.map((row, rowIndex) =>
        row.map((baseKey, colIndex) =>
          baseKey ? (
            <button
              key={`${rowIndex}-${colIndex}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(formatKey(baseKey))}
              className={cn(
                "h-9 w-10 text-sm font-medium rounded-md transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected(baseKey)
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground border border-input"
              )}
              aria-label={`${formatKey(baseKey)} key`}
              aria-pressed={isSelected(baseKey)}
            >
              {formatKey(baseKey)}
            </button>
          ) : (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="h-9 w-10"
              aria-hidden="true"
            />
          )
        )
      )}
    </div>
  )
}

export default function KeySelector({
  value = 'C',
  onChange,
  className,
  disabled = false,
  size = 'default',
  includeMinorKeys = true,
  id,
}: KeySelectorProps) {
  const [open, setOpen] = useState(false)

  // Determine current mode from value
  const isCurrentMinor = value?.endsWith('m') || false
  const [mode, setMode] = useState<'major' | 'minor'>(isCurrentMinor ? 'minor' : 'major')

  // Sync mode with current value when it changes externally
  useEffect(() => {
    if (value) {
      setMode(value.endsWith('m') ? 'minor' : 'major')
    }
  }, [value])

  // Handle mode change - convert current key to new mode
  const handleModeChange = (newMode: 'major' | 'minor') => {
    setMode(newMode)

    // Convert current selection to new mode
    if (value && onChange) {
      const baseKey = value.replace('m', '')
      const newKey = newMode === 'minor' ? `${baseKey}m` : baseKey
      onChange(newKey)
    }
  }

  const handleKeySelect = (key: string) => {
    if (onChange) {
      onChange(key)
    }
    setOpen(false)
  }

  // Size-based button height
  const sizeClasses = {
    default: 'min-h-[44px]',
    sm: 'min-h-[36px]',
    lg: 'min-h-[52px]',
    icon: 'min-h-[44px] w-[44px]',
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={size}
          disabled={disabled}
          className={cn(
            sizeClasses[size],
            'px-4 justify-between font-medium',
            className
          )}
          aria-label="Select key"
          id={id}
        >
          <span className="text-base font-medium">{value}</span>
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-auto p-2"
        sideOffset={8}
      >
        {includeMinorKeys && (
          <ModeToggle
            mode={mode}
            onChange={handleModeChange}
            disabled={disabled}
          />
        )}

        <KeyGrid
          mode={mode}
          selectedKey={value}
          onSelect={handleKeySelect}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}
