/**
 * GroupHeader Component
 * Phase 2: Groups - Header for group page with join/leave actions
 */

import { Badge } from '@/components/ui/badge';
import { Users, Lock, Globe, Crown, Shield, User } from 'lucide-react';
import GroupJoinButton from './GroupJoinButton';
import type { GroupData } from '../hooks/useGroupData';
import type { Id } from '../../../../convex/_generated/dataModel';

interface GroupHeaderProps {
  group: GroupData;
  hasPendingRequest: boolean;
}

export default function GroupHeader({ group, hasPendingRequest }: GroupHeaderProps) {
  const isPublic = group.isSystemGroup;

  const getRoleBadge = () => {
    if (!group.isMember) return null;

    switch (group.role) {
      case 'owner':
        return (
          <Badge className="flex items-center gap-1">
            <Crown className="h-3 w-3" />
            Owner
          </Badge>
        );
      case 'admin':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        );
      case 'member':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <User className="h-3 w-3" />
            Member
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Group Name and Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h1 className="text-3xl font-bold">{group.name}</h1>
        <div className="flex items-center gap-2">
          {isPublic && (
            <Badge variant="secondary">System Group</Badge>
          )}
          {getRoleBadge()}
        </div>
      </div>

      {/* Description */}
      {group.description && (
        <p className="text-muted-foreground max-w-2xl">{group.description}</p>
      )}

      {/* Stats and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Stats */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
          </span>
          <span className="flex items-center gap-1.5">
            {group.joinPolicy === 'open' ? (
              <>
                <Globe className="h-4 w-4" />
                Open to join
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Approval required
              </>
            )}
          </span>
        </div>

        {/* Join/Leave Button */}
        <GroupJoinButton
          groupId={group._id as Id<'groups'>}
          isMember={group.isMember}
          hasPendingRequest={hasPendingRequest}
          joinPolicy={group.joinPolicy}
          role={group.role}
          isSystemGroup={group.isSystemGroup}
        />
      </div>
    </div>
  );
}
