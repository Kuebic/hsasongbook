/**
 * MobileFAB Component
 *
 * Floating Action Button for mobile ChordPro editing
 * Provides quick access to common chords and actions
 * Replaces broken mobile toolbar with touch-optimized interface
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Music,
  Hash,
  ChevronUp,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { insertChord, insertDirective } from '../utils/editorHelpers';
import logger from '@/lib/logger';

/**
 * Mobile FAB with radial menu for quick chord insertion
 * @param {Object} props
 * @param {Object} props.editorView - CodeMirror EditorView instance
 * @param {Function} props.onOpenBottomSheet - Callback to open bottom sheet
 * @param {string} props.position - FAB position: 'bottom-right' | 'bottom-left' | 'bottom-center'
 * @param {boolean} props.enabled - Whether FAB is enabled
 */
export default function MobileFAB({
  editorView,
  onOpenBottomSheet,
  position = 'bottom-right',
  enabled = true
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentChords, setRecentChords] = useState(() => {
    // Load recent chords from localStorage
    const stored = localStorage.getItem('chordpro-recent-chords');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        logger.error('Failed to parse recent chords', e);
      }
    }
    return ['C', 'G', 'Am', 'F', 'D', 'Em'];
  });

  // Update recent chords in localStorage
  useEffect(() => {
    localStorage.setItem('chordpro-recent-chords', JSON.stringify(recentChords));
  }, [recentChords]);

  // Close FAB when clicking outside
  useEffect(() => {
    if (!isExpanded) return;

    const handleClick = (e) => {
      // Check if click is outside FAB
      if (!e.target.closest('.mobile-fab-container')) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isExpanded]);

  // Handle chord insertion
  const handleChordInsert = useCallback((chord) => {
    if (!editorView) {
      logger.warn('EditorView not available for chord insertion');
      return;
    }

    insertChord(editorView, chord);
    setIsExpanded(false);

    // Update recent chords (move to front)
    setRecentChords(prev => {
      const filtered = prev.filter(c => c !== chord);
      return [chord, ...filtered].slice(0, 6);
    });
  }, [editorView]);

  // Handle quick directive insertion
  const handleDirectiveInsert = useCallback((directive) => {
    if (!editorView) {
      logger.warn('EditorView not available for directive insertion');
      return;
    }

    insertDirective(editorView, directive);
    setIsExpanded(false);
  }, [editorView]);

  // Calculate radial positions for menu items
  const getRadialPosition = (index, total) => {
    const angle = (index * (180 / (total - 1))) + 180; // Semi-circle from 180 to 360 degrees
    const radius = 70; // Distance from center
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;
    return { x, y };
  };

  // Position classes based on prop
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  };

  if (!enabled) return null;

  // Render FAB using Portal to ensure it's on top
  return createPortal(
    <div
      className={cn(
        'mobile-fab-container fixed z-50',
        positionClasses[position]
      )}
    >
      {/* Main FAB button */}
      <Button
        className={cn(
          'fab-main h-14 w-14 rounded-full shadow-lg transition-all duration-200',
          'bg-primary hover:bg-primary/90',
          isExpanded && 'rotate-45'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label="Quick actions"
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </Button>

      {/* Radial menu - Quick chords */}
      {isExpanded && (
        <div className="absolute bottom-0 right-0">
          {recentChords.map((chord, index) => {
            const pos = getRadialPosition(index, recentChords.length);
            return (
              <Button
                key={chord}
                className={cn(
                  'fab-action absolute h-12 w-12 rounded-full',
                  'bg-background border-2 shadow-md',
                  'transition-all duration-200',
                  'hover:scale-110 hover:bg-accent'
                )}
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                  transitionDelay: `${index * 30}ms`
                }}
                onClick={() => handleChordInsert(chord)}
                aria-label={`Insert chord ${chord}`}
              >
                <span className="text-sm font-semibold">{chord}</span>
              </Button>
            );
          })}

          {/* Quick action buttons */}
          <Button
            className={cn(
              'fab-action absolute h-12 w-12 rounded-full',
              'bg-background border-2 shadow-md',
              'transition-all duration-200',
              'hover:scale-110 hover:bg-accent'
            )}
            style={{
              transform: 'translate(-85px, -35px)',
              transitionDelay: '180ms'
            }}
            onClick={() => handleDirectiveInsert('verse')}
            aria-label="Insert verse"
            title="Insert verse"
          >
            <Hash className="h-4 w-4" />
          </Button>

          <Button
            className={cn(
              'fab-action absolute h-12 w-12 rounded-full',
              'bg-background border-2 shadow-md',
              'transition-all duration-200',
              'hover:scale-110 hover:bg-accent'
            )}
            style={{
              transform: 'translate(-85px, 35px)',
              transitionDelay: '210ms'
            }}
            onClick={() => handleDirectiveInsert('chorus')}
            aria-label="Insert chorus"
            title="Insert chorus"
          >
            <Music className="h-4 w-4" />
          </Button>

          <Button
            className={cn(
              'fab-action absolute h-12 w-12 rounded-full',
              'bg-background border-2 shadow-md',
              'transition-all duration-200',
              'hover:scale-110 hover:bg-accent'
            )}
            style={{
              transform: 'translate(0px, -85px)',
              transitionDelay: '240ms'
            }}
            onClick={onOpenBottomSheet}
            aria-label="More options"
            title="More options"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Backdrop for expanded state */}
      {isExpanded && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}

      <style>{`
        .fab-action {
          animation: fadeIn 0.2s ease-out forwards;
          opacity: 0;
        }

        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }

        .fab-main {
          touch-action: manipulation;
        }

        @media (hover: hover) {
          .fab-main:hover {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>,
    document.body
  );
}