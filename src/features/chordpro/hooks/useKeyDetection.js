/**
 * useKeyDetection Hook
 *
 * Analyzes chord progressions to detect the likely key of a song
 * Uses chord histogram analysis and key signature matching
 */

import { useMemo } from 'react'
import logger from '@/lib/logger'

// Key signatures with their characteristic chords
const KEY_SIGNATURES = {
  // Major keys with their diatonic chords
  'C': ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
  'G': ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'],
  'D': ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'],
  'A': ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#dim'],
  'E': ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim'],
  'B': ['B', 'C#m', 'D#m', 'E', 'F#', 'G#m', 'A#dim'],
  'F#': ['F#', 'G#m', 'A#m', 'B', 'C#', 'D#m', 'E#dim'],
  'F': ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim'],
  'Bb': ['Bb', 'Cm', 'Dm', 'Eb', 'F', 'Gm', 'Adim'],
  'Eb': ['Eb', 'Fm', 'Gm', 'Ab', 'Bb', 'Cm', 'Ddim'],
  'Ab': ['Ab', 'Bbm', 'Cm', 'Db', 'Eb', 'Fm', 'Gdim'],
  'Db': ['Db', 'Ebm', 'Fm', 'Gb', 'Ab', 'Bbm', 'Cdim'],
  'Gb': ['Gb', 'Abm', 'Bbm', 'Cb', 'Db', 'Ebm', 'Fdim'],

  // Minor keys (relative minors)
  'Am': ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G'],
  'Em': ['Em', 'F#dim', 'G', 'Am', 'Bm', 'C', 'D'],
  'Bm': ['Bm', 'C#dim', 'D', 'Em', 'F#m', 'G', 'A'],
  'F#m': ['F#m', 'G#dim', 'A', 'Bm', 'C#m', 'D', 'E'],
  'C#m': ['C#m', 'D#dim', 'E', 'F#m', 'G#m', 'A', 'B'],
  'G#m': ['G#m', 'A#dim', 'B', 'C#m', 'D#m', 'E', 'F#'],
  'D#m': ['D#m', 'E#dim', 'F#', 'G#m', 'A#m', 'B', 'C#'],
  'Dm': ['Dm', 'Edim', 'F', 'Gm', 'Am', 'Bb', 'C'],
  'Gm': ['Gm', 'Adim', 'Bb', 'Cm', 'Dm', 'Eb', 'F'],
  'Cm': ['Cm', 'Ddim', 'Eb', 'Fm', 'Gm', 'Ab', 'Bb'],
  'Fm': ['Fm', 'Gdim', 'Ab', 'Bbm', 'Cm', 'Db', 'Eb'],
  'Bbm': ['Bbm', 'Cdim', 'Db', 'Ebm', 'Fm', 'Gb', 'Ab']
}

// Weight important chords higher (I, IV, V chords)
const CHORD_WEIGHTS = {
  tonic: 3,      // I chord
  subdominant: 2, // IV chord
  dominant: 2,    // V chord
  other: 1       // Other diatonic chords
}

/**
 * Extract root note from chord string
 * @param {string} chordString - Full chord notation (e.g., "Cmaj7", "F#m")
 * @returns {string} Root note (e.g., "C", "F#m")
 */
