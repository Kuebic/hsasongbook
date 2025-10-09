/**
 * CapoSelector Component
 *
 * Dropdown selector for capo position (0-12 frets)
 * Mobile-optimized with 44px touch targets
 */

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Guitar, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Capo positions (0-12 frets)
const CAPO_POSITIONS = Array.from({ length: 13 }, (_, i) => i)

interface CapoSelectorProps {
  value?: number;
  onChange: (capo: number) => void;
  className?: string;
  disabled?: boolean;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  id?: string;
}

export default function CapoSelector({
  value = 0,
  onChange,
  className,
  disabled = false,
  size = 'default',
  id
}: CapoSelectorProps) {
  // Format capo label
  const getCapoLabel = (capo: number): string => {
    if (capo === 0) {
      return 'No Capo'
    }
    return `${capo}${capo === 1 ? 'st' : capo === 2 ? 'nd' : capo === 3 ? 'rd' : 'th'} Fret`
  }

  // Mobile-optimized button classes
  const buttonClasses = cn(
    'min-h-[44px]', // 44px minimum touch target
    'px-4',
    'justify-between',
    className
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          disabled={disabled}
          className={buttonClasses}
          aria-label="Select capo position"
          id={id}
        >
          <span className="flex items-center gap-2">
            <Guitar className="h-4 w-4" />
            <span>{getCapoLabel(value)}</span>
          </span>
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-48 max-h-[60vh] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Guitar className="h-4 w-4" />
          Select Capo
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuRadioGroup value={value.toString()} onValueChange={(val) => onChange(parseInt(val, 10))}>
          {CAPO_POSITIONS.map((capo) => (
            <DropdownMenuRadioItem
              key={capo}
              value={capo.toString()}
              className="min-h-[44px] flex items-center"
            >
              <span className="flex items-center gap-3">
                <span className="font-medium">{getCapoLabel(capo)}</span>
                {capo === 0 && <span className="text-xs text-muted-foreground">(Default)</span>}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
