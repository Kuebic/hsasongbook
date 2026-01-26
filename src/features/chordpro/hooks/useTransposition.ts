/**
 * useTransposition Hook
 *
 * Handles real-time chord transposition using ChordSheetJS
 * Provides transposition controls and key detection
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import type { Song as ChordSheetSong } from 'chordsheetjs'
import logger from '@/lib/logger'
import type { UseTranspositionReturn } from '../types'

// Musical constants
const CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const CHROMATIC_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const

// Theoretical sharp keys that should prefer their flat enharmonic equivalents
// G# major = 8 sharps (theoretical) → prefer Ab major = 4 flats
// D# major = 9 sharps (theoretical) → prefer Eb major = 3 flats
// A# major = 10 sharps (theoretical) → prefer Bb major = 2 flats
const UNUSUAL_SHARP_KEYS = new Set(['G#', 'D#', 'A#'])

// Theoretical flat keys that should prefer their sharp enharmonic equivalents
// Cb major = 7 flats → prefer B major = 5 sharps
// Fb would be E, but Fb isn't in our chromatic scale
const UNUSUAL_FLAT_KEYS = new Set(['Cb'])


/**
 * Get key at specified semitone offset
 */
function transposeKey(key: string, semitones: number, preferFlats: boolean = false): string {
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
 */
export function useTransposition(
  parsedSong: ChordSheetSong | null,
  originalKey: string = 'C'
): UseTranspositionReturn {
  // State management
  const [transpositionOffset, setTranspositionOffset] = useState<number>(0)

  // Compute ideal preferFlats synchronously (no flash!)
  // This avoids unusual/theoretical keys like G#, D#, A# (prefer Ab, Eb, Bb)
  const computedPreferFlats = useMemo(() => {
    const keyWithSharps = transposeKey(originalKey, transpositionOffset, false)
    const keyWithFlats = transposeKey(originalKey, transpositionOffset, true)

    // If the sharp spelling is unusual (G#, D#, A#), prefer flats (Ab, Eb, Bb)
    if (UNUSUAL_SHARP_KEYS.has(keyWithSharps)) {
      return true
    }
    // If the flat spelling is unusual (Cb), prefer sharps (B)
    if (UNUSUAL_FLAT_KEYS.has(keyWithFlats)) {
      return false
    }
    // Otherwise, use the original key's preference (flat keys stay flat, sharp keys stay sharp)
    return originalKey.includes('b')
  }, [originalKey, transpositionOffset])

  // User override: null = use computed, boolean = user explicitly chose
  const [userPreferFlatsOverride, setUserPreferFlatsOverride] = useState<boolean | null>(null)

  // Reset override when key/offset changes (so auto-calculation takes over again)
  useEffect(() => {
    setUserPreferFlatsOverride(null)
  }, [originalKey, transpositionOffset])

  // Final value: user wins if they toggled, otherwise use computed
  const preferFlats = userPreferFlatsOverride ?? computedPreferFlats

  // Calculate current key based on offset
  const currentKey = useMemo(() => {
    return transposeKey(originalKey, transpositionOffset, preferFlats)
  }, [originalKey, transpositionOffset, preferFlats])

  // Transpose the song with memoization (and apply enharmonic preference)
  const transposedSong = useMemo(() => {
    if (!parsedSong) {
      return parsedSong
    }

    try {
      // Start with the original song
      let processedSong = parsedSong

      // Apply transposition if needed
      if (transpositionOffset !== 0) {
        processedSong = processedSong.transpose(transpositionOffset)
      }

      // Apply enharmonic preference (flats vs sharps) using ChordSheetJS built-in method
      // This converts all chords to use the preferred modifier (e.g., Bb vs A#)
      // Note: useModifier('#') may produce B# for C, or useModifier('b') may produce Fb for E
      const modifier = preferFlats ? 'b' : '#'
      processedSong = processedSong.useModifier(modifier)

      // Normalize enharmonic spellings AFTER applying modifier preference
      // This converts B# -> C, E# -> F, Cb -> B, Fb -> E (the problematic over-conversions)
      processedSong = processedSong.normalizeChords()

      return processedSong
    } catch (error) {
      logger.error('Chord processing failed:', error)
      return parsedSong
    }
  }, [parsedSong, transpositionOffset, preferFlats])

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

  const reset = useCallback(() => {
    setTranspositionOffset(0)
    logger.info('Reset transposition to original key:', originalKey)
  }, [originalKey])

  const toggleEnharmonic = useCallback(() => {
    setUserPreferFlatsOverride(prev => !(prev ?? computedPreferFlats))
    logger.info('Toggled enharmonic preference:', preferFlats ? 'sharps' : 'flats')
  }, [computedPreferFlats, preferFlats])

  return {
    // State
    transposedSong,
    currentKey,
    originalKey,
    transpositionOffset,
    preferFlats,

    // Actions
    transposeBy,
    transposeUp,
    transposeDown,
    reset,
    toggleEnharmonic,

    // Utils
    isTransposed: transpositionOffset !== 0,
    canTransposeUp: transpositionOffset < 11,
    canTransposeDown: transpositionOffset > -11
  }
}