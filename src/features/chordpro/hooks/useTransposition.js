/**
 * useTransposition Hook
 *
 * Handles real-time chord transposition using ChordSheetJS
 * Provides transposition controls, key detection, and capo calculation
 */

import { useState, useMemo, useCallback } from 'react'
import ChordSheetJS from 'chordsheetjs'
import logger from '@/lib/logger'

// Musical constants
const CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const CHROMATIC_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
// Enharmonic equivalents (reserved for future use)
// const ENHARMONICS = {
//   'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb',
//   'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
// }

/**
 * Calculate semitone distance between two keys
 * @param {string} fromKey - Starting key
 * @param {string} toKey - Target key
 * @returns {number} Number of semitones (can be negative)
 */
function calculateSemitoneDistance(fromKey, toKey) {
  // Normalize keys to use sharps for calculation
  const normalizeKey = (key) => {
    if (CHROMATIC_FLATS.includes(key)) {
      return CHROMATIC_SHARPS[CHROMATIC_FLATS.indexOf(key)]
    }
    return key
  }

  const normalizedFrom = normalizeKey(fromKey)
  const normalizedTo = normalizeKey(toKey)

  const fromIndex = CHROMATIC_SHARPS.indexOf(normalizedFrom)
  const toIndex = CHROMATIC_SHARPS.indexOf(normalizedTo)

  if (fromIndex === -1 || toIndex === -1) {
    logger.warn('Invalid key in semitone calculation:', { fromKey, toKey })
    return 0
  }

  let diff = toIndex - fromIndex

  // Optimize for smallest distance (e.g., +7 becomes -5)
  if (diff > 6) diff -= 12
  else if (diff < -6) diff += 12

  return diff
}

/**
 * Calculate capo position for guitarists
 * @param {string} originalKey - Original song key
 * @param {string} targetKey - Transposed key
 * @returns {number} Capo fret position (0-11)
 */
function calculateCapo(originalKey, targetKey) {
  const semitones = calculateSemitoneDistance(originalKey, targetKey)
  // For guitar, we want positive capo positions
  // If semitones is negative, we can suggest capo + playing in different key
  return semitones > 0 ? semitones : 0
}

/**
 * Get key at specified semitone offset
 * @param {string} key - Starting key
 * @param {number} semitones - Number of semitones to transpose
 * @param {boolean} preferFlats - Whether to prefer flats over sharps
 * @returns {string} Transposed key
 */
function transposeKey(key, semitones, preferFlats = false) {
  // Normalize to sharps for calculation
  let keyIndex = CHROMATIC_SHARPS.indexOf(key)
  if (keyIndex === -1) {
    keyIndex = CHROMATIC_FLATS.indexOf(key)
    if (keyIndex === -1) {
      logger.warn('Invalid key for transposition:', key)
      return key
    }
  }

  // Calculate new index with wrapping
  const newIndex = (keyIndex + semitones + 12) % 12

  // Return preferred notation
  return preferFlats ? CHROMATIC_FLATS[newIndex] : CHROMATIC_SHARPS[newIndex]
}

/**
 * Main transposition hook
 * @param {object} parsedSong - ChordSheetJS Song object from useChordSheet
 * @param {string} originalKey - Original key from metadata or detection
 * @returns {object} Transposition controls and state
 */
export function useTransposition(parsedSong, originalKey = 'C') {
  // State management
  const [transpositionOffset, setTranspositionOffset] = useState(0)
  const [preferFlats, setPreferFlats] = useState(false)

  // Calculate current key based on offset
  const currentKey = useMemo(() => {
    return transposeKey(originalKey, transpositionOffset, preferFlats)
  }, [originalKey, transpositionOffset, preferFlats])

  // Transpose the song with memoization
  const transposedSong = useMemo(() => {
    if (!parsedSong || transpositionOffset === 0) {
      return parsedSong
    }

    try {
      logger.time('transpose-operation')

      // Use ChordSheetJS built-in transposition
      // Create a new song with transposed chords
      const transposedSong = parsedSong.transpose(transpositionOffset)

      // Update key in metadata if present
      if (transposedSong.key) {
        transposedSong.key = currentKey
      }

      logger.timeEnd('transpose-operation')

      return transposedSong
    } catch (error) {
      logger.error('Transposition failed:', error)

      // If built-in transpose fails, try manual approach
      try {
        logger.info('Attempting manual transposition fallback')

        // Clone the song properly
        const clonedSong = parsedSong.clone()

        // Manually transpose each line
        clonedSong.lines.forEach(line => {
          line.items.forEach(item => {
            if (item.chords && typeof item.chords === 'string' && item.chords.trim()) {
              try {
                const chord = ChordSheetJS.Chord.parse(item.chords)
                if (chord) {
                  const transposed = chord.transpose(transpositionOffset)
                  item.chords = preferFlats
                    ? transposed.toString({ useFlats: true })
                    : transposed.toString()
                }
              } catch {
                logger.debug('Could not transpose chord:', item.chords)
              }
            }
          })
        })

        return clonedSong
      } catch (fallbackError) {
        logger.error('Manual transposition also failed:', fallbackError)
        return parsedSong
      }
    }
  }, [parsedSong, transpositionOffset, preferFlats, currentKey])

  // Capo position calculation
  const capoPosition = useMemo(() => {
    if (transpositionOffset === 0) return 0
    return calculateCapo(originalKey, currentKey)
  }, [originalKey, currentKey, transpositionOffset])

  // Control functions
  const transposeBy = useCallback((semitones) => {
    const newOffset = transpositionOffset + semitones
    // Limit to +/- 11 semitones (full octave minus one)
    if (newOffset >= -11 && newOffset <= 11) {
      setTranspositionOffset(newOffset)
      logger.info('Transposed by', semitones, 'semitones. New offset:', newOffset)
    }
  }, [transpositionOffset])

  const transposeUp = useCallback(() => {
    transposeBy(1)
  }, [transposeBy])

  const transposeDown = useCallback(() => {
    transposeBy(-1)
  }, [transposeBy])

  const transposeToKey = useCallback((targetKey) => {
    const semitones = calculateSemitoneDistance(originalKey, targetKey)
    setTranspositionOffset(semitones)
    logger.info('Transposed to key:', targetKey, '(', semitones, 'semitones)')
  }, [originalKey])

  const reset = useCallback(() => {
    setTranspositionOffset(0)
    logger.info('Reset transposition to original key:', originalKey)
  }, [originalKey])

  const toggleEnharmonic = useCallback(() => {
    setPreferFlats(!preferFlats)
    logger.info('Toggled enharmonic preference:', preferFlats ? 'sharps' : 'flats')
  }, [preferFlats])

  return {
    // State
    transposedSong,
    currentKey,
    originalKey,
    transpositionOffset,
    capoPosition,
    preferFlats,

    // Actions
    transposeBy,
    transposeUp,
    transposeDown,
    transposeToKey,
    reset,
    toggleEnharmonic,

    // Utils
    isTransposed: transpositionOffset !== 0,
    canTransposeUp: transpositionOffset < 11,
    canTransposeDown: transpositionOffset > -11
  }
}