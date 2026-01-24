/**
 * DeleteArrangementDialog Component
 *
 * Allows arrangement owners to delete their arrangement.
 * Shows a warning if the arrangement is used in any setlists.
 */

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import type { Id } from '../../../../convex/_generated/dataModel';

interface DeleteArrangementDialogProps {
  arrangementId: string;
  arrangementName: string;
  isOwner: boolean;
  onDeleted?: () => void;
  // Controlled mode props
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean; // Default: true
}

export function DeleteArrangementDialog({
  arrangementId,
  arrangementName,
  isOwner,
  onDeleted,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  showTrigger = true,
}: DeleteArrangementDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;

  const removeArrangement = useMutation(api.arrangements.remove);
  const setlistUsage = useQuery(
    api.arrangements.getSetlistUsage,
    open ? { arrangementId: arrangementId as Id<'arrangements'> } : 'skip'
  );

  // Only show for owners
  if (!isOwner) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await removeArrangement({ id: arrangementId as Id<'arrangements'> });
      setOpen(false);
      onDeleted?.();
    } catch (error) {
      console.error('Failed to delete arrangement:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasSetlistUsage = setlistUsage && setlistUsage.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete "{arrangementName}"?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                This action cannot be undone. This will permanently delete your
                arrangement and all associated data.
              </p>
              {hasSetlistUsage && (
                <div className="rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3">
                  <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                    Warning: This arrangement is used in {setlistUsage.length} setlist{setlistUsage.length > 1 ? 's' : ''}:
                  </p>
                  <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-300">
                    {setlistUsage.slice(0, 5).map((setlist) => (
                      <li key={setlist._id}>{setlist.name}</li>
                    ))}
                    {setlistUsage.length > 5 && (
                      <li>...and {setlistUsage.length - 5} more</li>
                    )}
                  </ul>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                    These setlists will have missing entries after deletion.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Arrangement'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