function extractRootChord(chordString) {
  if (!chordString) return null

  // Remove bass note if present (e.g., "C/G" -> "C")
  const [chord] = chordString.split('/')

  // Extract root and quality (major/minor)
  const match = chord.match(/^([A-G][#b]?)(.*)/)
  if (!match) return null

  const [, root, suffix] = match

  // Determine if it's minor
  const isMinor = suffix.toLowerCase().startsWith('m') && !suffix.toLowerCase().startsWith('maj')

  return isMinor ? root + 'm' : root
}

/**
 * Build chord histogram from parsed song
 * @param {object} parsedSong - ChordSheetJS Song object
 * @returns {object} Chord frequency map
 */
function buildChordHistogram(parsedSong) {
  const histogram = {}

  if (!parsedSong || !parsedSong.lines) {
    return histogram
  }

  parsedSong.lines.forEach(line => {
    if (line.items && Array.isArray(line.items)) {
      line.items.forEach(item => {
        if (item.chords && typeof item.chords === 'string') {
          // Skip section markers
          const sectionMarkers = ['Verse', 'Chorus', 'Bridge', 'Intro', 'Outro', 'Pre-Chorus', 'Tag']
          if (sectionMarkers.includes(item.chords)) {
            return
          }

          const rootChord = extractRootChord(item.chords)
          if (rootChord) {
            histogram[rootChord] = (histogram[rootChord] || 0) + 1
          }
        }
      })
    }
  })

  return histogram
}

/**
 * Calculate confidence score for a key based on chord histogram
 * @param {object} histogram - Chord frequency map
 * @param {array} keyChords - Diatonic chords for the key
 * @returns {number} Confidence score (0-1)
 */
function calculateKeyConfidence(histogram, keyChords) {
  const totalChordCount = Object.values(histogram).reduce((sum, count) => sum + count, 0)
  if (totalChordCount === 0) return 0

  let matchedCount = 0
  let weightedScore = 0

  Object.entries(histogram).forEach(([chord, count]) => {
    const chordIndex = keyChords.indexOf(chord)
    if (chordIndex !== -1) {
      matchedCount += count

      // Apply weights based on chord function
      let weight = CHORD_WEIGHTS.other
      if (chordIndex === 0) weight = CHORD_WEIGHTS.tonic        // I chord
      else if (chordIndex === 3) weight = CHORD_WEIGHTS.subdominant // IV chord
      else if (chordIndex === 4) weight = CHORD_WEIGHTS.dominant     // V chord

      weightedScore += count * weight
    }
  })

  // Calculate raw match percentage
  const matchPercentage = matchedCount / totalChordCount

  // Calculate weighted score (normalized)
  const maxPossibleWeight = totalChordCount * CHORD_WEIGHTS.tonic
  const normalizedWeightedScore = weightedScore / maxPossibleWeight

  // Combine both metrics for final confidence
  const confidence = (matchPercentage * 0.5) + (normalizedWeightedScore * 0.5)

  return Math.min(1, confidence)
}

/**
 * Determine if a key is major or minor based on tonic chord
 * @param {string} key - Key name
 * @returns {object} Key signature information
 */
function getKeySignature(key) {
  const isMinor = key.endsWith('m')
  const sharpsFlats = {
    // Major keys
    'C': { sharps: 0, flats: 0 },
    'G': { sharps: 1, flats: 0 },
    'D': { sharps: 2, flats: 0 },
    'A': { sharps: 3, flats: 0 },
    'E': { sharps: 4, flats: 0 },
    'B': { sharps: 5, flats: 0 },
    'F#': { sharps: 6, flats: 0 },
    'Gb': { sharps: 0, flats: 6 },
    'F': { sharps: 0, flats: 1 },
    'Bb': { sharps: 0, flats: 2 },
    'Eb': { sharps: 0, flats: 3 },
    'Ab': { sharps: 0, flats: 4 },
    'Db': { sharps: 0, flats: 5 },

    // Minor keys
    'Am': { sharps: 0, flats: 0 },
    'Em': { sharps: 1, flats: 0 },
    'Bm': { sharps: 2, flats: 0 },
    'F#m': { sharps: 3, flats: 0 },
    'C#m': { sharps: 4, flats: 0 },
    'G#m': { sharps: 5, flats: 0 },
    'D#m': { sharps: 6, flats: 0 },
    'Dm': { sharps: 0, flats: 1 },
    'Gm': { sharps: 0, flats: 2 },
    'Cm': { sharps: 0, flats: 3 },
    'Fm': { sharps: 0, flats: 4 },
    'Bbm': { sharps: 0, flats: 5 }
  }

  return {
    mode: isMinor ? 'minor' : 'major',
    ...(sharpsFlats[key] || { sharps: 0, flats: 0 })
  }
}

/**
 * Main key detection hook
 * @param {object} parsedSong - ChordSheetJS Song object
 * @returns {object} Detected key information
 */
export function useKeyDetection(parsedSong) {
  const result = useMemo(() => {
    if (!parsedSong) {
      return {
        detectedKey: null,
        confidence: 0,
        keySignature: null,
        alternativeKeys: []
      }
    }

    logger.time('key-detection')

    try {
      // Build chord histogram from the song
      const histogram = buildChordHistogram(parsedSong)

      // If no chords found, return null
      if (Object.keys(histogram).length === 0) {
        logger.info('No chords found for key detection')
        return {
          detectedKey: null,
          confidence: 0,
          keySignature: null,
          alternativeKeys: []
        }
      }

      // Calculate confidence for each possible key
      const keyScores = []

      Object.entries(KEY_SIGNATURES).forEach(([key, chords]) => {
        const confidence = calculateKeyConfidence(histogram, chords)
        if (confidence > 0.3) { // Only consider keys with >30% confidence
          keyScores.push({ key, confidence })
        }
      })

      // Sort by confidence
      keyScores.sort((a, b) => b.confidence - a.confidence)

      logger.timeEnd('key-detection')

      if (keyScores.length === 0) {
        logger.info('Could not detect key with sufficient confidence')
        return {
          detectedKey: null,
          confidence: 0,
          keySignature: null,
          alternativeKeys: []
        }
      }

      // Get the most likely key
      const bestMatch = keyScores[0]
      const alternativeKeys = keyScores.slice(1, 4).map(k => ({
        key: k.key,
        confidence: k.confidence
      }))

      logger.info('Detected key:', bestMatch.key, 'with confidence:', bestMatch.confidence)

      return {
        detectedKey: bestMatch.key,
        confidence: bestMatch.confidence,
        keySignature: getKeySignature(bestMatch.key),
        alternativeKeys
      }
    } catch (error) {
      logger.error('Key detection failed:', error)
      return {
        detectedKey: null,
        confidence: 0,
        keySignature: null,
        alternativeKeys: []
      }
    }
  }, [parsedSong])

  return result
}