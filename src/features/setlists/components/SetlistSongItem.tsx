/**
 * SetlistSongItem Component
 *
 * Draggable song item using @dnd-kit/sortable.
 * Features: drag handle, song display, media indicators, play button, remove button.
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import KeySelector from '@/features/chordpro/components/KeySelector';
import { GripVertical, X, Music, Youtube, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SetlistSong, Arrangement, Song } from '@/types';

interface SetlistSongItemProps {
  song: SetlistSong;
  arrangement?: Arrangement;
  parentSong?: Song;
  index: number;
  onRemove: (songId: string) => void;
  onKeyChange: (songId: string, newKey: string) => void;
  /** Whether the key change is temporary (session-only, for viewers) */
  isTemporaryKey?: boolean;
  /** Whether arrangement has MP3 audio */
  hasAudio?: boolean;
  /** Whether arrangement has YouTube video */
  hasYoutube?: boolean;
  /** Whether this arrangement is currently playing */
  isPlaying?: boolean;
  /** Callback when play button is clicked */
  onPlay?: () => void;
}

export default function SetlistSongItem({
  song,
  arrangement,
  parentSong,
  index,
  onRemove,
  onKeyChange,
  isTemporaryKey = false,
  hasAudio = false,
  hasYoutube = false,
  isPlaying = false,
  onPlay,
}: SetlistSongItemProps) {
  const currentKey = song.customKey || arrangement?.key || 'C';
  const isTransposed = song.customKey && song.customKey !== arrangement?.key;

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  // Show placeholder for unavailable/deleted arrangements
  if (!arrangement) {
    return (
      <Card
        ref={setNodeRef}
        style={style}
        className="p-4 flex items-center gap-4 bg-muted/20"
      >
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
          type="button"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate text-muted-foreground italic">
            {index + 1}. [Unavailable] - Arrangement removed
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(song.id)}
          aria-label="Remove song"
          type="button"
        >
          <X className="h-4 w-4" />
        </Button>
      </Card>
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-4 flex items-center gap-4"
    >
      {/* Drag handle */}
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
        type="button"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>

      {/* Song info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">
          {index + 1}.{' '}
          {parentSong && arrangement ? (
            <Link
              to={`/song/${parentSong.slug}/${arrangement.slug}`}
              className="hover:underline hover:text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              {parentSong.title} - {arrangement.name}
            </Link>
          ) : (
            arrangement?.name || 'Unknown'
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-muted-foreground">Key:</span>
          <KeySelector
            value={currentKey}
            onChange={(key) => onKeyChange(song.id, key)}
            size="sm"
            includeMinorKeys={true}
            lockMode={true}
            originalKey={arrangement?.key}
          />
          {isTransposed && (
            <span className="text-xs text-muted-foreground">
              {isTemporaryKey ? '(session only)' : '(transposed)'}
            </span>
          )}
        </div>
      </div>

      {/* Media indicators and play button */}
      <div className="flex items-center gap-1">
        {/* MP3 indicator */}
        <Music
          className={cn(
            'h-4 w-4',
            hasAudio ? 'text-primary' : 'text-muted-foreground/30'
          )}
          aria-label={hasAudio ? 'Has MP3 audio' : 'No MP3 audio'}
        />
        {/* YouTube indicator */}
        <Youtube
          className={cn(
            'h-4 w-4',
            hasYoutube ? 'text-[#FF0000]' : 'text-muted-foreground/30'
          )}
          aria-label={hasYoutube ? 'Has YouTube video' : 'No YouTube video'}
        />
        {/* Play button - only show if arrangement has media */}
        {(hasAudio || hasYoutube) && onPlay && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-1"
            onClick={onPlay}
            aria-label={isPlaying ? 'Now playing' : 'Play'}
            type="button"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 text-primary" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(song.id)}
        aria-label="Remove song"
        type="button"
      >
        <X className="h-4 w-4" />
      </Button>
    </Card>
  );
}
