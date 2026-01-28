/**
 * SetlistSongItem Component
 *
 * Draggable song item using @dnd-kit/sortable.
 * Features: drag handle, song display, remove button.
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { GripVertical, X } from 'lucide-react';
import type { SetlistSong, Arrangement, Song } from '@/types';

interface SetlistSongItemProps {
  song: SetlistSong;
  arrangement?: Arrangement;
  parentSong?: Song;
  index: number;
  onRemove: (songId: string) => void;
  onKeyChange: (songId: string, newKey: string) => void;
}

export default function SetlistSongItem({
  song,
  arrangement,
  parentSong,
  index,
  onRemove,
  onKeyChange
}: SetlistSongItemProps) {
  // Musical keys for dropdown
  const MUSICAL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const currentKey = song.customKey || arrangement?.key || 'C';

  // Display name: "Song Title - Arrangement Name"
  const displayName = parentSong && arrangement
    ? `${parentSong.title} - ${arrangement.name}`
    : arrangement?.name || 'Unknown';
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
          {index + 1}. {displayName}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-muted-foreground">Key:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="px-2 py-0.5 text-sm font-medium border rounded hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                type="button"
              >
                {currentKey}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {MUSICAL_KEYS.map(key => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onKeyChange(song.id, key)}
                  className="cursor-pointer"
                >
                  {key}
                  {key === arrangement?.key && (
                    <span className="ml-2 text-xs text-muted-foreground">(Original)</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
