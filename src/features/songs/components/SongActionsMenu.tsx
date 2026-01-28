/**
 * SongActionsMenu Component
 *
 * A unified dropdown menu for song actions:
 * - Edit (opens edit dialog)
 * - Duplicate (creates a copy)
 * - Transfer to Group (original creator only)
 * - Move to Community (original creator only)
 * - Reclaim from Group/Community (original creator only)
 * - Delete (owner only)
 */

import { useState, useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MoreVertical,
  Globe,
  User,
  Users,
  Loader2,
  Copy,
  Pencil,
  Trash2,
} from 'lucide-react';
import { DuplicateSongDialog } from './DuplicateSongDialog';
import { DeleteSongDialog } from './DeleteSongDialog';
import type { Id } from '../../../../convex/_generated/dataModel';

interface SongActionsMenuProps {
  songId: string;
  songTitle: string;
  isOwner: boolean;
  isOriginalCreator: boolean;
  isCommunityOwned: boolean;
  isAuthenticated: boolean;
  ownerType?: 'user' | 'group';
  groupName?: string;
  onEdit: () => void;
  onDeleted?: () => void;
}

type OwnershipDialogType =
  | 'transfer-group'
  | 'move-community'
  | 'reclaim-group'
  | 'reclaim-community'
  | null;

