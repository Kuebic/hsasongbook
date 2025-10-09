/**
 * TimeSignatureSelector Component
 *
 * Dropdown selector for time signatures
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
import { Clock, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimeSignature {
  value: string;
  label: string;
  description: string;
}

// Common time signatures grouped by type
const TIME_SIGNATURES: {
  common: TimeSignature[];
  advanced: TimeSignature[];
} = {
  common: [
    { value: '4/4', label: '4/4', description: 'Common Time' },
    { value: '3/4', label: '3/4', description: 'Waltz' },
    { value: '6/8', label: '6/8', description: 'Compound' }
  ],
  advanced: [
    { value: '2/4', label: '2/4', description: 'March' },
    { value: '5/4', label: '5/4', description: 'Irregular' },
    { value: '7/8', label: '7/8', description: 'Irregular' },
    { value: '9/8', label: '9/8', description: 'Compound' },
    { value: '12/8', label: '12/8', description: 'Compound' },
    { value: '2/2', label: '2/2', description: 'Cut Time' },
    { value: '3/8', label: '3/8', description: 'Simple' }
  ]
}

interface TimeSignatureSelectorProps {
  value?: string;
  onChange: (timeSignature: string) => void;
  className?: string;
  disabled?: boolean;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  id?: string;
}

export default function TimeSignatureSelector({
  value = '4/4',
  onChange,
  className,
  disabled = false,
  size = 'default',
  id
}: TimeSignatureSelectorProps) {
  // Mobile-optimized button classes
  const buttonClasses = cn(
    'min-h-[44px]', // 44px minimum touch target
    'px-4',
    'justify-between',
    className
  )

  // Find description for current value
  const getCurrentDescription = (): string => {
    const allSignatures = [...TIME_SIGNATURES.common, ...TIME_SIGNATURES.advanced]
    const current = allSignatures.find(sig => sig.value === value)
    return current?.description || ''
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          disabled={disabled}
          className={buttonClasses}
          aria-label="Select time signature"
          id={id}
        >
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="font-medium">{value}</span>
            {getCurrentDescription() && (
              <span className="text-xs text-muted-foreground">({getCurrentDescription()})</span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56 max-h-[60vh] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Select Time Signature
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Common time signatures */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Common
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {TIME_SIGNATURES.common.map((sig) => (
            <DropdownMenuRadioItem
              key={sig.value}
              value={sig.value}
              className="min-h-[44px] flex items-center justify-between"
            >
              <span className="flex items-center gap-3">
                <span className="font-medium text-base">{sig.label}</span>
              </span>
              <span className="text-xs text-muted-foreground">{sig.description}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        {/* Advanced time signatures */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Advanced
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {TIME_SIGNATURES.advanced.map((sig) => (
            <DropdownMenuRadioItem
              key={sig.value}
              value={sig.value}
              className="min-h-[44px] flex items-center justify-between"
            >
              <span className="flex items-center gap-3">
                <span className="font-medium text-base">{sig.label}</span>
              </span>
              <span className="text-xs text-muted-foreground">{sig.description}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
