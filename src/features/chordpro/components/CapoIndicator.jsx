/**
 * CapoIndicator Component
 *
 * Displays capo position and chord shapes for guitarists
 * Helps guitarists play in different keys using familiar chord shapes
 */

import { Card, CardContent } from '@/components/ui/card'
import { Info, Guitar } from 'lucide-react'
import { cn } from '@/lib/utils'

// Common chord shape mappings for capo positions (reserved for future use)
// const CHORD_SHAPE_MAP = {
//   'C': { 0: 'C', 2: 'D', 3: 'Eb', 5: 'F', 7: 'G', 8: 'Ab', 10: 'Bb' },
//   'G': { 0: 'G', 2: 'A', 3: 'Bb', 5: 'C', 7: 'D', 8: 'Eb', 10: 'F' },
//   'D': { 0: 'D', 2: 'E', 3: 'F', 5: 'G', 7: 'A', 8: 'Bb', 10: 'C' },
//   'A': { 0: 'A', 2: 'B', 3: 'C', 5: 'D', 7: 'E', 8: 'F', 10: 'G' },
//   'E': { 0: 'E', 2: 'F#', 3: 'G', 5: 'A', 7: 'B', 8: 'C', 10: 'D' },
//   'Am': { 0: 'Am', 2: 'Bm', 3: 'Cm', 5: 'Dm', 7: 'Em', 8: 'Fm', 10: 'Gm' },
//   'Em': { 0: 'Em', 2: 'F#m', 3: 'Gm', 5: 'Am', 7: 'Bm', 8: 'Cm', 10: 'Dm' },
//   'Dm': { 0: 'Dm', 2: 'Em', 3: 'Fm', 5: 'Gm', 7: 'Am', 8: 'Bbm', 10: 'Cm' }
// }

// Common progressions that work well with capo
const COMMON_PROGRESSIONS = {
  'G': ['G', 'Em', 'C', 'D'],
  'C': ['C', 'Am', 'F', 'G'],
  'D': ['D', 'Bm', 'G', 'A'],
  'A': ['A', 'F#m', 'D', 'E'],
  'E': ['E', 'C#m', 'A', 'B']
}

/**
 * Calculate optimal capo position and chord shapes
 * @param {string} originalKey - Original key of the song
 * @param {string} currentKey - Current transposed key
 * @returns {object} Capo info with position and suggested shapes
 */
function calculateCapoInfo(originalKey, currentKey) {
  // Key indices for calculation
  const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const CHROMATIC_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

  // Normalize keys to chromatic scale
  let origIndex = CHROMATIC.indexOf(originalKey)
  if (origIndex === -1) origIndex = CHROMATIC_FLAT.indexOf(originalKey)

  let currIndex = CHROMATIC.indexOf(currentKey)
  if (currIndex === -1) currIndex = CHROMATIC_FLAT.indexOf(currentKey)

  if (origIndex === -1 || currIndex === -1) {
    return { position: 0, shapes: null, suggestion: null }
  }

  // Calculate semitone difference
  let semitones = (currIndex - origIndex + 12) % 12

  // Find best capo position (prefer lower positions)
  let capoPosition = 0
  let playInKey = currentKey
  let suggestion = null

  // If we're transposing up, we can use a capo
  if (semitones > 0 && semitones <= 7) {
    capoPosition = semitones
    playInKey = originalKey
    suggestion = `Capo ${capoPosition} and play in ${originalKey} shapes`
  }
  // If transposing down or too high, suggest alternative
  else if (semitones > 7) {
    // Try to find a comfortable key with capo
    const alternativeCapo = 12 - semitones
    suggestion = `Try capo ${alternativeCapo} and play ${alternativeCapo} semitones higher`
  }
  else if (semitones < 0) {
    suggestion = `No capo needed - play in ${currentKey} directly`
  }

  // Get chord shapes for the play key
  const shapes = COMMON_PROGRESSIONS[playInKey] || null

  return {
    position: capoPosition,
    playInKey,
    shapes,
    suggestion
  }
}

export default function CapoIndicator({
  originalKey = 'C',
  currentKey = 'C',
  showChordShapes = true,
  className,
  variant = 'default' // 'default' | 'compact' | 'detailed'
}) {
  // Calculate capo information
  const capoInfo = calculateCapoInfo(originalKey, currentKey)

  // Don't show if no transposition
  if (originalKey === currentKey) {
    return null
  }

  // Compact variant - just the number
  if (variant === 'compact') {
    if (capoInfo.position === 0) return null

    return (
      <div
        className={cn('capo-indicator-compact flex items-center gap-2', className)}
        aria-label={`Capo on fret ${capoInfo.position}`}
      >
        <Guitar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Capo {capoInfo.position}</span>
      </div>
    )
  }

  // Detailed variant with fretboard visualization
  if (variant === 'detailed') {
    return (
      <Card className={cn('capo-indicator-detailed', className)}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2">
              <Guitar className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Guitar Capo Guide</h3>
            </div>

            {/* Capo position */}
            {capoInfo.position > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Capo Position:</span>
                  <span className="text-lg font-bold">Fret {capoInfo.position}</span>
                </div>

                {/* Visual fretboard */}
                <div className="relative h-8 bg-gradient-to-r from-amber-100 to-amber-50 rounded overflow-hidden">
                  <div className="absolute inset-0 flex">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex-1 border-r border-gray-300',
                          i === capoInfo.position - 1 && 'bg-primary/30'
                        )}
                      >
                        {i === capoInfo.position - 1 && (
                          <div className="h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Fret numbers */}
                  <div className="absolute -bottom-1 inset-x-0 flex text-[10px] text-gray-500">
                    {[1, 3, 5, 7, 9, 12].map((fret) => (
                      <div
                        key={fret}
                        className="absolute"
                        style={{ left: `${(fret - 0.5) * 8.33}%` }}
                      >
                        {fret}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Play instructions */}
                <div className="p-2 bg-muted rounded-md">
                  <p className="text-sm">{capoInfo.suggestion}</p>
                </div>

                {/* Common chord shapes */}
                {showChordShapes && capoInfo.shapes && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Common shapes to use:</span>
                    <div className="flex gap-2 flex-wrap">
                      {capoInfo.shapes.map((shape) => (
                        <span
                          key={shape}
                          className="px-2 py-1 text-xs font-mono bg-background border rounded"
                        >
                          {shape}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-muted rounded-md">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p>{capoInfo.suggestion || `Play in ${currentKey} without capo`}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Alternative suggestions */}
            {capoInfo.position === 0 && originalKey !== currentKey && (
              <div className="text-xs text-muted-foreground">
                <p>💡 Tip: Try tuning down or using a different key for easier fingering.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default variant - simple card
  return (
    <Card className={cn('capo-indicator', className)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Guitar className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Capo</span>
          </div>

          {capoInfo.position > 0 ? (
            <div className="text-right">
              <div className="text-lg font-bold">Fret {capoInfo.position}</div>
              <div className="text-xs text-muted-foreground">
                Play {capoInfo.playInKey} shapes
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No capo needed</div>
          )}
        </div>

        {/* Optional chord shape hint */}
        {showChordShapes && capoInfo.shapes && capoInfo.position > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="flex gap-1 flex-wrap">
              {capoInfo.shapes.slice(0, 4).map((shape) => (
                <span
                  key={shape}
                  className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded"
                >
                  {shape}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}