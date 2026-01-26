/**
 * GroupJoinButton Component
 * Phase 2: Groups - Button for joining/leaving groups
 */

import { useState } from 'react';
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
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useGroupMembershipActions } from '../hooks/useGroupMembership';
import { Loader2, UserPlus, UserMinus, Clock, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Id } from '../../../../convex/_generated/dataModel';

interface GroupJoinButtonProps {
  groupId: Id<'groups'>;
  isMember: boolean;
  hasPendingRequest: boolean;
  joinPolicy: 'open' | 'approval';
  role: 'owner' | 'admin' | 'member' | null;
  isSystemGroup?: boolean;
}

export default function GroupJoinButton({
  groupId,
  isMember,
  hasPendingRequest,
  joinPolicy,
  role,
  isSystemGroup,
}: GroupJoinButtonProps) {
  const { user } = useAuth();
  const isAuthenticated = user && !user.isAnonymous;
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const { loading, error: _error, requestJoin, cancelRequest, leaveGroup } =
    useGroupMembershipActions();

  // Not authenticated - show sign in prompt
  if (!isAuthenticated) {
    return (
      <Button variant="outline" asChild>
        <Link to="/auth/signin">
          <LogIn className="h-4 w-4 mr-2" />
          Sign in to join
        </Link>
      </Button>
    );
  }

  // Has pending request
  if (hasPendingRequest) {
    return (
      <Button
        variant="outline"
        onClick={() => cancelRequest(groupId)}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Clock className="h-4 w-4 mr-2" />
        )}
        Cancel Request
      </Button>
    );
  }

  // Already a member
  if (isMember) {
    // Owner of system group cannot leave
    if (role === 'owner' && isSystemGroup) {
      return null;
    }

    return (
      <>
        <Button
          variant="outline"
          onClick={() => setShowLeaveDialog(true)}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <UserMinus className="h-4 w-4 mr-2" />
          )}
          Leave Group
        </Button>

        <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Leave this group?</AlertDialogTitle>
              <AlertDialogDescription>
                {role === 'owner'
                  ? 'As the owner, leaving will transfer ownership to the most senior admin (or member if no admins exist). This action cannot be undone.'
                  : 'Are you sure you want to leave this group? You will need to rejoin if you want to access group content again.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  await leaveGroup(groupId);
                  setShowLeaveDialog(false);
                }}
              >
                Leave Group
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Not a member - show join button
  return (
    <Button onClick={() => requestJoin(groupId)} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      {joinPolicy === 'open' ? 'Join Group' : 'Request to Join'}
    </Button>
  );
}
