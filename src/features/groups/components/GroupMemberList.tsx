/**
 * GroupMemberList Component
 * Phase 2: Groups - List of group members with role badges and actions
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import UserAvatar from '@/components/UserAvatar';
import { useGroupPermissions } from '../hooks/useGroupPermissions';
import { useGroupMembershipActions, type GroupMember } from '../hooks/useGroupMembership';
import {
  Crown,
  Shield,
  User,
  MoreVertical,
  UserMinus,
  ShieldPlus,
  ShieldMinus,
  Crown as CrownIcon,
  Loader2,
} from 'lucide-react';
import type { Id } from '../../../../convex/_generated/dataModel';
import { getDisplayName } from '@/features/shared/utils/userDisplay';

interface GroupMemberListProps {
  groupId: Id<'groups'>;
  members: GroupMember[];
  currentUserRole: 'owner' | 'admin' | 'member' | null;
  currentUserPromotedAt?: number;
  loading?: boolean;
}

export default function GroupMemberList({
  groupId,
  members,
  currentUserRole,
  currentUserPromotedAt,
  loading,
}: GroupMemberListProps) {
  const permissions = useGroupPermissions(currentUserRole, currentUserPromotedAt);
  const actions = useGroupMembershipActions();
  const [actionTarget, setActionTarget] = useState<{
    member: GroupMember;
    action: 'remove' | 'promote' | 'demote' | 'transfer';
  } | null>(null);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3" />;
      case 'admin':
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <Badge className="flex items-center gap-1">
            {getRoleIcon(role)}
            Owner
          </Badge>
        );
      case 'admin':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            {getRoleIcon(role)}
            Admin
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            {getRoleIcon(role)}
            Member
          </Badge>
        );
    }
  };

  const handleAction = async () => {
    if (!actionTarget) return;

    const { member, action } = actionTarget;

    switch (action) {
      case 'remove':
        await actions.removeMember(groupId, member.userId);
        break;
      case 'promote':
        await actions.promoteToAdmin(groupId, member.userId);
        break;
      case 'demote':
        await actions.demoteAdmin(groupId, member.userId);
        break;
      case 'transfer':
        await actions.transferOwnership(groupId, member.userId);
        break;
    }

    setActionTarget(null);
  };

  const getActionDialogContent = () => {
    if (!actionTarget) return null;

    const { member, action } = actionTarget;
    const name = getDisplayName(member.user, { prefixUsername: false });

    switch (action) {
      case 'remove':
        return {
          title: `Remove ${name}?`,
          description: `Are you sure you want to remove ${name} from this group? They will need to rejoin if they want to access group content again.`,
          actionText: 'Remove',
        };
      case 'promote':
        return {
          title: `Promote ${name} to Admin?`,
          description: `${name} will be able to manage members and approve join requests. They will be junior to all existing admins.`,
          actionText: 'Promote',
        };
      case 'demote':
        return {
          title: `Demote ${name} to Member?`,
          description: `${name} will lose their admin privileges and will no longer be able to manage members or approve requests.`,
          actionText: 'Demote',
        };
      case 'transfer':
        return {
          title: `Transfer Ownership to ${name}?`,
          description: `${name} will become the new owner of this group. You will become an admin. This action cannot be undone.`,
          actionText: 'Transfer',
        };
      default:
        return null;
    }
  };

  const dialogContent = getActionDialogContent();

  // Sort members: owner first, then admins by seniority, then members
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'owner') return -1;
    if (b.role === 'owner') return 1;
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (b.role === 'admin' && a.role !== 'admin') return 1;
    if (a.role === 'admin' && b.role === 'admin') {
      return (a.promotedAt ?? 0) - (b.promotedAt ?? 0);
    }
    return a.joinedAt - b.joinedAt;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {sortedMembers.map((member) => {
          const canManage = permissions.canManageMember(member);
          const isAdmin = member.role === 'admin';
          const isMember = member.role === 'member';
          const isOwner = member.role === 'owner';

          return (
            <div
              key={member._id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <UserAvatar
                  userId={member.userId}
                  displayName={member.user?.displayName}
                  size="md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {getDisplayName(member.user, { prefixUsername: false })}
                    </span>
                    {getRoleBadge(member.role)}
                  </div>
                  {member.user?.username && (
                    <span className="text-sm text-muted-foreground">
                      @{member.user.username}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions dropdown */}
              {(canManage ||
                (permissions.canPromoteMembers && isMember) ||
                (permissions.canTransferOwnership && !isOwner)) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* Promote to admin (for members) */}
                    {permissions.canPromoteMembers && isMember && (
                      <DropdownMenuItem
                        onClick={() =>
                          setActionTarget({ member, action: 'promote' })
                        }
                      >
                        <ShieldPlus className="h-4 w-4 mr-2" />
                        Promote to Admin
                      </DropdownMenuItem>
                    )}

                    {/* Demote admin */}
                    {canManage && isAdmin && (
                      <DropdownMenuItem
                        onClick={() =>
                          setActionTarget({ member, action: 'demote' })
                        }
                      >
                        <ShieldMinus className="h-4 w-4 mr-2" />
                        Demote to Member
                      </DropdownMenuItem>
                    )}

                    {/* Transfer ownership */}
                    {permissions.canTransferOwnership && !isOwner && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            setActionTarget({ member, action: 'transfer' })
                          }
                        >
                          <CrownIcon className="h-4 w-4 mr-2" />
                          Transfer Ownership
                        </DropdownMenuItem>
                      </>
                    )}

                    {/* Remove member */}
                    {canManage && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            setActionTarget({ member, action: 'remove' })
                          }
                          className="text-destructive"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Remove from Group
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={actionTarget !== null}
        onOpenChange={(open) => !open && setActionTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogContent?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={actions.loading}>
              {actions.loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {dialogContent?.actionText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
