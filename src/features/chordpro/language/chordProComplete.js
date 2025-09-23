/**
 * ChordPro Auto-completion Source
 *
 * Provides context-aware auto-completion for ChordPro directives and chord notation
 * Integrates with configuration system for customizable chord and directive lists
 */

import { autocompletion } from '@codemirror/autocomplete'
import { chordproConfig } from '@/lib/config'

/**
 * Common chord progressions and variations
 * Organized by chord root and type for efficient completion
 */
const commonChords = [
  // Major chords
  { label: 'C', type: 'chord', info: 'C major' },
  { label: 'D', type: 'chord', info: 'D major' },
  { label: 'E', type: 'chord', info: 'E major' },
  { label: 'F', type: 'chord', info: 'F major' },
  { label: 'G', type: 'chord', info: 'G major' },
  { label: 'A', type: 'chord', info: 'A major' },
  { label: 'B', type: 'chord', info: 'B major' },

  // Minor chords
  { label: 'Am', type: 'chord', info: 'A minor' },
  { label: 'Bm', type: 'chord', info: 'B minor' },
  { label: 'Cm', type: 'chord', info: 'C minor' },
  { label: 'Dm', type: 'chord', info: 'D minor' },
  { label: 'Em', type: 'chord', info: 'E minor' },
  { label: 'Fm', type: 'chord', info: 'F minor' },
  { label: 'Gm', type: 'chord', info: 'G minor' },

  // Seventh chords
  { label: 'C7', type: 'chord', info: 'C dominant 7th' },
  { label: 'D7', type: 'chord', info: 'D dominant 7th' },
  { label: 'E7', type: 'chord', info: 'E dominant 7th' },
  { label: 'F7', type: 'chord', info: 'F dominant 7th' },
  { label: 'G7', type: 'chord', info: 'G dominant 7th' },
  { label: 'A7', type: 'chord', info: 'A dominant 7th' },
  { label: 'B7', type: 'chord', info: 'B dominant 7th' },

  // Major 7th chords
  { label: 'Cmaj7', type: 'chord', info: 'C major 7th' },
  { label: 'Dmaj7', type: 'chord', info: 'D major 7th' },
  { label: 'Emaj7', type: 'chord', info: 'E major 7th' },
  { label: 'Fmaj7', type: 'chord', info: 'F major 7th' },
  { label: 'Gmaj7', type: 'chord', info: 'G major 7th' },
  { label: 'Amaj7', type: 'chord', info: 'A major 7th' },
  { label: 'Bmaj7', type: 'chord', info: 'B major 7th' },

  // Minor 7th chords
  { label: 'Am7', type: 'chord', info: 'A minor 7th' },
  { label: 'Bm7', type: 'chord', info: 'B minor 7th' },
  { label: 'Cm7', type: 'chord', info: 'C minor 7th' },
  { label: 'Dm7', type: 'chord', info: 'D minor 7th' },
  { label: 'Em7', type: 'chord', info: 'E minor 7th' },
  { label: 'Fm7', type: 'chord', info: 'F minor 7th' },
  { label: 'Gm7', type: 'chord', info: 'G minor 7th' },

  // Suspended chords
  { label: 'Csus2', type: 'chord', info: 'C suspended 2nd' },
  { label: 'Csus4', type: 'chord', info: 'C suspended 4th' },
  { label: 'Dsus2', type: 'chord', info: 'D suspended 2nd' },
  { label: 'Dsus4', type: 'chord', info: 'D suspended 4th' },
  { label: 'Esus4', type: 'chord', info: 'E suspended 4th' },
  { label: 'Fsus2', type: 'chord', info: 'F suspended 2nd' },
  { label: 'Gsus4', type: 'chord', info: 'G suspended 4th' },
  { label: 'Asus2', type: 'chord', info: 'A suspended 2nd' },
  { label: 'Asus4', type: 'chord', info: 'A suspended 4th' },

  // Sharps and flats
  { label: 'C#', type: 'chord', info: 'C sharp major' },
  { label: 'D#', type: 'chord', info: 'D sharp major' },
  { label: 'F#', type: 'chord', info: 'F sharp major' },
  { label: 'G#', type: 'chord', info: 'G sharp major' },
  { label: 'A#', type: 'chord', info: 'A sharp major' },
  { label: 'Db', type: 'chord', info: 'D flat major' },
  { label: 'Eb', type: 'chord', info: 'E flat major' },
  { label: 'Gb', type: 'chord', info: 'G flat major' },
  { label: 'Ab', type: 'chord', info: 'A flat major' },
  { label: 'Bb', type: 'chord', info: 'B flat major' },

  // Common slash chords
  { label: 'C/E', type: 'chord', info: 'C major over E bass' },
  { label: 'C/G', type: 'chord', info: 'C major over G bass' },
  { label: 'D/F#', type: 'chord', info: 'D major over F# bass' },
  { label: 'F/A', type: 'chord', info: 'F major over A bass' },
  { label: 'G/B', type: 'chord', info: 'G major over B bass' },
  { label: 'G/D', type: 'chord', info: 'G major over D bass' }
]

