/**
 * KeyMultiSelectGrid Component
 *
 * Multi-select grid-based selector for filtering by musical keys
 * Features a Major/Minor toggle and 7x3 key grid layout
 * Based on KeySelector from AddArrangementForm but adapted for multi-select
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronDown, Check } from 'lucide-react'
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

interface KeyMultiSelectGridProps {
  selected: string[];
  onChange: (keys: string[]) => void;
  className?: string;
  disabled?: boolean;
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

interface KeyMultiGridProps {
  mode: 'major' | 'minor';
  selectedKeys: string[];
  onToggle: (key: string) => void;
  disabled?: boolean;
}

function KeyMultiGrid({ mode, selectedKeys, onToggle, disabled }: KeyMultiGridProps) {
  const formatKey = (baseKey: string): string => {
    return mode === 'minor' ? `${baseKey}m` : baseKey
  }

  const isSelected = (baseKey: string): boolean => {
    return selectedKeys.includes(formatKey(baseKey))
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
              onClick={() => onToggle(formatKey(baseKey))}
              className={cn(
                "h-9 w-10 text-sm font-medium rounded-md transition-colors relative",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected(baseKey)
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground border border-input"
              )}
              aria-label={`${formatKey(baseKey)} key`}
              aria-pressed={isSelected(baseKey)}
            >
              {formatKey(baseKey)}
              {isSelected(baseKey) && (
                <Check className="h-3 w-3 absolute top-0.5 right-0.5" />
              )}
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

export default function KeyMultiSelectGrid({
  selected,
  onChange,
  className,
  disabled = false,
}: KeyMultiSelectGridProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'major' | 'minor'>('major')

  // Handle mode change - convert selected keys to new mode
  const handleModeChange = (newMode: 'major' | 'minor') => {
    setMode(newMode)

    // Convert all selected keys to the new mode
    const convertedKeys = selected.map(key => {
      const baseKey = key.replace('m', '')
      return newMode === 'minor' ? `${baseKey}m` : baseKey
    })
    onChange(convertedKeys)
  }

  const handleToggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter(k => k !== key))
    } else {
      onChange([...selected, key])
    }
  }

  const handleClearAll = () => {
    onChange([])
  }

  const handleDone = () => {
    setOpen(false)
  }

  const selectedCount = selected.length
  const buttonText = selectedCount === 0
    ? 'Select Keys'
    : `Keys (${selectedCount})`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="default"
          disabled={disabled}
          className={cn(
            'min-h-[44px] px-4 justify-between font-medium',
            className
          )}
          aria-label="Select keys"
        >
          <span className="text-base font-medium">{buttonText}</span>
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-auto p-3"
        sideOffset={8}
      >
        <ModeToggle
          mode={mode}
          onChange={handleModeChange}
          disabled={disabled}
        />

        <KeyMultiGrid
          mode={mode}
          selectedKeys={selected}
          onToggle={handleToggle}
          disabled={disabled}
        />

        <div className="flex gap-2 mt-3 pt-3 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={disabled || selectedCount === 0}
            className="flex-1"
          >
            Clear All
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleDone}
            disabled={disabled}
            className="flex-1"
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
