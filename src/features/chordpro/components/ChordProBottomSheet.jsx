/**
 * ChordProBottomSheet Component
 *
 * Bottom sheet for extended ChordPro editing actions
 * Provides comprehensive chord library, directives, and templates
 * Mobile-optimized interface with tabs and search
 */

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  X,
  Search,
  Music2,
  Hash,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { insertChord, insertDirective } from '../utils/editorHelpers';
import logger from '@/lib/logger';

// Common chord groups
const CHORD_GROUPS = {
  major: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  minor: ['Am', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'Gm'],
  seventh: ['C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7'],
  majorSeventh: ['Cmaj7', 'Dmaj7', 'Emaj7', 'Fmaj7', 'Gmaj7', 'Amaj7', 'Bmaj7'],
  minorSeventh: ['Am7', 'Bm7', 'Cm7', 'Dm7', 'Em7', 'Fm7', 'Gm7'],
  suspended: ['Csus2', 'Csus4', 'Dsus2', 'Dsus4', 'Gsus2', 'Gsus4'],
  diminished: ['Cdim', 'C#dim', 'Ddim', 'D#dim', 'Edim', 'Fdim'],
  augmented: ['Caug', 'Daug', 'Eaug', 'Faug', 'Gaug', 'Aaug', 'Baug']
};

// Common directives
const DIRECTIVES = {
  metadata: [
    { name: 'title', label: 'Title', needsArgument: true, placeholder: 'Song Title' },
    { name: 'artist', label: 'Artist', needsArgument: true, placeholder: 'Artist Name' },
    { name: 'key', label: 'Key', needsArgument: true, placeholder: 'C' },
    { name: 'tempo', label: 'Tempo', needsArgument: true, placeholder: '120' },
    { name: 'time', label: 'Time Signature', needsArgument: true, placeholder: '4/4' },
    { name: 'capo', label: 'Capo', needsArgument: true, placeholder: '3' }
  ],
  structure: [
    { name: 'verse', label: 'Verse', needsArgument: false },
    { name: 'chorus', label: 'Chorus', needsArgument: false },
    { name: 'bridge', label: 'Bridge', needsArgument: false },
    { name: 'intro', label: 'Intro', needsArgument: false },
    { name: 'outro', label: 'Outro', needsArgument: false },
    { name: 'instrumental', label: 'Instrumental', needsArgument: false }
  ],
  formatting: [
    { name: 'comment', label: 'Comment', needsArgument: true, placeholder: 'Comment text' },
    { name: 'comment_italic', label: 'Italic Comment', needsArgument: true, placeholder: 'Italic text' },
    { name: 'comment_box', label: 'Box Comment', needsArgument: true, placeholder: 'Box text' },
    { name: 'new_page', label: 'New Page', needsArgument: false },
    { name: 'new_column', label: 'New Column', needsArgument: false },
    { name: 'column_break', label: 'Column Break', needsArgument: false }
  ]
};

// Quick templates
const TEMPLATES = [
  {
    name: 'Basic Song',
    content: `{title: Song Title}
{artist: Artist Name}
{key: C}

{verse}
[C]Lyrics go [G]here with [Am]chords
[F]More lyrics [C]on next [G]line

{chorus}
[C]This is the [F]chorus
[G]Repeat as [C]needed`
  },
  {
    name: 'Worship Song',
    content: `{title: }
{artist: }
{key: }
{tempo: }
{ccli: }

{intro}

{verse: 1}

{chorus}

{verse: 2}

{bridge}

{outro}`
  },
  {
    name: 'Chord Chart Only',
    content: `{title: }
{key: }

{intro}
| C | G | Am | F |

{verse}
| C | G | Am | F |
| C | G | F | C |

{chorus}
| F | C | G | Am |
| F | C | G | C |`
  }
];

/**
 * Bottom sheet component for extended ChordPro actions
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether sheet is open
 * @param {Function} props.onClose - Callback to close sheet
 * @param {Object} props.editorView - CodeMirror EditorView instance
 */
