/**
 * SetlistActionsMenu Component
 *
 * A unified dropdown menu for setlist actions:
 * - Edit (opens edit dialog)
 * - Duplicate (creates a copy)
 * - Share (opens share dialog)
 * - Delete (owner only)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Copy, Share2, Pencil, Trash2 } from 'lucide-react';
import { DeleteSetlistDialog } from './DeleteSetlistDialog';

interface SetlistActionsMenuProps {
  setlistId: string;
  setlistName: string;
  isOwner: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onShare: () => void;
  onDeleted?: () => void;
}

export function SetlistActionsMenu({
  setlistId,
  setlistName,
  isOwner,
  canEdit,
  onEdit,
  onDuplicate,
  onShare,
  onDeleted,
}: SetlistActionsMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
          {isOwner && (
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}

          {/* Duplicate - available to all viewers */}
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </DropdownMenuItem>

          {/* Share - owner or editor */}
          {(isOwner || canEdit) && (
            <DropdownMenuItem onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
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

      {/* Delete Dialog */}
      <DeleteSetlistDialog
        setlistId={setlistId}
        setlistName={setlistName}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDeleted={onDeleted}
      />
    </>
  );
}
