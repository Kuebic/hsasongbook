/**
 * Rhythm Bracket Utilities
 *
 * Handles detection and transposition of chords within rhythm/timing notation
 * brackets like [D / / / | A/C# / / / |]
 */

import { Chord } from 'chordsheetjs'

/**
 * Detects if a bracket contains rhythm notation (/ or | markers)
 * as opposed to a simple chord like [Am7] or slash chord like [D/F#]
 *
 * @param bracketContent - The content inside the brackets (without the brackets themselves)
 * @returns true if this is a rhythm bracket, false if it's a regular chord
 */
export function isRhythmBracket(bracketContent: string): boolean {
  // A slash chord like "A/C#" has / immediately followed by [A-G]
  // A rhythm marker / is followed by space, |, or end of content
  // Also check for | which is always a bar line
  return /(?:^|[^A-Ga-g#b])\/(?:[^A-Ga-g]|$)/.test(bracketContent) ||
         bracketContent.includes('|')
}

/**
 * Chord regex pattern - matches chord names like D, Am7, F#m7b5, A/C#
 * This pattern matches:
 * - Root note: A-G with optional # or b
 * - Quality modifiers: m, maj, min, dim, aug, sus2, sus4
 * - Extensions: add9, 7, 9, 11, 13, M7 (major 7)
 * - Bass note: /A-G with optional # or b
 */
const CHORD_PATTERN = /\b([A-G][#b]?(?:m|maj|min|dim|aug|sus[24]?|add\d+|M?\d+)*(?:\/[A-G][#b]?)?)\b/g

/**
 * Transposes a single chord by the given number of semitones
 *
 * @param chordName - The chord name to transpose (e.g., "Am7", "D/F#")
 * @param semitones - Number of semitones to transpose (positive = up, negative = down)
 * @param preferFlats - If true, use flats (Bb) instead of sharps (A#)
 * @returns The transposed chord name, or the original if transposition fails
 */
function transposeChord(
  chordName: string,
  semitones: number,
  preferFlats: boolean
): string {
  if (semitones === 0) return chordName

  try {
    const chord = Chord.parse(chordName)
    if (!chord) return chordName

    const transposed = chord.transpose(semitones)
    const modifier = preferFlats ? 'b' : '#'
    return transposed.useModifier(modifier).toString()
  } catch {
    // Return unchanged if parsing fails (e.g., invalid chord name)
    return chordName
  }
}

/**
 * Transposes all chords within rhythm bracket content
 *
 * @param content - The content inside a rhythm bracket
 * @param semitones - Number of semitones to transpose
 * @param preferFlats - If true, use flats instead of sharps
 * @returns The content with all chords transposed
 */
function transposeRhythmContent(
  content: string,
  semitones: number,
  preferFlats: boolean
): string {
  return content.replace(CHORD_PATTERN, (match) => {
    return transposeChord(match, semitones, preferFlats)
  })
}

/**
 * Main function: Find and transpose all rhythm brackets in ChordPro text
 *
 * This function finds all bracket patterns [...] in the text, determines
 * if they are rhythm brackets (contain / or | rhythm markers), and if so,
 * transposes the chords within them while preserving the rhythm notation.
 *
 * @param text - The full ChordPro text content
 * @param semitones - Number of semitones to transpose (positive = up, negative = down)
 * @param preferFlats - If true, use flats (Bb) instead of sharps (A#)
 * @returns The text with rhythm bracket chords transposed
 *
 * @example
 * transposeRhythmBrackets("[D / / / | A/C# / / / |]", 2, false)
 * // Returns: "[E / / / | B/D# / / / |]"
 */
export function transposeRhythmBrackets(
  text: string,
  semitones: number,
  preferFlats: boolean
): string {
  // Early return if no transposition needed
  if (semitones === 0) return text

  // Match all brackets: [...]
  return text.replace(/\[([^\]]+)\]/g, (fullMatch, content) => {
    // Only process if it's a rhythm bracket
    if (isRhythmBracket(content)) {
      const transposedContent = transposeRhythmContent(content, semitones, preferFlats)
      return `[${transposedContent}]`
    }
    // Return unchanged for regular chord brackets (ChordSheetJS handles those)
    return fullMatch
  })
}
