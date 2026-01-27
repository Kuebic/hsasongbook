/**
 * SongOwnershipMenu Component
 *
 * A dropdown menu consolidating song ownership actions:
 * - Transfer to Group (original creator only)
 * - Move to Community (original creator only)
 * - Reclaim from Group (original creator only)
 * - Reclaim from Community (original creator only)
 */

import { useState, useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { MoreVertical, Globe, User, Users, Loader2 } from 'lucide-react';
import type { Id } from '../../../../convex/_generated/dataModel';

interface SongOwnershipMenuProps {
  songId: string;
  isOriginalCreator: boolean;
  isCommunityOwned: boolean;
  ownerType?: 'user' | 'group';
  groupName?: string;
}

type DialogType = 'transfer-group' | 'move-community' | 'reclaim-group' | 'reclaim-community' | null;

export function SongOwnershipMenu({
  songId,
  isOriginalCreator,
  isCommunityOwned,
  ownerType,
  groupName,
}: SongOwnershipMenuProps) {
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [isReclaiming, setIsReclaiming] = useState(false);

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

  // Determine ownership state
  const isGroupOwned = ownerType === 'group' && !isCommunityOwned;
  const isPersonalOwned = !ownerType || ownerType === 'user';

  // Compute available actions based on ownership state
  const availableActions = useMemo(() => {
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
  }, [isCommunityOwned, isOriginalCreator, eligibleGroups.length, isPersonalOwned, isGroupOwned]);

  // Don't show menu if no actions available
  if (availableActions.length === 0) return null;

  const handleTransferToCommunity = async () => {
    setIsTransferring(true);
    try {
      await transferToCommunity({ id: songId as Id<'songs'> });
      setActiveDialog(null);
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
      setActiveDialog(null);
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
      setActiveDialog(null);
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
      setActiveDialog(null);
    } catch (error) {
      console.error('Failed to reclaim song:', error);
    } finally {
      setIsReclaiming(false);
    }
  };

  const closeDialog = () => {
    setActiveDialog(null);
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
          {availableActions.map((action) => (
            <DropdownMenuItem
              key={action.type}
              onClick={() => setActiveDialog(action.type)}
            >
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Transfer to Community Dialog */}
      <AlertDialog
        open={activeDialog === 'move-community'}
        onOpenChange={(open) => !open && closeDialog()}
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
        open={activeDialog === 'transfer-group'}
        onOpenChange={(open) => !open && closeDialog()}
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
      <AlertDialog
        open={activeDialog === 'reclaim-community'}
        onOpenChange={(open) => !open && closeDialog()}
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
      <AlertDialog
        open={activeDialog === 'reclaim-group'}
        onOpenChange={(open) => !open && closeDialog()}
      >
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
    </>
  );
}