/**
 * ChordPro directive completions
 * Based on ChordPro v6 specification
 */
const directiveCompletions = [
  // Metadata directives
  { label: 'title', apply: '{title: }', type: 'directive', info: 'Song title' },
  { label: 'artist', apply: '{artist: }', type: 'directive', info: 'Song artist' },
  { label: 'composer', apply: '{composer: }', type: 'directive', info: 'Song composer' },
  { label: 'lyricist', apply: '{lyricist: }', type: 'directive', info: 'Song lyricist' },
  { label: 'copyright', apply: '{copyright: }', type: 'directive', info: 'Copyright notice' },
  { label: 'album', apply: '{album: }', type: 'directive', info: 'Album name' },
  { label: 'year', apply: '{year: }', type: 'directive', info: 'Release year' },
  { label: 'key', apply: '{key: }', type: 'directive', info: 'Song key' },
  { label: 'tempo', apply: '{tempo: }', type: 'directive', info: 'Beats per minute' },
  { label: 'time', apply: '{time: }', type: 'directive', info: 'Time signature' },
  { label: 'capo', apply: '{capo: }', type: 'directive', info: 'Capo position' },
  { label: 'duration', apply: '{duration: }', type: 'directive', info: 'Song duration' },

  // Environment directives
  { label: 'start_of_chorus', apply: '{start_of_chorus}', type: 'directive', info: 'Begin chorus section' },
  { label: 'end_of_chorus', apply: '{end_of_chorus}', type: 'directive', info: 'End chorus section' },
  { label: 'start_of_verse', apply: '{start_of_verse}', type: 'directive', info: 'Begin verse section' },
  { label: 'end_of_verse', apply: '{end_of_verse}', type: 'directive', info: 'End verse section' },
  { label: 'start_of_bridge', apply: '{start_of_bridge}', type: 'directive', info: 'Begin bridge section' },
  { label: 'end_of_bridge', apply: '{end_of_bridge}', type: 'directive', info: 'End bridge section' },
  { label: 'start_of_tab', apply: '{start_of_tab}', type: 'directive', info: 'Begin tablature section' },
  { label: 'end_of_tab', apply: '{end_of_tab}', type: 'directive', info: 'End tablature section' },

  // Abbreviated forms
  { label: 'soc', apply: '{soc}', type: 'directive', info: 'Start of chorus (abbreviated)' },
  { label: 'eoc', apply: '{eoc}', type: 'directive', info: 'End of chorus (abbreviated)' },
  { label: 'sov', apply: '{sov}', type: 'directive', info: 'Start of verse (abbreviated)' },
  { label: 'eov', apply: '{eov}', type: 'directive', info: 'End of verse (abbreviated)' },
  { label: 'sob', apply: '{sob}', type: 'directive', info: 'Start of bridge (abbreviated)' },
  { label: 'eob', apply: '{eob}', type: 'directive', info: 'End of bridge (abbreviated)' },
  { label: 'sot', apply: '{sot}', type: 'directive', info: 'Start of tab (abbreviated)' },
  { label: 'eot', apply: '{eot}', type: 'directive', info: 'End of tab (abbreviated)' },

  // Formatting directives
  { label: 'comment', apply: '{comment: }', type: 'directive', info: 'Inline comment' },
  { label: 'highlight', apply: '{highlight}', type: 'directive', info: 'Highlight following text' },
  { label: 'new_page', apply: '{new_page}', type: 'directive', info: 'Page break' },
  { label: 'new_song', apply: '{new_song}', type: 'directive', info: 'Start new song' },
  { label: 'column_break', apply: '{column_break}', type: 'directive', info: 'Column break' },

  // Abbreviated formatting
  { label: 'c', apply: '{c: }', type: 'directive', info: 'Comment (abbreviated)' },
  { label: 'np', apply: '{np}', type: 'directive', info: 'New page (abbreviated)' },
  { label: 'cb', apply: '{cb}', type: 'directive', info: 'Column break (abbreviated)' },

  // Advanced directives
  { label: 'define', apply: '{define: }', type: 'directive', info: 'Define chord fingering' },
  { label: 'transpose', apply: '{transpose: }', type: 'directive', info: 'Transpose directive' },
  { label: 'x_', apply: '{x_}', type: 'directive', info: 'Custom directive prefix' }
]

/**
 * Context-aware completion source for ChordPro
 * Analyzes cursor position to provide relevant completions
 */
