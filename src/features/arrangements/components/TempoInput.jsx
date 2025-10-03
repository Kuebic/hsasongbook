/**
 * TempoInput Component
 *
 * Number input with BPM validation (20-300)
 * Shows visual feedback for valid/invalid values
 */

import { Input } from '@/components/ui/input'
import { validateTempo, METADATA_CONSTANTS } from '../utils/metadataValidation'
import { cn } from '@/lib/utils'

const { MIN_TEMPO, MAX_TEMPO } = METADATA_CONSTANTS

export default function TempoInput({
  value,
  onChange,
  disabled = false,
  error,
  className
}) {
  const handleChange = (e) => {
    const newValue = e.target.value

    // Allow empty string for clearing
    if (newValue === '') {
      onChange('')
      return
    }

    // Only allow numbers
    const numericValue = parseInt(newValue, 10)
    if (!isNaN(numericValue)) {
      onChange(numericValue)
    }
  }

  const handleBlur = () => {
    // On blur, validate and clamp to valid range
    if (value === '' || value === null || value === undefined) {
      return
    }

    const numericValue = typeof value === 'string' ? parseInt(value, 10) : value

    if (!isNaN(numericValue)) {
      // Clamp to valid range
      const clampedValue = Math.max(MIN_TEMPO, Math.min(MAX_TEMPO, numericValue))
      if (clampedValue !== numericValue) {
        onChange(clampedValue)
      }
    }
  }

  // Check if current value is valid
  const validation = validateTempo(value)
  const isInvalid = value !== '' && value !== null && value !== undefined && !validation.valid

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <Input
          type="number"
          value={value ?? ''}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          min={MIN_TEMPO}
          max={MAX_TEMPO}
          placeholder={`${MIN_TEMPO}-${MAX_TEMPO}`}
          className={cn(
            'pr-16',
            isInvalid && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          aria-label="Tempo in BPM"
          aria-invalid={isInvalid}
          aria-describedby={error ? 'tempo-error' : undefined}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
          BPM
        </span>
      </div>

      {/* Error message */}
      {error && (
        <p id="tempo-error" className="text-xs text-destructive">
          {error}
        </p>
      )}

      {/* Helper text */}
      {!error && (
        <p className="text-xs text-muted-foreground">
          {MIN_TEMPO}-{MAX_TEMPO} beats per minute
        </p>
      )}
    </div>
  )
}
