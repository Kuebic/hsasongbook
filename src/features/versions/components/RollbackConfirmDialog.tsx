/**
 * RollbackConfirmDialog Component
 * Confirmation dialog for rolling back to a previous version.
 * Shows warning and target version details before proceeding.
 */

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
import { AlertTriangle, Loader2 } from 'lucide-react';

interface RollbackConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionNumber: number;
  versionDate: string;
  changedByUser: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function RollbackConfirmDialog({
  open,
  onOpenChange,
  versionNumber,
  versionDate,
  changedByUser,
  onConfirm,
  isLoading = false,
}: RollbackConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Rollback to Version {versionNumber}?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                This will restore the content to version {versionNumber} from{' '}
                <strong>{versionDate}</strong> by <strong>{changedByUser}</strong>.
              </p>
              <p className="text-sm">
                The current version will be saved in history before the rollback.
                This action creates new version entries and cannot be directly undone,
                but you can always rollback again to any previous version.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rolling back...
              </>
            ) : (
              'Rollback'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
