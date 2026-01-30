/**
 * ChordProViewer Component
 *
 * Main viewer component using ChordSheetJS for rendering ChordPro content
 * Mobile-first design with responsive layout and real-time transposition
 */

import { useEffect, useRef, useState, useMemo, useCallback, ComponentType } from 'react'
import ChordSheetJS from 'chordsheetjs'
import { useChordSheet } from '../hooks/useChordSheet'
import { transposeRhythmBrackets } from '../utils/rhythmBrackets'
import ChordToggle from './ChordToggle'
import TransposeControl from './TransposeControl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Edit3 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import logger from '@/lib/logger'
import { ArrangementMetadata } from '@/types/Arrangement.types'
import type { TranspositionState } from '../types'
import { useChordProTutorial, ChordProHelpButton } from '@/features/onboarding'

// Import CSS styles
import '../styles/chordpro.css'
import '../styles/print.css'

// Re-export for convenience
export type { TranspositionState }

// Musical constants for transposition
const CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const CHROMATIC_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const

// Theoretical sharp keys that should prefer their flat enharmonic equivalents
// G# major = 8 sharps (theoretical) → prefer Ab major = 4 flats
// D# major = 9 sharps (theoretical) → prefer Eb major = 3 flats
// A# major = 10 sharps (theoretical) → prefer Bb major = 2 flats
const UNUSUAL_SHARP_KEYS = new Set(['G#', 'D#', 'A#'])

// Theoretical flat keys that should prefer their sharp enharmonic equivalents
// Cb major = 7 flats → prefer B major = 5 sharps
const UNUSUAL_FLAT_KEYS = new Set(['Cb'])

// Map flats to their sharp equivalents for index lookup
const FLAT_TO_SHARP_MAP: Record<string, string> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
}

/**
 * Normalize a key to its sharp equivalent for consistent semitone calculations
 * Also strips minor suffix to get the root note
 */
function normalizeKeyForSemitones(key: string): string {
  // Strip minor suffix (e.g., "Am" -> "A", "Bbm" -> "Bb")
  const root = key.replace('m', '')
  // Convert flats to sharps
  return FLAT_TO_SHARP_MAP[root] || root
}

/**
 * Calculate the semitone offset needed to transpose from one key to another
 * Returns a value from 0-11 representing the number of semitones up
 */
function calculateSemitoneOffset(fromKey: string, toKey: string): number {
  const fromNormalized = normalizeKeyForSemitones(fromKey)
  const toNormalized = normalizeKeyForSemitones(toKey)

  const fromIndex = CHROMATIC_SHARPS.indexOf(fromNormalized)
  const toIndex = CHROMATIC_SHARPS.indexOf(toNormalized)

  // If either key is invalid, return 0 (no transposition)
  if (fromIndex === -1 || toIndex === -1) {
    return 0
  }

  // Calculate offset (always positive, 0-11 range)
  return (toIndex - fromIndex + 12) % 12
}

/**
 * Get key at specified semitone offset
 */
