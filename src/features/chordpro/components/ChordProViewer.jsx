/**
 * ChordProViewer Component
 *
 * Main viewer component using ChordSheetJS for rendering ChordPro content
 * Mobile-first design with responsive layout and real-time transposition
 */

import { useEffect, useRef, useState, useMemo } from 'react'
import ChordSheetJS from 'chordsheetjs'
import { useChordSheet } from '../hooks/useChordSheet'
import { useTransposition } from '../hooks/useTransposition'
import ChordToggle from './ChordToggle'
import TransposeControl from './TransposeControl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit3, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import logger from '@/lib/logger'

// Import CSS styles
import '../styles/chordpro.css'

export default function ChordProViewer({
  content,
  showChords: showChordsProp = true,
  className,
  onLoad,
  showToggle = true,
  showTranspose = true,
  editable = false,
  onContentChange,
  onEditModeChange,
  initialEditMode = false
}) {
  const [showChords, setShowChords] = useState(showChordsProp)
  const [isEditMode, setIsEditMode] = useState(initialEditMode)
  const [editContent, setEditContent] = useState(content)
  const containerRef = useRef(null)

  // Lazy import editor components when needed
  const [EditorComponent, setEditorComponent] = useState(null)
  const [SplitViewComponent, setSplitViewComponent] = useState(null)

  // Parse and format ChordPro content
  const {
    parsedSong,
    metadata,
    hasChords,
    error,
    sections
  } = useChordSheet(content, showChords)

  // Determine original key (from metadata or default)
  const originalKey = useMemo(() => {
    return metadata.key || 'C' // Default to C if no key specified
  }, [metadata.key])

  // Transposition logic
  const {
    transposedSong,
    currentKey,
    transpositionOffset,
    transposeBy,
    reset,
    isTransposed,
    preferFlats,
    toggleEnharmonic
  } = useTransposition(parsedSong, originalKey)

  // Generate HTML from the transposed/processed song
  const htmlOutput = useMemo(() => {
    // Use the transposed song from useTransposition hook (which handles both transposition and enharmonic preference)
    const songToFormat = transposedSong || parsedSong

    if (!songToFormat) return ''

    try {
      // Format the song to HTML
      const formatter = new ChordSheetJS.HtmlDivFormatter()
      let html = formatter.format(songToFormat)

      // Add CSS class for chord visibility control
      if (!showChords) {
        html = `<div class="hide-chords">${html}</div>`
      }

      return html
    } catch (error) {
      logger.error('Failed to generate HTML:', error)
      return '<div class="error">Error rendering chord chart</div>'
    }
  }, [transposedSong, parsedSong, showChords])

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

  // Sync content changes
  useEffect(() => {
    setEditContent(content)
  }, [content])

  // Lazy load editor components when edit mode is enabled
  useEffect(() => {
    if (isEditMode && editable && !EditorComponent) {
      Promise.all([
        import('./ChordProEditor').then(module => module.ChordProEditor),
        import('./ChordProSplitView').then(module => module.ChordProSplitView)
      ]).then(([Editor, SplitView]) => {
        setEditorComponent(() => Editor)
        setSplitViewComponent(() => SplitView)
      }).catch(error => {
        logger.error('Failed to load editor components:', error)
      })
    }
  }, [isEditMode, editable, EditorComponent])

  // Handle edit mode toggle
  const handleEditModeToggle = () => {
    const newEditMode = !isEditMode
    setIsEditMode(newEditMode)
    onEditModeChange?.(newEditMode)
  }

  // Handle content changes from editor
  const handleContentChange = (newContent) => {
    setEditContent(newContent)
    onContentChange?.(newContent)
  }


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
      <CardContent className="px-1 py-2 sm:p-2 lg:p-4">
        {/* Header controls */}
        <div className="flex flex-col gap-3">
          {/* Metadata and basic controls */}
          <div className="flex justify-between items-start flex-wrap gap-2">
            {/* Metadata display */}
            <div className="text-xs text-muted-foreground">
              {metadata.title && (
                <span className="font-medium">{metadata.title}</span>
              )}
              {metadata.artist && (
                <span className="ml-2">by {metadata.artist}</span>
              )}
              {currentKey && (
                <span className="ml-2">Key: <strong>{currentKey}</strong></span>
              )}
              {isTransposed && originalKey && (
                <span className="ml-1 text-xs">(Original: {originalKey})</span>
              )}
              {metadata.tempo && (
                <span className="ml-2">Tempo: {metadata.tempo}</span>
              )}
            </div>

            {/* Control buttons */}
            <div className="flex gap-2 items-center">
              {editable && (
                <Button
                  variant={isEditMode ? "default" : "outline"}
                  size="sm"
                  onClick={handleEditModeToggle}
                  className="text-xs"
                >
                  {isEditMode ? (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit
                    </>
                  )}
                </Button>
              )}
              {showToggle && hasChords && !isEditMode && (
                <ChordToggle
                  showChords={showChords}
                  onToggle={handleToggleChords}
                  size="sm"
                />
              )}
            </div>
          </div>

          {/* Transpose controls */}
          {showTranspose && hasChords && !isEditMode && (
            <TransposeControl
              currentKey={currentKey}
              transpositionOffset={transpositionOffset}
              onTranspose={transposeBy}
              onReset={reset}
              onToggleEnharmonic={toggleEnharmonic}
              preferFlats={preferFlats}
            />
          )}
        </div>

        {/* Edit Mode Content */}
        {isEditMode && editable && SplitViewComponent && (
          <div className="mt-4 border rounded-lg overflow-hidden h-[calc(100vh-16rem)] min-h-[400px] lg:h-[calc(100vh-12rem)]">
            <SplitViewComponent
              initialContent={editContent}
              onContentChange={handleContentChange}
              viewerOptions={{
                showChords,
                showToggle: false,
                showTranspose: false
              }}
            />
          </div>
        )}

        {/* View Mode Content */}
        {!isEditMode && (
          <>
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
          </>
        )}

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
