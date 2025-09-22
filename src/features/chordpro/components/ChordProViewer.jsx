/**
 * ChordProViewer Component
 *
 * Main viewer component using ChordSheetJS for rendering ChordPro content
 * Mobile-first design with responsive layout
 */

import { useEffect, useRef, useState } from 'react'
import { useChordSheet } from '../hooks/useChordSheet'
import ChordToggle from './ChordToggle'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Import CSS styles
import '../styles/chordpro.css'

export default function ChordProViewer({
  content,
  showChords: showChordsProp = true,
  className,
  onLoad,
  showToggle = true
}) {
  const [showChords, setShowChords] = useState(showChordsProp)
  const containerRef = useRef(null)

  // Parse and format ChordPro content
  const {
    htmlOutput,
    metadata,
    hasChords,
    error,
    sections
  } = useChordSheet(content, showChords)

  // Notify parent of metadata when loaded
  useEffect(() => {
    if (onLoad && metadata) {
      onLoad(metadata)
    }
  }, [metadata, onLoad])

  // Sync with parent prop changes
  useEffect(() => {
    setShowChords(showChordsProp)
  }, [showChordsProp])


  // Handle chord toggle
  const handleToggleChords = () => {
    setShowChords(!showChords)
  }

  // Container classes for responsive design
  const containerClasses = cn(
    'chord-pro-viewer',
    'relative',
    'w-full',
    'overflow-x-auto',
    'text-sm sm:text-base',
    className
  )

  // Empty content state
  if (!content) {
    return (
      <Card className={containerClasses}>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            No chord chart available for this arrangement
          </p>
        </CardContent>
      </Card>
    )
  }

  // Build the viewer UI
  const viewerContent = (
    <Card className={containerClasses}>
      <CardContent className="p-4 sm:p-6">
        {/* Header controls */}
        <div className="flex justify-between items-center mb-4">
          {/* Metadata display */}
          <div className="text-xs text-muted-foreground">
            {metadata.title && (
              <span className="font-medium">{metadata.title}</span>
            )}
            {metadata.artist && (
              <span className="ml-2">by {metadata.artist}</span>
            )}
            {metadata.key && (
              <span className="ml-2">Key: {metadata.key}</span>
            )}
            {metadata.tempo && (
              <span className="ml-2">Tempo: {metadata.tempo}</span>
            )}
            {metadata.capo && metadata.capo > 0 && (
              <span className="ml-2">Capo: {metadata.capo}</span>
            )}
          </div>

          {/* Control buttons */}
          <div className="flex gap-2">
            {showToggle && hasChords && (
              <ChordToggle
                showChords={showChords}
                onToggle={handleToggleChords}
              />
            )}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
            <p className="text-sm">Error parsing chord chart: {error}</p>
            <p className="text-xs mt-1">Displaying raw content below.</p>
          </div>
        )}

        {/* Rendered ChordPro content */}
        <div
          ref={containerRef}
          className={cn(
            'chord-sheet-output',
            'font-mono',
            'space-y-2',
            !showChords && 'hide-chords'
          )}
          dangerouslySetInnerHTML={{ __html: htmlOutput }}
        />

        {/* Section navigation (if sections exist) */}
        {sections && sections.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Sections:</p>
            <div className="flex flex-wrap gap-2">
              {sections.map((section, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 bg-muted rounded-full capitalize"
                >
                  {section.type}
                </span>
              ))}
            </div>
          </div>
        )}

      </CardContent>

    </Card>
  )

  return viewerContent
}