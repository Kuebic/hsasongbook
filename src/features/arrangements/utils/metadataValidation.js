/**
 * Metadata Validation Utilities
 *
 * Validation functions for arrangement metadata fields
 * Used by ArrangementMetadataForm for user input validation
 */

// Musical keys (common in Western music)
const VALID_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  // Minor keys
  'Am', 'A#m', 'Bbm', 'Bm', 'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m'
]

// Common time signatures
const VALID_TIME_SIGNATURES = [
  '4/4', '3/4', '6/8', '2/4', '5/4', '7/8', '9/8', '12/8', '2/2', '3/8'
]

// Tempo range (typical musical range)
const MIN_TEMPO = 20  // Very slow (Larghissimo)
const MAX_TEMPO = 300 // Very fast (Prestissimo)

// Capo range (guitar frets)
const MIN_CAPO = 0
const MAX_CAPO = 12

/**
 * Validate tempo (BPM)
 * @param {number|string} value - Tempo value
 * @returns {Object} Validation result
 */
export function validateTempo(value) {
  if (value === null || value === undefined || value === '') {
    return { valid: true, error: null }  // Optional field
  }

  const tempo = typeof value === 'string' ? parseInt(value, 10) : value

  if (isNaN(tempo)) {
    return { valid: false, error: 'Tempo must be a number' }
  }

  if (tempo < MIN_TEMPO) {
    return { valid: false, error: `Tempo must be at least ${MIN_TEMPO} BPM` }
  }

  if (tempo > MAX_TEMPO) {
    return { valid: false, error: `Tempo must be ${MAX_TEMPO} BPM or less` }
  }

  return { valid: true, error: null }
}

/**
 * Validate capo position
 * @param {number|string} value - Capo fret number
 * @returns {Object} Validation result
 */
export function validateCapo(value) {
  if (value === null || value === undefined || value === '') {
    return { valid: true, error: null }  // Optional field, default to 0
  }

  const capo = typeof value === 'string' ? parseInt(value, 10) : value

  if (isNaN(capo)) {
    return { valid: false, error: 'Capo must be a number' }
  }

  if (capo < MIN_CAPO) {
    return { valid: false, error: `Capo must be at least ${MIN_CAPO}` }
  }

  if (capo > MAX_CAPO) {
    return { valid: false, error: `Capo must be ${MAX_CAPO} or less` }
  }

  return { valid: true, error: null }
}

/**
 * Validate musical key
 * @param {string} value - Key name (e.g., 'C', 'G', 'Am')
 * @returns {Object} Validation result
 */
export function validateKey(value) {
  if (!value || value.trim() === '') {
    return { valid: false, error: 'Key is required' }
  }

  const key = value.trim()

  if (!VALID_KEYS.includes(key)) {
    return { valid: false, error: `Invalid key. Must be one of: ${VALID_KEYS.join(', ')}` }
  }

  return { valid: true, error: null }
}

/**
 * Validate time signature
 * @param {string} value - Time signature (e.g., '4/4', '3/4')
 * @returns {Object} Validation result
 */
export function validateTimeSignature(value) {
  if (!value || value.trim() === '') {
    return { valid: true, error: null }  // Optional field
  }

  const timeSignature = value.trim()

  // Check format (number/number)
  if (!/^\d+\/\d+$/.test(timeSignature)) {
    return { valid: false, error: 'Time signature must be in format like 4/4 or 3/4' }
  }

  return { valid: true, error: null }
}

/**
 * Validate all metadata fields at once
 * @param {Object} metadata - Metadata object
 * @returns {Object} Validation results for all fields
 */
export function validateAllMetadata(metadata) {
  const errors = {}

  // Validate key
  const keyResult = validateKey(metadata.key)
  if (!keyResult.valid) {
    errors.key = keyResult.error
  }

  // Validate tempo
  const tempoResult = validateTempo(metadata.tempo)
  if (!tempoResult.valid) {
    errors.tempo = tempoResult.error
  }

  // Validate capo
  const capoResult = validateCapo(metadata.capo)
  if (!capoResult.valid) {
    errors.capo = capoResult.error
  }

  // Validate time signature
  const timeSignatureResult = validateTimeSignature(metadata.timeSignature)
  if (!timeSignatureResult.valid) {
    errors.timeSignature = timeSignatureResult.error
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// Export constants for use in components
export const METADATA_CONSTANTS = {
  VALID_KEYS,
  VALID_TIME_SIGNATURES,
  MIN_TEMPO,
  MAX_TEMPO,
  MIN_CAPO,
  MAX_CAPO
}

export default {
  validateTempo,
  validateCapo,
  validateKey,
  validateTimeSignature,
  validateAllMetadata,
  METADATA_CONSTANTS
}
