/**
 * useChordSheet Hook
 *
 * React hook that wraps ChordSheetJS parser and formatter
 * Provides memoized parsing and HTML generation with mobile optimizations
 */

import { useMemo } from 'react'
import ChordSheetJS from 'chordsheetjs'

export function useChordSheet(chordProText, showChords = true) {
  const result = useMemo(() => {
    if (!chordProText) {
      return { parsedSong: null, htmlOutput: '', metadata: {}, error: null, hasChords: false }
    }

    try {
      // Create parser instance (memoized for performance)
      const parser = new ChordSheetJS.ChordProParser()
      const song = parser.parse(chordProText)

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

      // Parse sections for navigation (future feature)
      const sections = []
      let currentSection = null

      song.lines.forEach(line => {
        line.items.forEach(item => {
          if (item instanceof ChordSheetJS.Tag) {
            if (item.name === 'start_of_chorus' || item.name === 'soc') {
              currentSection = { type: 'chorus', lines: [] }
              sections.push(currentSection)
            } else if (item.name === 'start_of_verse' || item.name === 'sov') {
              currentSection = { type: 'verse', lines: [] }
              sections.push(currentSection)
            } else if (item.name === 'start_of_bridge' || item.name === 'sob') {
              currentSection = { type: 'bridge', lines: [] }
              sections.push(currentSection)
            } else if (item.name === 'start_of_tab' || item.name === 'sot') {
              currentSection = { type: 'tab', lines: [] }
              sections.push(currentSection)
            } else if (item.name === 'end_of_chorus' || item.name === 'eoc' ||
                      item.name === 'end_of_verse' || item.name === 'eov' ||
                      item.name === 'end_of_bridge' || item.name === 'eob' ||
                      item.name === 'end_of_tab' || item.name === 'eot') {
              currentSection = null
            }
          }
        })

        if (currentSection) {
          currentSection.lines.push(line)
        }
      })

      return {
        parsedSong: song,
        htmlOutput,
        metadata,
        sections,
        hasChords,
        error: null
      }
    } catch (error) {
      console.error('ChordPro parsing error:', error)

      // Graceful fallback to display raw text
      return {
        parsedSong: null,
        htmlOutput: `<pre class="chord-pro-fallback">${chordProText}</pre>`,
        metadata: {},
        sections: [],
        hasChords: false,
        error: error.message || 'Failed to parse ChordPro content'
      }
    }
  }, [chordProText, showChords])

  return result
}