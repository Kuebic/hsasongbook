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
import { GripVertical, X } from 'lucide-react';
import type { SetlistSong, Arrangement } from '@/types';

interface SetlistSongItemProps {
  song: SetlistSong;
  arrangement?: Arrangement;
  index: number;
  onRemove: (songId: string) => void;
}

export default function SetlistSongItem({
  song,
  arrangement,
  index,
  onRemove
}: SetlistSongItemProps) {
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
      <div className="flex-1">
        <div className="font-medium">
          {index + 1}. {arrangement?.name || 'Unknown'}
        </div>
        <div className="text-sm text-muted-foreground">
          {song.customKey ? `Key: ${song.customKey}` : arrangement?.key ? `Key: ${arrangement.key}` : ''}
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
