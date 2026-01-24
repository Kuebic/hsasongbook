/**
 * ArrangementMetadataForm Component
 *
 * Form for editing arrangement metadata (key, tempo, capo, time signature)
 * Replaces manual ChordPro directive editing with structured UI
 * Auto-saves changes with debouncing
 */

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import KeySelector from '@/features/chordpro/components/KeySelector'
import CapoSelector from './CapoSelector'
import TimeSignatureSelector from './TimeSignatureSelector'
import TempoInput from './TempoInput'
import DifficultySelector from './DifficultySelector'
import type { DifficultyOption } from '../validation/arrangementSchemas'
import { validateAllMetadata } from '../utils/metadataValidation'
import logger from '@/lib/logger'
import type { ArrangementMetadata } from '@/types'

// Debounce helper function
function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

interface MetadataErrors {
  key?: string;
  tempo?: string;
  timeSignature?: string;
  capo?: string;
}

interface ArrangementMetadataFormProps {
  metadata: ArrangementMetadata;
  onChange?: (metadata: ArrangementMetadata) => void;
  disabled?: boolean;
  className?: string;
}

export default function ArrangementMetadataForm({
  metadata,
  onChange,
  disabled = false,
  className
}: ArrangementMetadataFormProps) {
  // Local form state
  const [formState, setFormState] = useState<ArrangementMetadata>({
    key: metadata?.key || 'C',
    tempo: metadata?.tempo || 120,
    timeSignature: metadata?.timeSignature || '4/4',
    capo: metadata?.capo || 0,
    difficulty: metadata?.difficulty
  })

  const [errors, setErrors] = useState<MetadataErrors>({})
  const [isDirty, setIsDirty] = useState(false)

  // Sync with parent metadata changes
  useEffect(() => {
    if (metadata) {
      setFormState({
        key: metadata.key || 'C',
        tempo: metadata.tempo || 120,
        timeSignature: metadata.timeSignature || '4/4',
        capo: metadata.capo || 0,
        difficulty: metadata.difficulty
      })
      setIsDirty(false)
    }
  }, [metadata])

  // Debounced onChange callback
  const debouncedOnChange = useMemo(
    () => debounce((newMetadata: ArrangementMetadata) => {
      logger.debug('Metadata form: saving changes', newMetadata)
      onChange?.(newMetadata)
      setIsDirty(false)
    }, 1000),
    [onChange]
  )

  // Handle field changes
  const handleFieldChange = <K extends keyof ArrangementMetadata>(
    field: K,
    value: ArrangementMetadata[K]
  ): void => {
    logger.debug(`Metadata form: ${field} changed to`, value)

    // Update local state
    const newFormState = { ...formState, [field]: value }
    setFormState(newFormState)
    setIsDirty(true)

    // Validate all fields
    const validation = validateAllMetadata(newFormState)

    if (validation.valid) {
      // Clear errors for this field
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })

      // Trigger debounced save
      debouncedOnChange(newFormState)
    } else {
      // Set errors
      setErrors(validation.errors as MetadataErrors)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Arrangement Settings</CardTitle>
        <p className="text-sm text-muted-foreground">
          Edit musical metadata via form fields instead of typing ChordPro directives
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Key Selector */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="key" className="text-sm font-medium">
              Key
            </Label>
            <KeySelector
              value={formState.key}
              onChange={(key) => handleFieldChange('key', key)}
              disabled={disabled}
              id="key"
            />
            {errors.key && (
              <p className="text-xs text-destructive">{errors.key}</p>
            )}
          </div>

          {/* Tempo Input */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="tempo" className="text-sm font-medium">
              Tempo
            </Label>
            <TempoInput
              value={formState.tempo}
              onChange={(tempo) => handleFieldChange('tempo', typeof tempo === 'string' ? parseInt(tempo, 10) || 120 : tempo)}
              disabled={disabled}
              error={errors.tempo}
            />
          </div>

          {/* Capo Selector */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="capo" className="text-sm font-medium">
              Capo
            </Label>
            <CapoSelector
              value={formState.capo}
              onChange={(capo) => handleFieldChange('capo', capo)}
              disabled={disabled}
              id="capo"
            />
            {errors.capo && (
              <p className="text-xs text-destructive">{errors.capo}</p>
            )}
          </div>

          {/* Time Signature Selector */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="timeSignature" className="text-sm font-medium">
              Time Signature
            </Label>
            <TimeSignatureSelector
              value={formState.timeSignature}
              onChange={(ts) => handleFieldChange('timeSignature', ts)}
              disabled={disabled}
              id="timeSignature"
            />
            {errors.timeSignature && (
              <p className="text-xs text-destructive">{errors.timeSignature}</p>
            )}
          </div>

          {/* Difficulty Selector */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="difficulty" className="text-sm font-medium">
              Difficulty
            </Label>
            <DifficultySelector
              value={formState.difficulty as DifficultyOption | undefined}
              onChange={(difficulty) => handleFieldChange('difficulty', difficulty)}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Save status indicator */}
        {isDirty && (
          <div className="mt-4 text-xs text-muted-foreground">
            Saving changes...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
