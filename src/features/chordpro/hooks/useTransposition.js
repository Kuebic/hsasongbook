/**
 * useTransposition Hook
 *
 * Handles real-time chord transposition using ChordSheetJS
 * Provides transposition controls and key detection
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

  // Transpose the song with memoization (and apply enharmonic preference)
  const transposedSong = useMemo(() => {
    if (!parsedSong) {
      return parsedSong
    }

    // If no transposition and using sharps (default), return original
    if (transpositionOffset === 0 && !preferFlats) {
      return parsedSong
    }

    try {
      // Apply transposition first if needed
      let processedSong = parsedSong
      if (transpositionOffset !== 0) {
        processedSong = parsedSong.transpose(transpositionOffset)
      }

      // If we're using sharps and no enharmonic change needed, return
      if (!preferFlats) {
        return processedSong
      }

      // Apply enharmonic preference by rebuilding with modified chords
      // This is necessary because Song objects are immutable
      const chordProLines = []

      // Preserve metadata
      if (processedSong.title) chordProLines.push(`{title: ${processedSong.title}}`)
      if (processedSong.artist) chordProLines.push(`{artist: ${processedSong.artist}}`)
      if (currentKey || processedSong.key) chordProLines.push(`{key: ${currentKey || processedSong.key}}`)
      if (processedSong.tempo) chordProLines.push(`{tempo: ${processedSong.tempo}}`)

      // Process lines with enharmonic conversion, preserving all content types
      processedSong.lines.forEach(line => {
        let lineText = ''

        line.items.forEach(item => {
          if (item instanceof ChordSheetJS.ChordLyricsPair) {
            // Handle chord/lyrics pairs
            if (item.chords) {
              try {
                const chord = ChordSheetJS.Chord.parse(item.chords)
                const modifiedChord = chord.useModifier(preferFlats ? 'b' : '#')
                lineText += `[${modifiedChord}]`
              } catch {
                lineText += `[${item.chords}]`
              }
            }
            if (item.lyrics) lineText += item.lyrics
          } else if (item instanceof ChordSheetJS.Comment) {
            // Preserve comments
            chordProLines.push(`{comment: ${item.content}}`)
          } else if (item instanceof ChordSheetJS.Tag) {
            // Preserve tags (section markers, etc.)
            if (item.value) {
              chordProLines.push(`{${item.name}: ${item.value}}`)
            } else {
              chordProLines.push(`{${item.name}}`)
            }
          } else if (item.content) {
            // Handle any other content types
            lineText += item.content
          }
        })

        // Always push the line to preserve empty lines and formatting
        chordProLines.push(lineText)
      })

      // Re-parse to get proper Song object
      const parser = new ChordSheetJS.ChordProParser()
      return parser.parse(chordProLines.join('\n'))

    } catch (error) {
      logger.error('Chord processing failed:', error)
      return parsedSong
    }
  }, [parsedSong, transpositionOffset, preferFlats, currentKey])

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