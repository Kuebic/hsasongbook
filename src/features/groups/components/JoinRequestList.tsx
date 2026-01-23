/**
 * JoinRequestList Component
 * Phase 2: Groups - List of pending join requests for admins/owners
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import UserAvatar from '@/components/UserAvatar';
import { useGroupMembershipActions, type JoinRequest } from '../hooks/useGroupMembership';
import { Check, X, Loader2, Clock, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDisplayName } from '@/features/shared/utils/userDisplay';

interface JoinRequestListProps {
  requests: JoinRequest[];
  loading?: boolean;
}

export default function JoinRequestList({
  requests,
  loading,
}: JoinRequestListProps) {
  const actions = useGroupMembershipActions();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No pending join requests</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map((request) => (
        <div
          key={request._id}
          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
        >
          <div className="flex items-center gap-3">
            <UserAvatar
              userId={request.userId}
              displayName={request.user?.displayName}
              size="md"
            />
            <div>
              <span className="font-medium">{getDisplayName(request.user, { prefixUsername: false })}</span>
              {request.user?.username && (
                <p className="text-sm text-muted-foreground">
                  @{request.user.username}
                </p>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Requested{' '}
                {formatDistanceToNow(request.requestedAt, { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => actions.rejectJoin(request._id)}
              disabled={actions.loading}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {actions.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => actions.approveJoin(request._id)}
              disabled={actions.loading}
            >
              {actions.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Approve
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
