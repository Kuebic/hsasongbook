/**
 * DeleteSetlistDialog Component
 *
 * Allows setlist owners to delete their setlist.
 * Shows a warning if the setlist is shared with others.
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

interface DeleteSetlistDialogProps {
  setlistId: string;
  setlistName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteSetlistDialog({
  setlistId,
  setlistName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteSetlistDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const removeSetlist = useMutation(api.setlists.remove);
  const sharingInfo = useQuery(
    api.setlists.getSharingInfo,
    open ? { setlistId: setlistId as Id<'setlists'> } : 'skip'
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await removeSetlist({ id: setlistId as Id<'setlists'> });
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      console.error('Failed to delete setlist:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const sharedCount = sharingInfo?.sharedWith?.length ?? 0;
  const hasSharedUsers = sharedCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete "{setlistName}"?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                This action cannot be undone. This will permanently delete the
                setlist.
              </p>
              {hasSharedUsers && (
                <div className="rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3">
                  <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                    Warning: This setlist is shared with {sharedCount} user
                    {sharedCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    They will lose access to this setlist when it's deleted.
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
              'Delete Setlist'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