function transposeKey(key: string, semitones: number, preferFlats: boolean = false): string {
  let keyIndex = CHROMATIC_SHARPS.indexOf(key)
  if (keyIndex === -1) {
    keyIndex = CHROMATIC_FLATS.indexOf(key)
    if (keyIndex === -1) {
      return key
    }
  }
  const newIndex = (keyIndex + semitones + 12) % 12
  return preferFlats ? CHROMATIC_FLATS[newIndex] : CHROMATIC_SHARPS[newIndex]
}

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
  onTranspositionChange?: (state: TranspositionState) => void;  // Callback when transposition changes
  performanceMode?: boolean;  // Minimal padding for performance mode on mobile
  originalArrangementKey?: string;  // The arrangement's original key (for auto-transposition in setlists)
  showActionButtons?: boolean;  // Whether to show Edit/Copy buttons (default true, hide in preview pane)
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
  arrangementMetadata = null,  // Optional metadata to inject before parsing
  onTranspositionChange,  // Callback when transposition changes
  performanceMode = false,  // Minimal padding for performance mode on mobile
  originalArrangementKey,  // The arrangement's original key (for auto-transposition in setlists)
  showActionButtons = true,  // Whether to show Edit/Copy buttons
}: ChordProViewerProps) {
  const [showChords, setShowChords] = useState(showChordsProp)
  const [editContent, setEditContent] = useState(content)
  const containerRef = useRef<HTMLDivElement>(null)

  // Use controlled editMode if provided, otherwise fall back to internal state
  const isControlled = editMode !== undefined
  const [internalEditMode, setInternalEditMode] = useState(initialEditMode)
  const isEditMode = isControlled ? editMode : internalEditMode

  // ChordPro tutorial state (only used when editable)
  const {
    isPopoverOpen: isTutorialOpen,
    setIsPopoverOpen: setIsTutorialOpen,
    triggerOnFirstEdit,
    closeTutorial,
  } = useChordProTutorial()

  // Lazy import editor components when needed
  const [EditorComponent, setEditorComponent] = useState<ComponentType<unknown> | null>(null)
  const [SplitViewComponent, setSplitViewComponent] = useState<ComponentType<unknown> | null>(null)

  // Serialize metadata to force re-parse when metadata changes
  // This ensures the viewer updates when dropdown values change
  const metadataKey = useMemo(() => {
    if (!arrangementMetadata) return null
    return JSON.stringify(arrangementMetadata)
  }, [arrangementMetadata])

  // Calculate initial transposition offset when originalArrangementKey is provided
  // This enables automatic transposition for setlist custom keys
  const initialTranspositionOffset = useMemo(() => {
    if (!originalArrangementKey || !arrangementMetadata?.key) return 0
    if (originalArrangementKey === arrangementMetadata.key) return 0
    return calculateSemitoneOffset(originalArrangementKey, arrangementMetadata.key)
  }, [originalArrangementKey, arrangementMetadata?.key])

  // Transposition state - managed here so we can preprocess rhythm brackets
  // Initialized with calculated offset for setlist auto-transposition
  const [transpositionOffset, setTranspositionOffset] = useState<number>(initialTranspositionOffset)

  // Extract key early (before preprocessing) to compute preferFlats synchronously
  // This avoids the "flash" of wrong enharmonic spelling on first render
  const earlyKey = useMemo(() => {
    // First check arrangementMetadata (prop takes precedence)
    if (arrangementMetadata?.key) {
      return arrangementMetadata.key
    }
    // Otherwise try to extract from raw content
    if (content) {
      const keyMatch = content.match(/\{key:\s*([A-Ga-g][#b]?m?)\}/i)
      if (keyMatch) {
        return keyMatch[1]
      }
    }
    return 'C' // Default
  }, [content, arrangementMetadata?.key])

  // Compute ideal preferFlats synchronously (no flash!)
  // This avoids unusual/theoretical keys like G#, D#, A# (prefer Ab, Eb, Bb)
  const computedPreferFlats = useMemo(() => {
    const keyWithSharps = transposeKey(earlyKey, transpositionOffset, false)
    const keyWithFlats = transposeKey(earlyKey, transpositionOffset, true)

    // If the sharp spelling is unusual (G#, D#, A#), prefer flats (Ab, Eb, Bb)
    if (UNUSUAL_SHARP_KEYS.has(keyWithSharps)) {
      return true
    }
    // If the flat spelling is unusual (Cb), prefer sharps (B)
    if (UNUSUAL_FLAT_KEYS.has(keyWithFlats)) {
      return false
    }
    // Otherwise, use the original key's preference (flat keys stay flat, sharp keys stay sharp)
    return earlyKey.includes('b')
  }, [earlyKey, transpositionOffset])

  // User override: null = use computed, boolean = user explicitly chose
  const [userPreferFlatsOverride, setUserPreferFlatsOverride] = useState<boolean | null>(null)

  // Reset override when key/offset changes (so auto-calculation takes over again)
  useEffect(() => {
    setUserPreferFlatsOverride(null)
  }, [earlyKey, transpositionOffset])

  // Sync transposition offset when originalArrangementKey or target key changes
  // This handles navigation between songs in setlist performance mode
  useEffect(() => {
    setTranspositionOffset(initialTranspositionOffset)
  }, [initialTranspositionOffset])

  // Final value: user wins if they toggled, otherwise use computed
  const preferFlats = userPreferFlatsOverride ?? computedPreferFlats

  // Preprocess content: transpose rhythm brackets BEFORE ChordSheetJS parsing
  const preprocessedContent = useMemo(() => {
    if (!content) return content
    return transposeRhythmBrackets(content, transpositionOffset, preferFlats)
  }, [content, transpositionOffset, preferFlats])

  // Parse and format ChordPro content with metadata injection
  const {
    parsedSong,
    metadata,
    hasChords,
    error
  } = useChordSheet(preprocessedContent, showChords, arrangementMetadata, metadataKey)

  // Determine original key (from metadata or default)
  const originalKey = useMemo(() => {
    return metadata.key || 'C' // Default to C if no key specified
  }, [metadata.key])

  // Calculate current key based on offset
  const currentKey = useMemo(() => {
    return transposeKey(originalKey, transpositionOffset, preferFlats)
  }, [originalKey, transpositionOffset, preferFlats])

  // Transpose the ChordSheetJS song object (for regular [chord] markers)
  const transposedSong = useMemo(() => {
    if (!parsedSong) return parsedSong

    try {
      let processedSong = parsedSong

      if (transpositionOffset !== 0) {
        processedSong = processedSong.transpose(transpositionOffset)
      }

      // Apply enharmonic preference (flats vs sharps)
      // Note: useModifier('#') may produce B# for C, or useModifier('b') may produce Fb for E
      const modifier = preferFlats ? 'b' : '#'
      processedSong = processedSong.useModifier(modifier)

      // Normalize enharmonic spellings AFTER applying modifier preference
      // This converts B# -> C, E# -> F, Cb -> B, Fb -> E (the problematic over-conversions)
      processedSong = processedSong.normalizeChords()

      return processedSong
    } catch (err) {
      logger.error('Chord processing failed:', err)
      return parsedSong
    }
  }, [parsedSong, transpositionOffset, preferFlats])

  // Transposition control functions
  const transposeBy = useCallback((semitones: number) => {
    const newOffset = transpositionOffset + semitones
    if (newOffset >= -11 && newOffset <= 11) {
      setTranspositionOffset(newOffset)
    }
  }, [transpositionOffset])

  const reset = useCallback(() => {
    setTranspositionOffset(0)
  }, [])

  const toggleEnharmonic = useCallback(() => {
    setUserPreferFlatsOverride(prev => !(prev ?? computedPreferFlats))
  }, [computedPreferFlats])

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

  // Notify parent of transposition state changes
  useEffect(() => {
    if (onTranspositionChange) {
      onTranspositionChange({
        currentKey,
        originalKey,
        semitones: transpositionOffset,
        transpositionOffset,
        isTransposed: transpositionOffset !== 0
      })
    }
  }, [currentKey, originalKey, transpositionOffset, onTranspositionChange])

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

    // Trigger tutorial on first edit (entering edit mode)
    if (newEditMode) {
      triggerOnFirstEdit()
    }

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

  // Handle copy to clipboard for non-editors
  const handleCopyChordPro = useCallback(async () => {
    if (!content) return
    try {
      await navigator.clipboard.writeText(content)
      toast.success('ChordPro copied to clipboard')
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }, [content])

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

  // Empty content state - show option to add chord chart if editable
  // But don't return early if we're in edit mode - we need to show the editor
  if (!content && !isEditMode) {
    return (
      <Card className={containerClasses}>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground mb-4">
            No chord chart available for this arrangement
          </p>
          {editable && (
            <Button
              variant="default"
              size="sm"
              onClick={handleEditModeToggle}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Add Chord Chart
            </Button>
          )}
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
                {showActionButtons && (
                  <div className="flex gap-2 items-center">
                    {editable ? (
                      <>
                        <ChordProHelpButton
                          isPopoverOpen={isTutorialOpen}
                          onPopoverOpenChange={setIsTutorialOpen}
                          onGotIt={() => closeTutorial(true)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEditModeToggle}
                          className="text-xs"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Edit Chords
                        </Button>
                      </>
                    ) : content ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyChordPro}
                        className="text-xs"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy ChordPro
                      </Button>
                    ) : null}
                  </div>
                )}
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
                performanceMode ? 'p-2 md:p-4' : 'p-4',
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
