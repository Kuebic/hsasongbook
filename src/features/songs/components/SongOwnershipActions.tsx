/**
 * SongOwnershipActions Component
 *
 * Allows the original song creator to:
 * - Transfer their song to any group they admin/own
 * - Transfer their song to Community (crowdsourced editing)
 * - Reclaim their song from any group back to personal ownership
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
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe, User, Users, Loader2 } from 'lucide-react';
import type { Id } from '../../../../convex/_generated/dataModel';

interface SongOwnershipActionsProps {
  songId: string;
  isOwner: boolean;
  isCommunityOwned: boolean;
  ownerType?: 'user' | 'group';
  groupName?: string;
}

export function SongOwnershipActions({
  songId,
  isOwner,
  isCommunityOwned,
  ownerType,
  groupName,
}: SongOwnershipActionsProps) {
  const [isTransferring, setIsTransferring] = useState(false);
  const [isReclaiming, setIsReclaiming] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showTransferToGroupDialog, setShowTransferToGroupDialog] = useState(false);
  const [showReclaimDialog, setShowReclaimDialog] = useState(false);
  const [showReclaimFromGroupDialog, setShowReclaimFromGroupDialog] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  const transferToCommunity = useMutation(api.songs.transferToCommunity);
  const reclaimFromCommunity = useMutation(api.songs.reclaimFromCommunity);
  const transferToGroup = useMutation(api.songs.transferToGroup);
  const reclaimFromGroup = useMutation(api.songs.reclaimFromGroup);

  // Fetch user's groups (filtered for owner/admin only)
  const userGroups = useQuery(api.groups.getUserGroups);
  const eligibleGroups = userGroups?.filter(
    (g) =>
      (g.role === 'owner' || g.role === 'admin') &&
      !g.isSystemGroup // Exclude Community
  ) ?? [];

  // Only show for the original creator
  if (!isOwner) return null;

  // Determine ownership state
  const isGroupOwned = ownerType === 'group' && !isCommunityOwned;
  const isPersonalOwned = !ownerType || ownerType === 'user';

  const handleTransferToCommunity = async () => {
    setIsTransferring(true);
    try {
      await transferToCommunity({ id: songId as Id<'songs'> });
      setShowTransferDialog(false);
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
        targetGroupId: selectedGroupId
      });
      setShowTransferToGroupDialog(false);
      setSelectedGroupId('');
    } catch (error) {
      console.error('Failed to transfer song:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleReclaimFromCommunity = async () => {
    setIsReclaiming(true);
    try {
      await reclaimFromCommunity({ id: songId as Id<'songs'> });
      setShowReclaimDialog(false);
    } catch (error) {
      console.error('Failed to reclaim song:', error);
    } finally {
      setIsReclaiming(false);
    }
  };

  const handleReclaimFromGroup = async () => {
    setIsReclaiming(true);
    try {
      await reclaimFromGroup({ id: songId as Id<'songs'> });
      setShowReclaimFromGroupDialog(false);
    } catch (error) {
      console.error('Failed to reclaim song:', error);
    } finally {
      setIsReclaiming(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Transfer to regular group - show for personal OR non-Community group */}
      {(isPersonalOwned || isGroupOwned) && eligibleGroups.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTransferToGroupDialog(true)}
          className="min-h-[44px]"
        >
          <Users className="mr-2 h-4 w-4" />
          {isPersonalOwned ? 'Transfer to Group' : 'Transfer to Another Group'}
        </Button>
      )}

      {/* Move to Community - show only for personal */}
      {isPersonalOwned && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTransferDialog(true)}
          className="min-h-[44px]"
        >
          <Globe className="mr-2 h-4 w-4" />
          Move to Community
        </Button>
      )}

      {/* Reclaim from regular group */}
      {isGroupOwned && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowReclaimFromGroupDialog(true)}
          className="min-h-[44px]"
        >
          <User className="mr-2 h-4 w-4" />
          Reclaim Song
        </Button>
      )}

      {/* Reclaim from Community */}
      {isCommunityOwned && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowReclaimDialog(true)}
          className="min-h-[44px]"
        >
          <User className="mr-2 h-4 w-4" />
          Reclaim Song
        </Button>
      )}

      {/* Transfer to Community Dialog */}
      <AlertDialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
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
      <AlertDialog open={showTransferToGroupDialog} onOpenChange={setShowTransferToGroupDialog}>
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
                        {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
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
      <AlertDialog open={showReclaimDialog} onOpenChange={setShowReclaimDialog}>
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
              disabled={isReclaiming}
              className="min-h-[44px]"
            >
              {isReclaiming ? (
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
      <AlertDialog open={showReclaimFromGroupDialog} onOpenChange={setShowReclaimFromGroupDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Reclaim Song</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the song from <strong>{groupName}</strong>.
              Group members will lose access to this song. The song will return to
              your personal ownership.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReclaimFromGroup}
              disabled={isReclaiming}
              className="min-h-[44px]"
            >
              {isReclaiming ? (
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
    </div>
  );
}
