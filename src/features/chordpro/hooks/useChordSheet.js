/**
 * useChordSheet Hook
 *
 * React hook that wraps ChordSheetJS parser and formatter
 * Provides memoized parsing and HTML generation with mobile optimizations
 * Supports metadata injection from arrangement object before parsing
 */

import { useMemo } from 'react'
import ChordSheetJS from 'chordsheetjs'
import { injectMetadata } from '../utils/metadataInjector'
import logger from '@/lib/logger'

export function useChordSheet(chordProText, showChords = true, arrangementMetadata = null, metadataKey = null) {
  const result = useMemo(() => {
    if (!chordProText) {
      return { parsedSong: null, htmlOutput: '', metadata: {}, hasChords: false, error: null }
    }

    try {
      // PRE-PROCESS: Inject metadata if provided
      let contentToProcess = chordProText

      if (arrangementMetadata) {
        contentToProcess = injectMetadata(
          chordProText,
          arrangementMetadata,
          { strategy: 'override-all' }  // CHANGED: Always override embedded directives with dropdown values
        )
      }

      // Create parser instance and parse (with potentially enhanced content)
      const parser = new ChordSheetJS.ChordProParser()
      const song = parser.parse(contentToProcess)

      // Extract comprehensive metadata
      const metadata = {
        title: song.title || null,
        artist: song.artist || song.subtitle || null,
        key: song.key || null,
        tempo: song.tempo || null,
        timeSignature: song.timeSignature || null,
        duration: song.duration || null,
        year: song.year || null,
        album: song.album || null
      }

      // Check if the song has chords
      const hasChords = song.lines.some(line =>
        line.items.some(item => item instanceof ChordSheetJS.ChordLyricsPair && item.chords)
      )

      // CRITICAL: Use HtmlDivFormatter for mobile responsiveness, not HtmlTableFormatter
      const formatter = new ChordSheetJS.HtmlDivFormatter()

      // Generate the HTML output
      let htmlOutput = formatter.format(song)

      // Add CSS class for chord visibility control
      if (!showChords) {
        // Wrap the output with a class to hide chords via CSS
        htmlOutput = `<div class="hide-chords">${htmlOutput}</div>`
      }

      return {
        parsedSong: song,
        htmlOutput,
        metadata,
        hasChords,
        error: null
      }
    } catch (error) {
      logger.error('ChordPro parsing error:', error)

      // Graceful fallback to display raw text
      return {
        parsedSong: null,
        htmlOutput: `<pre class="chord-pro-fallback">${chordProText}</pre>`,
        metadata: {},
        hasChords: false,
        error: error.message || 'Failed to parse ChordPro content'
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chordProText, showChords, arrangementMetadata, metadataKey])  // metadataKey forces re-compute on metadata change

  return result
}