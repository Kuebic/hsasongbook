/**
 * Simple ChordPro parser for MVP
 * Handles basic directives and chord notation
 */
export function parseChordPro(content) {
  if (!content) return { metadata: {}, lines: [] }

  const lines = content.split('\n')
  const metadata = {}
  const parsedLines = []

  // Regex patterns
  const directivePattern = /^\{([^:]+):\s*(.+)\}$/
  const chordPattern = /\[([^\]]+)\]/g
  const commentPattern = /^\{comment:\s*(.+)\}$/i

  lines.forEach(line => {
    // Parse directives
    const directiveMatch = line.match(directivePattern)
    if (directiveMatch) {
      const [, key, value] = directiveMatch
      metadata[key.toLowerCase()] = value
      return
    }

    // Parse comments
    const commentMatch = line.match(commentPattern)
    if (commentMatch) {
      parsedLines.push({
        type: 'comment',
        content: commentMatch[1]
      })
      return
    }

    // Parse lines with chords
    if (line.includes('[')) {
      const parts = []
      let lastIndex = 0

      // Extract chords and lyrics
      const matches = [...line.matchAll(chordPattern)]

      matches.forEach(match => {
        const chord = match[1]
        const index = match.index

        // Add lyrics before chord
        if (index > lastIndex) {
          parts.push({
            type: 'lyrics',
            content: line.substring(lastIndex, index)
          })
        }

        // Add chord
        parts.push({
          type: 'chord',
          content: chord
        })

        lastIndex = index + match[0].length
      })

      // Add remaining lyrics
      if (lastIndex < line.length) {
        parts.push({
          type: 'lyrics',
          content: line.substring(lastIndex)
        })
      }

      parsedLines.push({
        type: 'line',
        parts
      })
    } else if (line.trim()) {
      // Regular text line
      parsedLines.push({
        type: 'text',
        content: line
      })
    } else {
      // Empty line
      parsedLines.push({
        type: 'empty'
      })
    }
  })

  return { metadata, lines: parsedLines }
}

/**
 * Format ChordPro for display
 */
export function formatChordProLine(lineData) {
  if (lineData.type === 'comment') {
    return { chord: '', lyrics: `(${lineData.content})`, isComment: true }
  }

  if (lineData.type === 'text') {
    return { chord: '', lyrics: lineData.content }
  }

  if (lineData.type === 'empty') {
    return { chord: '', lyrics: '' }
  }

  if (lineData.type === 'line') {
    let chordLine = ''
    let lyricsLine = ''
    let chordPositions = []

    lineData.parts.forEach(part => {
      if (part.type === 'chord') {
        chordPositions.push({
          chord: part.content,
          position: lyricsLine.length
        })
      } else if (part.type === 'lyrics') {
        lyricsLine += part.content
      }
    })

    // Build chord line with proper spacing
    let lastPosition = 0
    chordPositions.forEach(({ chord, position }) => {
      const spaces = Math.max(0, position - lastPosition)
      chordLine += ' '.repeat(spaces) + chord
      lastPosition = position + chord.length
    })

    return { chord: chordLine, lyrics: lyricsLine }
  }

  return { chord: '', lyrics: '' }
}