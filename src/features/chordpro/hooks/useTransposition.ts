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
// Enharmonic equivalents (reserved for future use)
// const ENHARMONICS = {
//   'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb',
//   'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
// }


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
  // Initialize preferFlats based on whether the original key contains a flat
  const [preferFlats, setPreferFlats] = useState<boolean>(originalKey.includes('b'))

  // Sync preferFlats when originalKey changes (e.g., navigating to different arrangement)
  useEffect(() => {
    setPreferFlats(originalKey.includes('b'))
  }, [originalKey])

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
      const modifier = preferFlats ? 'b' : '#'
      processedSong = processedSong.useModifier(modifier)

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
    setPreferFlats(!preferFlats)
    logger.info('Toggled enharmonic preference:', preferFlats ? 'sharps' : 'flats')
  }, [preferFlats])

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