export function SongActionsMenu({
  songId,
  songTitle,
  isOwner,
  isOriginalCreator,
  isCommunityOwned,
  isAuthenticated,
  ownerType,
  groupName,
  onEdit,
  onDeleted,
}: SongActionsMenuProps) {
  const [activeOwnershipDialog, setActiveOwnershipDialog] =
    useState<OwnershipDialogType>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const transferToCommunity = useMutation(api.songs.transferToCommunity);
  const reclaimFromCommunity = useMutation(api.songs.reclaimFromCommunity);
  const transferToGroup = useMutation(api.songs.transferToGroup);
  const reclaimFromGroup = useMutation(api.songs.reclaimFromGroup);

  // Fetch user's groups (filtered for owner/admin only)
  const userGroups = useQuery(api.groups.getUserGroups);
  const eligibleGroups =
    userGroups?.filter(
      (g) =>
        (g.role === 'owner' || g.role === 'admin') && !g.isSystemGroup // Exclude Community
    ) ?? [];

  // Determine ownership state
  const isGroupOwned = ownerType === 'group' && !isCommunityOwned;
  const isPersonalOwned = !ownerType || ownerType === 'user';

  // Compute available ownership actions
  const ownershipActions = useMemo(() => {
    const actions = [];

    if (!isOriginalCreator) return actions;

    // Personal or Group owned (not Community system group)
    if ((isPersonalOwned || isGroupOwned) && eligibleGroups.length > 0) {
      actions.push({
        type: 'transfer-group' as const,
        label: isPersonalOwned ? 'Transfer to Group' : 'Transfer to Another Group',
        icon: Users,
      });
    }

    // Personal owned only
    if (isPersonalOwned) {
      actions.push({
        type: 'move-community' as const,
        label: 'Move to Community',
        icon: Globe,
      });
    }

    // Group owned (not Community)
    if (isGroupOwned) {
      actions.push({
        type: 'reclaim-group' as const,
        label: 'Reclaim from Group',
        icon: User,
      });
    }

    // Community owned
    if (isCommunityOwned) {
      if (eligibleGroups.length > 0) {
        actions.push({
          type: 'transfer-group' as const,
          label: 'Transfer to Group',
          icon: Users,
        });
      }
      actions.push({
        type: 'reclaim-community' as const,
        label: 'Reclaim from Community',
        icon: User,
      });
    }

    return actions;
  }, [
    isCommunityOwned,
    isOriginalCreator,
    eligibleGroups.length,
    isPersonalOwned,
    isGroupOwned,
  ]);

  // Don't show menu if user has no actions available
  if (!isAuthenticated) return null;

  const handleTransferToCommunity = async () => {
    setIsTransferring(true);
    try {
      await transferToCommunity({ id: songId as Id<'songs'> });
      setActiveOwnershipDialog(null);
    } catch (error) {
      console.error('Failed to transfer song:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleTransferToGroup = async () => {
    if (!selectedGroupId) return;
    setIsTransferring(true);
    try {
      await transferToGroup({
        id: songId as Id<'songs'>,
        targetGroupId: selectedGroupId,
      });
      setActiveOwnershipDialog(null);
      setSelectedGroupId('');
    } catch (error) {
      console.error('Failed to transfer song:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleReclaimFromCommunity = async () => {
    setIsTransferring(true);
    try {
      await reclaimFromCommunity({ id: songId as Id<'songs'> });
      setActiveOwnershipDialog(null);
    } catch (error) {
      console.error('Failed to reclaim song:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleReclaimFromGroup = async () => {
    setIsTransferring(true);
    try {
      await reclaimFromGroup({ id: songId as Id<'songs'> });
      setActiveOwnershipDialog(null);
    } catch (error) {
      console.error('Failed to reclaim song:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  const closeOwnershipDialog = () => {
    setActiveOwnershipDialog(null);
    setSelectedGroupId('');
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
          {/* Edit - only if user can edit */}
          {isOwner && (
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}

          {/* Duplicate - available to all authenticated users */}
          <DropdownMenuItem onClick={() => setShowDuplicateDialog(true)}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </DropdownMenuItem>

          {/* Ownership actions */}
          {ownershipActions.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {ownershipActions.map((action) => (
                <DropdownMenuItem
                  key={action.type}
                  onClick={() => setActiveOwnershipDialog(action.type)}
                >
                  <action.icon className="h-4 w-4 mr-2" />
                  {action.label}
                </DropdownMenuItem>
              ))}
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
      <DuplicateSongDialog
        sourceSong={{ id: songId, title: songTitle }}
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
      />

      {/* Delete Dialog */}
      <DeleteSongDialog
        songId={songId}
        songTitle={songTitle}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDeleted={onDeleted}
      />

      {/* Transfer to Community Dialog */}
      <AlertDialog
        open={activeOwnershipDialog === 'move-community'}
        onOpenChange={(open) => !open && closeOwnershipDialog()}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer to Community?</AlertDialogTitle>
            <AlertDialogDescription>
              This will allow anyone in the Community group to edit this song's
              metadata. You'll retain edit rights as the original creator and can
              reclaim ownership anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTransferToCommunity}
              disabled={isTransferring}
              className="min-h-[44px]"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                'Transfer to Community'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer to Group Dialog */}
      <AlertDialog
        open={activeOwnershipDialog === 'transfer-group'}
        onOpenChange={(open) => !open && closeOwnershipDialog()}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer Song to Group</AlertDialogTitle>
            <AlertDialogDescription>
              Transfer ownership of this song to one of your groups.
              {isGroupOwned && ' The song will be moved from its current group.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Select a group..." />
              </SelectTrigger>
              <SelectContent>
                {eligibleGroups.map((group) => (
                  <SelectItem
                    key={group._id}
                    value={group._id.toString()}
                    className="min-h-[44px]"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{group.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {group.memberCount}{' '}
                        {group.memberCount === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTransferToGroup}
              disabled={!selectedGroupId || isTransferring}
              className="min-h-[44px]"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                'Transfer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reclaim from Community Dialog */}
      <AlertDialog
        open={activeOwnershipDialog === 'reclaim-community'}
        onOpenChange={(open) => !open && closeOwnershipDialog()}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Reclaim this song?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the song back to your personal ownership. Community
              group members will no longer be able to edit it. You can always
              transfer it back to Community later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReclaimFromCommunity}
              disabled={isTransferring}
              className="min-h-[44px]"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reclaiming...
                </>
              ) : (
                'Reclaim Song'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reclaim from Group Dialog */}
      <AlertDialog
        open={activeOwnershipDialog === 'reclaim-group'}
        onOpenChange={(open) => !open && closeOwnershipDialog()}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Reclaim Song</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the song from <strong>{groupName}</strong>. Group
              members will lose access to this song. The song will return to your
              personal ownership.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReclaimFromGroup}
              disabled={isTransferring}
              className="min-h-[44px]"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reclaiming...
                </>
              ) : (
                'Reclaim Song'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