function chordProCompletionSource(context) {
  const line = context.state.doc.lineAt(context.pos)
  const lineText = line.text
  const beforeCursor = lineText.slice(0, context.pos - line.from)

  // Check if we're inside a chord bracket
  const openBracket = beforeCursor.lastIndexOf('[')
  const closeBracket = beforeCursor.lastIndexOf(']')
  const inChordBracket = openBracket > closeBracket && openBracket !== -1

  if (inChordBracket) {
    // We're inside a chord bracket - provide chord completions
    const chordStart = openBracket + 1
    const chordText = beforeCursor.slice(chordStart)

    // Filter chords based on what's already typed
    const matchingChords = commonChords.filter(chord =>
      chord.label.toLowerCase().startsWith(chordText.toLowerCase())
    )

    // Add configured common chords
    const configChords = chordproConfig.editor.toolbar.commonChords
      .filter(chord => chord.toLowerCase().startsWith(chordText.toLowerCase()))
      .map(chord => ({ label: chord, type: 'chord', info: `${chord} chord` }))

    const allChords = [...matchingChords, ...configChords]
      .filter((chord, index, self) =>
        self.findIndex(c => c.label === chord.label) === index
      ) // Remove duplicates

    if (allChords.length > 0) {
      return {
        from: line.from + chordStart,
        options: allChords.slice(0, chordproConfig.editor.completion.maxRenderedOptions)
      }
    }
  }

  // Check if we're inside a directive bracket
  const openBrace = beforeCursor.lastIndexOf('{')
  const closeBrace = beforeCursor.lastIndexOf('}')
  const inDirectiveBrace = openBrace > closeBrace && openBrace !== -1

  if (inDirectiveBrace) {
    // We're inside a directive bracket - provide directive completions
    const directiveStart = openBrace + 1
    const directiveText = beforeCursor.slice(directiveStart)

    // Check if we have a colon (argument separator)
    const colonIndex = directiveText.indexOf(':')

    if (colonIndex === -1) {
      // No colon yet - complete directive names
      const matchingDirectives = directiveCompletions.filter(directive =>
        directive.label.toLowerCase().startsWith(directiveText.toLowerCase())
      )

      // Add configured directive shortcuts
      const configDirectives = chordproConfig.editor.toolbar.directiveShortcuts
        .filter(directive => directive.toLowerCase().startsWith(directiveText.toLowerCase()))
        .map(directive => ({
          label: directive,
          apply: `{${directive}: }`,
          type: 'directive',
          info: `${directive} directive`
        }))

      const allDirectives = [...matchingDirectives, ...configDirectives]
        .filter((directive, index, self) =>
          self.findIndex(d => d.label === directive.label) === index
        ) // Remove duplicates

      if (allDirectives.length > 0) {
        return {
          from: line.from + directiveStart,
          options: allDirectives.slice(0, chordproConfig.editor.completion.maxRenderedOptions)
        }
      }
    } else {
      // We have a colon - could provide argument completions for specific directives
      const directiveName = directiveText.slice(0, colonIndex).trim()

      // Provide key completions for {key: } directive
      if (directiveName === 'key') {
        const keyCompletions = [
          'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'
        ].map(key => ({ label: key, type: 'value', info: `Key of ${key}` }))

        const argStart = openBrace + 1 + colonIndex + 1
        const argText = beforeCursor.slice(argStart).trim()

        const matchingKeys = keyCompletions.filter(key =>
          key.label.toLowerCase().startsWith(argText.toLowerCase())
        )

        if (matchingKeys.length > 0) {
          return {
            from: line.from + argStart,
            options: matchingKeys
          }
        }
      }

      // Provide time signature completions for {time: } directive
      if (directiveName === 'time') {
        const timeCompletions = [
          '4/4', '3/4', '2/4', '6/8', '9/8', '12/8', '2/2', '3/8'
        ].map(time => ({ label: time, type: 'value', info: `${time} time signature` }))

        const argStart = openBrace + 1 + colonIndex + 1
        const argText = beforeCursor.slice(argStart).trim()

        const matchingTimes = timeCompletions.filter(time =>
          time.label.startsWith(argText)
        )

        if (matchingTimes.length > 0) {
          return {
            from: line.from + argStart,
            options: matchingTimes
          }
        }
      }
    }
  }

  // No specific context - don't show completions
  return null
}

/**
 * Create ChordPro auto-completion extension
 * @returns {Extension} CodeMirror auto-completion extension
 */
export function createChordProCompletion() {
  const config = chordproConfig.editor.completion

  return autocompletion({
    override: [chordProCompletionSource],
    activateOnTyping: config.activateOnTyping,
    maxRenderedOptions: config.maxRenderedOptions,
    closeOnBlur: true,
    selectOnOpen: false,
    // Don't show completions in comments
    optionClass: (completion) => `cm-completion-${completion.type}`,
    compareCompletions: (a, b) => {
      // Prioritize by type: chords, then directives, then values
      const typeOrder = { chord: 0, directive: 1, value: 2 }
      const aOrder = typeOrder[a.type] ?? 3
      const bOrder = typeOrder[b.type] ?? 3

      if (aOrder !== bOrder) return aOrder - bOrder

      // Then by label alphabetically
      return a.label.localeCompare(b.label)
    }
  })
}

/**
 * Create the ChordPro completion extension instance
 */
export const chordProCompletion = createChordProCompletion()

/**
 * Default export for convenient importing
 */
export default createChordProCompletion