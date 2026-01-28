/**
 * DeleteSongDialog Component
 *
 * Allows song owners to delete their song.
 * Shows a warning about arrangements that will be deleted.
 */

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { Id } from '../../../../convex/_generated/dataModel';

interface DeleteSongDialogProps {
  songId: string;
  songTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteSongDialog({
  songId,
  songTitle,
  open,
  onOpenChange,
  onDeleted,
}: DeleteSongDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const removeSong = useMutation(api.songs.remove);
  const arrangementCount = useQuery(
    api.songs.getArrangementCount,
    open ? { songId: songId as Id<'songs'> } : 'skip'
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await removeSong({ id: songId as Id<'songs'> });
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      console.error('Failed to delete song:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasArrangements = arrangementCount !== undefined && arrangementCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete "{songTitle}"?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                This action cannot be undone. This will permanently delete the
                song and all its data.
              </p>
              {hasArrangements && (
                <div className="rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3">
                  <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                    Warning: This song has {arrangementCount} arrangement{arrangementCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    All arrangements will be permanently deleted. Any setlists
                    using these arrangements will have missing entries.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} className="min-h-[44px]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-[44px]"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Song'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