export default function ChordProBottomSheet({
  isOpen,
  onClose,
  editorView
}) {
  const [activeTab, setActiveTab] = useState('chords');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChordGroup, setSelectedChordGroup] = useState('major');

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Filter chords based on search
  const filteredChords = useMemo(() => {
    const chords = CHORD_GROUPS[selectedChordGroup] || [];
    if (!searchTerm) return chords;
    return chords.filter(chord =>
      chord.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [selectedChordGroup, searchTerm]);

  // Handle chord insertion
  const handleChordInsert = (chord) => {
    if (!editorView) {
      logger.warn('EditorView not available for chord insertion');
      return;
    }

    insertChord(editorView, chord);

    // Update recent chords
    const recent = JSON.parse(localStorage.getItem('chordpro-recent-chords') || '[]');
    const updated = [chord, ...recent.filter(c => c !== chord)].slice(0, 6);
    localStorage.setItem('chordpro-recent-chords', JSON.stringify(updated));
  };

  // Handle directive insertion
  const handleDirectiveInsert = (directive) => {
    if (!editorView) {
      logger.warn('EditorView not available for directive insertion');
      return;
    }

    if (directive.needsArgument) {
      const argument = prompt(`Enter ${directive.label}:`, '');
      if (argument !== null) {
        insertDirective(editorView, directive.name, argument);
      }
    } else {
      insertDirective(editorView, directive.name);
    }
  };

  // Handle template insertion
  const handleTemplateInsert = (template) => {
    if (!editorView) {
      logger.warn('EditorView not available for template insertion');
      return;
    }

    // Insert template at cursor position
    const { from } = editorView.state.selection.main;
    editorView.dispatch({
      changes: { from, to: from, insert: template.content },
      selection: { anchor: from }
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet content */}
      <div
        className={cn(
          'relative bg-background rounded-t-2xl w-full max-w-2xl',
          'h-[70vh] flex flex-col',
          'animate-in slide-in-from-bottom duration-300'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="ChordPro elements"
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Insert ChordPro Elements</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b px-4">
          <button
            className={cn(
              'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors',
              activeTab === 'chords'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('chords')}
          >
            <Music2 className="h-4 w-4" />
            Chords
          </button>
          <button
            className={cn(
              'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors',
              activeTab === 'directives'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('directives')}
          >
            <Hash className="h-4 w-4" />
            Directives
          </button>
          <button
            className={cn(
              'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors',
              activeTab === 'templates'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('templates')}
          >
            <FileText className="h-4 w-4" />
            Templates
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'chords' && (
            <div className="space-y-4">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search chords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Chord group selector */}
              <div className="flex flex-wrap gap-2">
                {Object.keys(CHORD_GROUPS).map(group => (
                  <Button
                    key={group}
                    variant={selectedChordGroup === group ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedChordGroup(group)}
                    className="capitalize"
                  >
                    {group}
                  </Button>
                ))}
              </div>

              {/* Chord grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {filteredChords.map(chord => (
                  <Button
                    key={chord}
                    variant="outline"
                    onClick={() => handleChordInsert(chord)}
                    className="h-12 font-mono"
                  >
                    {chord}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'directives' && (
            <div className="space-y-6">
              {Object.entries(DIRECTIVES).map(([category, directives]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 capitalize">
                    {category}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {directives.map(directive => (
                      <Button
                        key={directive.name}
                        variant="outline"
                        onClick={() => handleDirectiveInsert(directive)}
                        className="justify-start"
                      >
                        <Hash className="h-3 w-3 mr-2" />
                        {directive.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              {TEMPLATES.map((template, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => handleTemplateInsert(template)}
                >
                  <h4 className="font-medium">{template.name}</h4>
                  <pre className="text-xs text-muted-foreground overflow-hidden whitespace-pre-wrap">
                    {template.content.substring(0, 150)}...
                  </pre>
                  <Button variant="secondary" size="sm">
                    Use Template
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}