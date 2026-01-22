/**
 * AddSongDialog Component
 * Phase 5.3: Add Song/Arrangement Forms
 *
 * Dialog wrapper for the AddSongForm component.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AddSongForm from './AddSongForm';

interface AddSongDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * AddSongDialog - Modal dialog for creating a new song
 *
 * Usage:
 * ```tsx
 * const [open, setOpen] = useState(false);
 * <AddSongDialog open={open} onOpenChange={setOpen} />
 * ```
 */
export default function AddSongDialog({ open, onOpenChange }: AddSongDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Song</DialogTitle>
          <DialogDescription>
            Add a new song to the community library. Once created, you can add arrangements with chords.
          </DialogDescription>
        </DialogHeader>
        <AddSongForm
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
