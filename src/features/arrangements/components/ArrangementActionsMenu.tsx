/**
 * ArrangementActionsMenu Component
 *
 * A dropdown menu consolidating arrangement actions:
 * - Duplicate (authenticated users)
 * - Collaborators (owner only)
 * - Transfer to/Reclaim from Community (original creator only)
 * - Delete (owner only)
 */

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { MoreVertical, Copy, Users, Globe, User, Trash2, Loader2, Pencil } from 'lucide-react';
import { DeleteArrangementDialog } from './DeleteArrangementDialog';
import { DuplicateArrangementDialog } from './DuplicateArrangementDialog';
import type { Id } from '../../../../convex/_generated/dataModel';

// Only the fields we actually need from the arrangement
interface ArrangementInfo {
  id: string;
  name: string;
}

interface ArrangementActionsMenuProps {
  arrangement: ArrangementInfo;
  songSlug: string;
  isOwner: boolean;
  isOriginalCreator: boolean;
  isCommunityOwned: boolean;
  isAuthenticated: boolean;
  onShowCollaborators: () => void;
  onEdit?: () => void;
  onDeleted?: () => void;
}

export function ArrangementActionsMenu({
  arrangement,
  songSlug,
  isOwner,
  isOriginalCreator,
  isCommunityOwned,
  isAuthenticated,
  onShowCollaborators,
  onEdit,
  onDeleted,
}: ArrangementActionsMenuProps) {
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  const transferToCommunity = useMutation(api.arrangements.transferToCommunity);
  const reclaimFromCommunity = useMutation(api.arrangements.reclaimFromCommunity);

  // Don't show menu if user has no actions available
  const hasAnyActions = isAuthenticated;
  if (!hasAnyActions) return null;

  const handleTransfer = async () => {
    setIsTransferring(true);
    try {
      await transferToCommunity({ id: arrangement.id as Id<'arrangements'> });
      setShowTransferDialog(false);
    } catch (error) {
      console.error('Failed to transfer arrangement:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleReclaim = async () => {
    setIsTransferring(true);
    try {
      await reclaimFromCommunity({ id: arrangement.id as Id<'arrangements'> });
      setShowTransferDialog(false);
    } catch (error) {
      console.error('Failed to reclaim arrangement:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* Edit - owner only */}
          {isOwner && onEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}

          {/* Duplicate - available to all authenticated users */}
          {isAuthenticated && (
            <DropdownMenuItem onClick={() => setShowDuplicateDialog(true)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
          )}

          {/* Collaborators - owner only */}
          {isOwner && (
            <DropdownMenuItem onClick={onShowCollaborators}>
              <Users className="h-4 w-4 mr-2" />
              Collaborators
            </DropdownMenuItem>
          )}

          {/* Transfer/Reclaim - original creator only */}
          {isOriginalCreator && (
            <>
              <DropdownMenuSeparator />
              {isCommunityOwned ? (
                <DropdownMenuItem onClick={() => setShowTransferDialog(true)}>
                  <User className="h-4 w-4 mr-2" />
                  Reclaim Arrangement
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setShowTransferDialog(true)}>
                  <Globe className="h-4 w-4 mr-2" />
                  Move to Community
                </DropdownMenuItem>
              )}
            </>
          )}

          {/* Delete - owner only */}
          {isOwner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Duplicate Dialog */}
      <DuplicateArrangementDialog
        sourceArrangement={arrangement}
        songSlug={songSlug}
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        showTrigger={false}
      />

      {/* Delete Dialog */}
      <DeleteArrangementDialog
        arrangementId={arrangement.id}
        arrangementName={arrangement.name}
        isOwner={isOwner}
        onDeleted={onDeleted}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        showTrigger={false}
      />

      {/* Transfer/Reclaim Confirmation Dialog */}
      <AlertDialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isCommunityOwned ? 'Reclaim this arrangement?' : 'Transfer to Community?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isCommunityOwned ? (
                <>
                  This will move the arrangement back to your personal ownership.
                  Community group members will no longer be able to edit it. You can
                  always transfer it back to Community later.
                </>
              ) : (
                <>
                  This will allow anyone in the Community group to edit this arrangement.
                  You'll retain edit rights as the original creator and can reclaim
                  ownership anytime.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTransferring} className="min-h-[44px]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={isCommunityOwned ? handleReclaim : handleTransfer}
              disabled={isTransferring}
              className="min-h-[44px]"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isCommunityOwned ? 'Reclaiming...' : 'Transferring...'}
                </>
              ) : (
                isCommunityOwned ? 'Reclaim Arrangement' : 'Transfer to Community'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
