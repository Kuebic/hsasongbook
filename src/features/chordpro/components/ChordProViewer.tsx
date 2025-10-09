/**
 * ChordProViewer Component
 *
 * Main viewer component using ChordSheetJS for rendering ChordPro content
 * Mobile-first design with responsive layout and real-time transposition
 */

import { useEffect, useRef, useState, useMemo, ComponentType } from 'react'
import ChordSheetJS from 'chordsheetjs'
import { useChordSheet } from '../hooks/useChordSheet'
import { useTransposition } from '../hooks/useTransposition'
import ChordToggle from './ChordToggle'
import TransposeControl from './TransposeControl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import logger from '@/lib/logger'
import { ArrangementMetadata } from '@/types/Arrangement.types'

// Import CSS styles
import '../styles/chordpro.css'
import '../styles/print.css'

interface ChordProViewerProps {
  content?: string;
  showChords?: boolean;
  className?: string;
  onLoad?: (metadata: Record<string, unknown>) => void;
  showToggle?: boolean;
  showTranspose?: boolean;
  editable?: boolean;
  onContentChange?: (content: string) => void;
  onEditModeChange?: (editMode: boolean) => void;
  editMode?: boolean;  // Controlled edit mode from parent
  initialEditMode?: boolean;  // DEPRECATED: Use editMode instead
  arrangementMetadata?: ArrangementMetadata | null;  // Optional metadata to inject before parsing
}

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
  editMode,  // Controlled edit mode from parent
  initialEditMode = false,  // DEPRECATED: Use editMode instead
  arrangementMetadata = null  // Optional metadata to inject before parsing
}: ChordProViewerProps) {
  const [showChords, setShowChords] = useState(showChordsProp)
  const [editContent, setEditContent] = useState(content)
  const containerRef = useRef<HTMLDivElement>(null)

  // Use controlled editMode if provided, otherwise fall back to internal state
  const isControlled = editMode !== undefined
  const [internalEditMode, setInternalEditMode] = useState(initialEditMode)
  const isEditMode = isControlled ? editMode : internalEditMode

  // Lazy import editor components when needed
  const [EditorComponent, setEditorComponent] = useState<ComponentType<unknown> | null>(null)
  const [SplitViewComponent, setSplitViewComponent] = useState<ComponentType<unknown> | null>(null)

  // Serialize metadata to force re-parse when metadata changes
  // This ensures the viewer updates when dropdown values change
  const metadataKey = useMemo(() => {
    if (!arrangementMetadata) return null
    return JSON.stringify(arrangementMetadata)
  }, [arrangementMetadata])

  // Parse and format ChordPro content with metadata injection
  const {
    parsedSong,
    metadata,
    hasChords,
    error
  } = useChordSheet(content, showChords, arrangementMetadata, metadataKey)

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
        setEditorComponent(() => Editor as ComponentType<unknown>)
        setSplitViewComponent(() => SplitView as ComponentType<unknown>)
      }).catch(error => {
        logger.error('Failed to load editor components:', error)
      })
    }
  }, [isEditMode, editable, EditorComponent])

  // Handle edit mode toggle
  const handleEditModeToggle = (): void => {
    const newEditMode = !isEditMode

    if (isControlled) {
      // Controlled mode: notify parent
      onEditModeChange?.(newEditMode)
    } else {
      // Uncontrolled mode: manage internally
      setInternalEditMode(newEditMode)
      onEditModeChange?.(newEditMode)
    }
  }

  // Handle content changes from editor
  const handleContentChange = (newContent: string): void => {
    setEditContent(newContent)
    onContentChange?.(newContent)
  }


  // Handle chord toggle
  const handleToggleChords = (): void => {
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
      <CardContent className="p-0">
        {/* Edit Mode Content */}
        {isEditMode && editable && SplitViewComponent ? (
          <div className="border rounded-lg overflow-hidden h-[calc(100vh-16rem)] min-h-[400px] lg:h-[calc(100vh-12rem)]">
            <SplitViewComponent
              initialContent={editContent}
              onContentChange={handleContentChange}
              onViewModeExit={handleEditModeToggle}
              viewerOptions={{
                showChords,
                showToggle: false,
                showTranspose: false
              }}
            />
          </div>
        ) : (
          <>
            {/* View Mode Header controls */}
            <div className="flex flex-col gap-3 px-1 py-2 sm:p-2 lg:p-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex gap-2 items-center">
                  {showToggle && hasChords && (
                    <ChordToggle
                      showChords={showChords}
                      onToggle={handleToggleChords}
                      size="sm"
                    />
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  {editable && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditModeToggle}
                      className="text-xs"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              {/* Transpose controls */}
              {showTranspose && hasChords && (
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
          </>
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

      </CardContent>
    </Card>
  )

  return viewerContent
}
