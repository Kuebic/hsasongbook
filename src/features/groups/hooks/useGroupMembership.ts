/**
 * useGroupMembership Hook
 * Phase 2: Groups - Fetches and manages group membership
 */

import { useQuery, useMutation } from 'convex/react';
import { useCallback, useState } from 'react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';

export interface GroupMember {
  _id: Id<'groupMembers'>;
  groupId: Id<'groups'>;
  userId: Id<'users'>;
  role: 'owner' | 'admin' | 'member';
  joinedAt: number;
  promotedAt?: number;
  invitedBy?: Id<'users'>;
  user: {
    _id: Id<'users'>;
    username?: string;
    displayName?: string;
    showRealName?: boolean;
    avatarKey?: string;
  } | null;
}

export interface JoinRequest {
  _id: Id<'groupJoinRequests'>;
  groupId: Id<'groups'>;
  userId: Id<'users'>;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: number;
  resolvedBy?: Id<'users'>;
  resolvedAt?: number;
  user: {
    _id: Id<'users'>;
    username?: string;
    displayName?: string;
    showRealName?: boolean;
    avatarKey?: string;
  } | null;
}

/**
 * Fetch group members
 */
export function useGroupMembers(groupId: Id<'groups'> | undefined) {
  const members = useQuery(
    api.groups.getMembers,
    groupId ? { groupId } : 'skip'
  );
  const loading = groupId !== undefined && members === undefined;

  return {
    members: (members ?? []) as GroupMember[],
    loading,
  };
}

/**
 * Fetch pending join requests (for admins/owners)
 */
export function usePendingRequests(groupId: Id<'groups'> | undefined) {
  const requests = useQuery(
    api.groups.getPendingRequests,
    groupId ? { groupId } : 'skip'
  );
  const loading = groupId !== undefined && requests === undefined;

  return {
    requests: (requests ?? []) as JoinRequest[],
    loading,
  };
}

/**
 * Fetch user's pending request for a group
 */
export function useUserPendingRequest(groupId: Id<'groups'> | undefined) {
  const request = useQuery(
    api.groups.getUserPendingRequest,
    groupId ? { groupId } : 'skip'
  );
  const loading = groupId !== undefined && request === undefined;

  return {
    request: request as JoinRequest | null,
    loading,
    hasPendingRequest: request !== null && request !== undefined,
  };
}

/**
 * Hook for group membership actions
 */
export function useGroupMembershipActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestJoinMutation = useMutation(api.groups.requestJoin);
  const cancelRequestMutation = useMutation(api.groups.cancelRequest);
  const approveJoinMutation = useMutation(api.groups.approveJoin);
  const rejectJoinMutation = useMutation(api.groups.rejectJoin);
  const leaveGroupMutation = useMutation(api.groups.leaveGroup);
  const removeMemberMutation = useMutation(api.groups.removeMember);
  const promoteToAdminMutation = useMutation(api.groups.promoteToAdmin);
  const demoteAdminMutation = useMutation(api.groups.demoteAdmin);
  const transferOwnershipMutation = useMutation(api.groups.transferOwnership);

  const requestJoin = useCallback(
    async (groupId: Id<'groups'>) => {
      setLoading(true);
      setError(null);
      try {
        const result = await requestJoinMutation({ groupId });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to join group';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [requestJoinMutation]
  );

  const cancelRequest = useCallback(
    async (groupId: Id<'groups'>) => {
      setLoading(true);
      setError(null);
      try {
        await cancelRequestMutation({ groupId });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to cancel request';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [cancelRequestMutation]
  );

  const approveJoin = useCallback(
    async (requestId: Id<'groupJoinRequests'>) => {
      setLoading(true);
      setError(null);
      try {
        await approveJoinMutation({ requestId });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to approve request';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [approveJoinMutation]
  );

  const rejectJoin = useCallback(
    async (requestId: Id<'groupJoinRequests'>) => {
      setLoading(true);
      setError(null);
      try {
        await rejectJoinMutation({ requestId });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to reject request';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [rejectJoinMutation]
  );

  const leaveGroup = useCallback(
    async (groupId: Id<'groups'>) => {
      setLoading(true);
      setError(null);
      try {
        const result = await leaveGroupMutation({ groupId });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to leave group';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [leaveGroupMutation]
  );

  const removeMember = useCallback(
    async (groupId: Id<'groups'>, userId: Id<'users'>) => {
      setLoading(true);
      setError(null);
      try {
        await removeMemberMutation({ groupId, userId });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove member';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [removeMemberMutation]
  );

  const promoteToAdmin = useCallback(
    async (groupId: Id<'groups'>, userId: Id<'users'>) => {
      setLoading(true);
      setError(null);
      try {
        await promoteToAdminMutation({ groupId, userId });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to promote member';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [promoteToAdminMutation]
  );

  const demoteAdmin = useCallback(
    async (groupId: Id<'groups'>, userId: Id<'users'>) => {
      setLoading(true);
      setError(null);
      try {
        await demoteAdminMutation({ groupId, userId });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to demote admin';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [demoteAdminMutation]
  );

  const transferOwnership = useCallback(
    async (groupId: Id<'groups'>, userId: Id<'users'>) => {
      setLoading(true);
      setError(null);
      try {
        await transferOwnershipMutation({ groupId, userId });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to transfer ownership';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [transferOwnershipMutation]
  );

  return {
    loading,
    error,
    requestJoin,
    cancelRequest,
    approveJoin,
    rejectJoin,
    leaveGroup,
    removeMember,
    promoteToAdmin,
    demoteAdmin,
    transferOwnership,
  };
}

export default useGroupMembers;
