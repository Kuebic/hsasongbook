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
import { validateAllMetadata } from '../utils/metadataValidation'
import logger from '@/lib/logger'

// Debounce helper function
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export default function ArrangementMetadataForm({
  metadata,
  onChange,
  disabled = false,
  className
}) {
  // Local form state
  const [formState, setFormState] = useState({
    key: metadata?.key || 'C',
    tempo: metadata?.tempo || 120,
    timeSignature: metadata?.timeSignature || '4/4',
    capo: metadata?.capo || 0
  })

  const [errors, setErrors] = useState({})
  const [isDirty, setIsDirty] = useState(false)

  // Sync with parent metadata changes
  useEffect(() => {
    if (metadata) {
      setFormState({
        key: metadata.key || 'C',
        tempo: metadata.tempo || 120,
        timeSignature: metadata.timeSignature || '4/4',
        capo: metadata.capo || 0
      })
      setIsDirty(false)
    }
  }, [metadata])

  // Debounced onChange callback
  const debouncedOnChange = useMemo(
    () => debounce((newMetadata) => {
      logger.debug('Metadata form: saving changes', newMetadata)
      onChange?.(newMetadata)
      setIsDirty(false)
    }, 1000),
    [onChange]
  )

  // Handle field changes
  const handleFieldChange = (field, value) => {
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
      setErrors(validation.errors)
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
              onChange={(tempo) => handleFieldChange('tempo', tempo)}
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
