/**
 * KeySelector Component
 *
 * Dropdown selector for choosing musical keys with enharmonic options
 * Mobile-optimized with 44px touch targets
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Music, ChevronDown, Hash, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

// Key arrays in circle of fifths order for better UX
const KEYS_CIRCLE_FIFTHS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']
const KEYS_CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const KEYS_CHROMATIC_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

// Enharmonic equivalents
const ENHARMONICS = {
  'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb',
  'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
}

// Key signatures for display
const KEY_SIGNATURES = {
  'C': { sharps: 0, flats: 0 },
  'G': { sharps: 1, flats: 0 },
  'D': { sharps: 2, flats: 0 },
  'A': { sharps: 3, flats: 0 },
  'E': { sharps: 4, flats: 0 },
  'B': { sharps: 5, flats: 0 },
  'F#': { sharps: 6, flats: 0 },
  'C#': { sharps: 7, flats: 0 },
  'Gb': { sharps: 0, flats: 6 },
  'Db': { sharps: 0, flats: 5 },
  'Ab': { sharps: 0, flats: 4 },
  'Eb': { sharps: 0, flats: 3 },
  'Bb': { sharps: 0, flats: 2 },
  'F': { sharps: 0, flats: 1 },
  'G#': { sharps: 6, flats: 0 },  // Theoretical keys
  'D#': { sharps: 5, flats: 0 },
  'A#': { sharps: 5, flats: 0 }
}

/**
 * Format key signature for display
 * @param {string} key - Musical key
 * @returns {string} Formatted signature (e.g., "2♯" or "3♭")
 */
function formatKeySignature(key) {
  const sig = KEY_SIGNATURES[key]
  if (!sig) return ''

  if (sig.sharps > 0) {
    return `${sig.sharps}♯`
  } else if (sig.flats > 0) {
    return `${sig.flats}♭`
  }
  return '0'
}

export default function KeySelector({
  value = 'C',
  onChange,
  showEnharmonics = true,
  className,
  disabled = false,
  size = 'default',
  originalKey = null,
  includeMinorKeys = false
}) {
  const [preferFlats, setPreferFlats] = useState(value.includes('b'))

  // Get the appropriate key list based on preferences
  const keyList = preferFlats ? KEYS_CHROMATIC_FLATS : KEYS_CHROMATIC_SHARPS

  // Handle key selection
  const handleKeySelect = (newKey) => {
    onChange?.(newKey)
  }

  // Toggle between sharps and flats
  const toggleEnharmonic = () => {
    if (ENHARMONICS[value]) {
      const newKey = ENHARMONICS[value]
      onChange?.(newKey)
      setPreferFlats(!preferFlats)
    } else {
      setPreferFlats(!preferFlats)
    }
  }

  // Mobile-optimized button classes
  const buttonClasses = cn(
    'min-h-[44px]', // 44px minimum touch target
    'px-4',
    'justify-between',
    'font-medium',
    className
  )

  return (
    <div className="key-selector">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={size}
            disabled={disabled}
            className={buttonClasses}
            aria-label="Select key"
            aria-haspopup="listbox"
          >
            <span className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              <span className="text-base font-medium">{value}</span>
              {KEY_SIGNATURES[value] && (
                <span className="text-xs text-muted-foreground">
                  ({formatKeySignature(value)})
                </span>
              )}
            </span>
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-56 max-h-[60vh] overflow-y-auto"
          sideOffset={8}
        >
          <DropdownMenuLabel className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            Select Key
            {originalKey && originalKey !== value && (
              <span className="text-xs text-muted-foreground ml-auto">
                (Original: {originalKey})
              </span>
            )}
          </DropdownMenuLabel>

          {showEnharmonics && ENHARMONICS[value] && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  toggleEnharmonic()
                }}
                className="min-h-[44px] flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  {preferFlats ? <Minus className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                  Use {preferFlats ? 'Sharps' : 'Flats'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {ENHARMONICS[value]}
                </span>
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />

          {/* Common Keys (Circle of Fifths) */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Common Keys
          </DropdownMenuLabel>

          <DropdownMenuRadioGroup value={value} onValueChange={handleKeySelect}>
            {KEYS_CIRCLE_FIFTHS.map((key) => (
              <DropdownMenuRadioItem
                key={key}
                value={key}
                className="min-h-[44px] flex items-center justify-between"
              >
                <span className="flex items-center gap-3">
                  <span className="font-medium text-base">{key}</span>
                  {originalKey === key && (
                    <span className="text-xs text-muted-foreground">(Original)</span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatKeySignature(key)}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />

          {/* All Keys (Chromatic) */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            All Keys
          </DropdownMenuLabel>

          <DropdownMenuRadioGroup value={value} onValueChange={handleKeySelect}>
            {keyList.map((key) => (
              <DropdownMenuRadioItem
                key={key}
                value={key}
                className="min-h-[44px] flex items-center justify-between"
              >
                <span className="flex items-center gap-3">
                  <span className="font-medium text-base">{key}</span>
                  {originalKey === key && (
                    <span className="text-xs text-muted-foreground">(Original)</span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatKeySignature(key)}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>

          {/* Minor Keys (if enabled) */}
          {includeMinorKeys && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Minor Keys
              </DropdownMenuLabel>

              <DropdownMenuRadioGroup value={value} onValueChange={handleKeySelect}>
                {['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm'].map(
                  (key) => (
                    <DropdownMenuRadioItem
                      key={key}
                      value={key}
                      className="min-h-[44px] flex items-center"
                    >
                      <span className="font-medium text-base">{key}</span>
                    </DropdownMenuRadioItem>
                  )
                )}
              </DropdownMenuRadioGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}