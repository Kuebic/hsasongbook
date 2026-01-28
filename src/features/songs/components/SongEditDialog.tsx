/**
 * SongEditDialog Component
 *
 * A modal dialog wrapper for editing song metadata.
 * Uses the existing SongEditForm component.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SongEditForm from './SongEditForm';
import type { BibleVerse, Quote } from '@/types/SpiritualContext.types';

interface SongEditDialogProps {
  songId: string;
  initialData: {
    title: string;
    artist?: string;
    themes?: string[];
    copyright?: string;
    lyrics?: string;
    origin?: string;
    notes?: string;
    bibleVerses?: BibleVerse[];
    quotes?: Quote[];
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SongEditDialog({
  songId,
  initialData,
  open,
  onOpenChange,
}: SongEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Song</DialogTitle>
        </DialogHeader>
        <SongEditForm
          songId={songId}
          initialData={initialData}
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
