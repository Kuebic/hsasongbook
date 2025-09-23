/**
 * EditorToolbar Component
 *
 * Mobile-optimized toolbar with quick-insert buttons for chords and directives
 * Follows existing mobile optimization patterns from TransposeControl
 */

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import {
  Music,
  Hash,
  Type,
  Square,
  MoreHorizontal,
  ChevronDown,
  AlignLeft,
  Wrench
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { chordproConfig } from '@/lib/config'
import editorHelpers from '../utils/editorHelpers'
import logger from '@/lib/logger'

export default function EditorToolbar({
  editorView,
  disabled = false,
  className,
  compact = false
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const config = chordproConfig.editor.toolbar

  // Quick action handlers
  const handleChordInsert = useCallback((chord) => {
    if (!editorView || disabled) return

    const success = editorHelpers.insertChord(editorView, chord)
    if (success) {
      editorHelpers.focusEditor(editorView)
      logger.debug(`Chord inserted: ${chord}`)
    }
  }, [editorView, disabled])

  const handleDirectiveInsert = useCallback((directive, argument = '') => {
    if (!editorView || disabled) return

    const success = editorHelpers.insertDirective(editorView, directive, argument)
    if (success) {
      editorHelpers.focusEditor(editorView)
      logger.debug(`Directive inserted: ${directive}`)
    }
  }, [editorView, disabled])

  const handleEnvironmentInsert = useCallback((environment, label = '') => {
    if (!editorView || disabled) return

    const success = editorHelpers.insertEnvironment(editorView, environment, label, true)
    if (success) {
      editorHelpers.focusEditor(editorView)
      logger.debug(`Environment inserted: ${environment}`)
    }
  }, [editorView, disabled])

  const handleAlignLeft = useCallback(() => {
    if (!editorView || disabled) return

    const success = editorHelpers.formatSelection(editorView)
    if (success) {
      editorHelpers.focusEditor(editorView)
      logger.debug('Selection formatted')
    }
  }, [editorView, disabled])

  // Common chords from configuration
  const commonChords = config.commonChords || ['C', 'G', 'Am', 'F', 'D', 'Em', 'Dm']
  const directiveShortcuts = config.directiveShortcuts || ['title', 'artist', 'key', 'tempo']

  // Extended chord list for dropdown
  const extendedChords = [
    // Major chords
    'C', 'D', 'E', 'F', 'G', 'A', 'B',
    // Minor chords
    'Am', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'Gm',
    // Seventh chords
    'C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7',
    // Major 7th
    'Cmaj7', 'Dmaj7', 'Emaj7', 'Fmaj7', 'Gmaj7', 'Amaj7', 'Bmaj7',
    // Minor 7th
    'Am7', 'Bm7', 'Cm7', 'Dm7', 'Em7', 'Fm7', 'Gm7',
    // Suspended
    'Csus2', 'Csus4', 'Dsus2', 'Dsus4', 'Esus4', 'Fsus2', 'Gsus4', 'Asus2', 'Asus4'
  ]

  // Directive shortcuts for dropdown
  const allDirectives = [
    { name: 'title', label: 'Title', hasArg: true },
    { name: 'artist', label: 'Artist', hasArg: true },
    { name: 'key', label: 'Key', hasArg: true },
    { name: 'tempo', label: 'Tempo', hasArg: true },
    { name: 'time', label: 'Time Signature', hasArg: true },
    { name: 'capo', label: 'Capo', hasArg: true },
    { name: 'comment', label: 'Comment', hasArg: true },
    { name: 'highlight', label: 'Highlight', hasArg: false },
    { name: 'new_page', label: 'New Page', hasArg: false },
    { name: 'column_break', label: 'Column Break', hasArg: false }
  ]

  // Environment shortcuts
  const environments = [
    { name: 'verse', label: 'Verse' },
    { name: 'chorus', label: 'Chorus' },
    { name: 'bridge', label: 'Bridge' },
    { name: 'tab', label: 'Tab' }
  ]

  // Mobile-first toolbar layout
  if (compact || isCollapsed) {
    return (
      <div className={cn('editor-toolbar flex items-center gap-1 flex-wrap', className)}>
        {/* Essential mobile buttons */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleChordInsert('C')}
          disabled={disabled}
          className="h-10 w-10 sm:h-10 sm:w-auto sm:px-3"
          aria-label="Insert C chord"
        >
          <Music className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">C</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => handleDirectiveInsert('title', '')}
          disabled={disabled}
          className="h-10 w-10 sm:h-10 sm:w-auto sm:px-3"
          aria-label="Insert title directive"
        >
          <Type className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Title</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => handleEnvironmentInsert('verse')}
          disabled={disabled}
          className="h-10 w-10 sm:h-10 sm:w-auto sm:px-3"
          aria-label="Insert verse environment"
        >
          <Square className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Verse</span>
        </Button>

        {/* More options dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              className="h-10 w-10 sm:h-10 sm:w-auto sm:px-3"
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Quick Insert</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Common chords */}
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Chords
            </DropdownMenuLabel>
            {extendedChords.slice(0, 12).map((chord) => (
              <DropdownMenuItem
                key={chord}
                onClick={() => handleChordInsert(chord)}
                className="text-sm"
              >
                <Music className="h-3 w-3 mr-2" />
                {chord}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            {/* Directives */}
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Directives
            </DropdownMenuLabel>
            {allDirectives.slice(0, 6).map((directive) => (
              <DropdownMenuItem
                key={directive.name}
                onClick={() => handleDirectiveInsert(directive.name)}
                className="text-sm"
              >
                <Hash className="h-3 w-3 mr-2" />
                {directive.label}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            {/* AlignLeft */}
            <DropdownMenuItem onClick={handleAlignLeft} className="text-sm">
              <AlignLeft className="h-3 w-3 mr-2" />
              AlignLeft Selection
            </DropdownMenuItem>

            {/* Expand toolbar */}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsCollapsed(false)}
              className="text-sm"
            >
              <Wrench className="h-3 w-3 mr-2" />
              Show Full Toolbar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  // Full toolbar for desktop and when expanded
  return (
    <div className={cn('editor-toolbar flex items-center gap-2 flex-wrap p-2 bg-muted/30 rounded-md', className)}>
      {/* Chord section */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground hidden sm:inline mr-1">Chords:</span>

        {/* Common chord buttons - always visible */}
        {commonChords.slice(0, 6).map((chord) => (
          <Button
            key={chord}
            size="sm"
            variant="outline"
            onClick={() => handleChordInsert(chord)}
            disabled={disabled}
            className="h-10 min-w-[2.5rem] px-2 text-sm font-mono"
            aria-label={`Insert ${chord} chord`}
          >
            {chord}
          </Button>
        ))}

        {/* More chords dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              className="h-10 w-10"
              aria-label="More chords"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuLabel>All Chords</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {extendedChords.map((chord) => (
              <DropdownMenuItem
                key={chord}
                onClick={() => handleChordInsert(chord)}
                className="text-sm font-mono"
              >
                {chord}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-border hidden sm:block" />

      {/* Directive section */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground hidden sm:inline mr-1">Add:</span>

        {/* Common directive buttons */}
        {directiveShortcuts.slice(0, 4).map((directive) => (
          <Button
            key={directive}
            size="sm"
            variant="outline"
            onClick={() => handleDirectiveInsert(directive)}
            disabled={disabled}
            className="h-10 px-3 text-sm capitalize"
            aria-label={`Insert ${directive} directive`}
          >
            <Hash className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">{directive}</span>
          </Button>
        ))}

        {/* Environment buttons */}
        {environments.slice(0, 3).map((env) => (
          <Button
            key={env.name}
            size="sm"
            variant="outline"
            onClick={() => handleEnvironmentInsert(env.name)}
            disabled={disabled}
            className="h-10 px-3 text-sm"
            aria-label={`Insert ${env.label} environment`}
          >
            <Square className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">{env.label}</span>
          </Button>
        ))}

        {/* More directives dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              className="h-10 w-10"
              aria-label="More directives"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Directives</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allDirectives.map((directive) => (
              <DropdownMenuItem
                key={directive.name}
                onClick={() => handleDirectiveInsert(directive.name)}
                className="text-sm"
              >
                <Hash className="h-3 w-3 mr-2" />
                {directive.label}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Environments</DropdownMenuLabel>
            {environments.map((env) => (
              <DropdownMenuItem
                key={env.name}
                onClick={() => handleEnvironmentInsert(env.name)}
                className="text-sm"
              >
                <Square className="h-3 w-3 mr-2" />
                {env.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-border hidden sm:block" />

      {/* Tools section */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={handleAlignLeft}
          disabled={disabled}
          className="h-10 px-3 text-sm"
          aria-label="AlignLeft selection"
        >
          <AlignLeft className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">AlignLeft</span>
        </Button>

        {/* Collapse button for mobile */}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsCollapsed(true)}
          disabled={disabled}
          className="h-10 w-10 sm:hidden"
          aria-label="Collapse toolbar"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}