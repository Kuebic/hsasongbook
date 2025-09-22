import { useMemo } from 'react'
import { parseChordPro, formatChordProLine } from '../utils/chordProParser'
import { Card, CardContent } from '@/components/ui/card'

export default function ChordProViewer({ content, showChords = true }) {
  const parsed = useMemo(() => {
    return parseChordPro(content)
  }, [content])

  if (!content) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            No chord chart available for this arrangement
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="py-6">
        <div className="font-mono text-sm sm:text-base space-y-4">
          {parsed.lines.map((line, index) => {
            const formatted = formatChordProLine(line)

            // Comment styling
            if (formatted.isComment) {
              return (
                <div key={index} className="text-muted-foreground italic text-sm">
                  {formatted.lyrics}
                </div>
              )
            }

            // Empty line
            if (!formatted.chord && !formatted.lyrics) {
              return <div key={index} className="h-4" />
            }

            // Line with chords
            if (showChords && formatted.chord) {
              return (
                <div key={index} className="space-y-0">
                  <div className="text-primary font-bold whitespace-pre text-sm sm:text-base">
                    {formatted.chord}
                  </div>
                  <div className="whitespace-pre-wrap">
                    {formatted.lyrics}
                  </div>
                </div>
              )
            }

            // Line without chords or chords hidden
            return (
              <div key={index} className="whitespace-pre-wrap">
                {formatted.lyrics}
              </div>
            )
          })}
        </div>

        {/* Mobile-friendly chord toggle hint */}
        <div className="mt-8 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Tip: Zoom in/out for better readability on mobile
          </p>
        </div>
      </CardContent>
    </Card>
  )
}