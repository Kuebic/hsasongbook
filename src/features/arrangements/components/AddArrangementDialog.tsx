/**
 * AddArrangementDialog Component
 * Phase 5.3: Add Song/Arrangement Forms
 *
 * Dialog wrapper for the AddArrangementForm component.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AddArrangementForm from './AddArrangementForm';

interface AddArrangementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songId: string;
  songSlug: string;
  songTitle: string;
  songLyrics?: string;
}

/**
 * AddArrangementDialog - Modal dialog for creating a new arrangement
 *
 * Usage:
 * ```tsx
 * const [open, setOpen] = useState(false);
 * <AddArrangementDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   songId={song.id}
 *   songSlug={song.slug}
 *   songTitle={song.title}
 * />
 * ```
 */
export default function AddArrangementDialog({
  open,
  onOpenChange,
  songId,
  songSlug,
  songTitle,
  songLyrics,
}: AddArrangementDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Arrangement</DialogTitle>
          <DialogDescription>
            Create a new arrangement for "{songTitle}". You'll be able to add chords and lyrics
            after creating the arrangement.
          </DialogDescription>
        </DialogHeader>
        <AddArrangementForm
          songId={songId}
          songSlug={songSlug}
          songLyrics={songLyrics}
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
