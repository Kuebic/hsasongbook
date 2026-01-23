/**
 * useGroupPermissions Hook
 * Phase 2: Groups - Permission checking for groups
 */

import { useMemo } from 'react';
import type { GroupMember } from './useGroupMembership';

export interface UseGroupPermissionsReturn {
  /** Whether the user can manage this member (remove, demote) */
  canManageMember: (targetMember: GroupMember) => boolean;
  /** Whether the user can approve/reject join requests */
  canManageRequests: boolean;
  /** Whether the user can edit group settings */
  canEditSettings: boolean;
  /** Whether the user can delete the group */
  canDeleteGroup: boolean;
  /** Whether the user can promote members to admin */
  canPromoteMembers: boolean;
  /** Whether the user can transfer ownership */
  canTransferOwnership: boolean;
}

/**
 * Hook for checking group permissions based on user's role and seniority
 */
export function useGroupPermissions(
  userRole: 'owner' | 'admin' | 'member' | null,
  userPromotedAt?: number
): UseGroupPermissionsReturn {
  return useMemo(() => {
    // Not a member - no permissions
    if (!userRole) {
      return {
        canManageMember: () => false,
        canManageRequests: false,
        canEditSettings: false,
        canDeleteGroup: false,
        canPromoteMembers: false,
        canTransferOwnership: false,
      };
    }

    // Owner has all permissions
    if (userRole === 'owner') {
      return {
        canManageMember: () => true,
        canManageRequests: true,
        canEditSettings: true,
        canDeleteGroup: true,
        canPromoteMembers: true,
        canTransferOwnership: true,
      };
    }

    // Admin permissions
    if (userRole === 'admin') {
      return {
        canManageMember: (targetMember: GroupMember) => {
          // Cannot manage owner
          if (targetMember.role === 'owner') return false;
          // Can manage members
          if (targetMember.role === 'member') return true;
          // For other admins, check seniority
          if (targetMember.role === 'admin') {
            if (!userPromotedAt || !targetMember.promotedAt) return false;
            return userPromotedAt < targetMember.promotedAt;
          }
          return false;
        },
        canManageRequests: true,
        canEditSettings: false,
        canDeleteGroup: false,
        canPromoteMembers: true,
        canTransferOwnership: false,
      };
    }

    // Member has no management permissions
    return {
      canManageMember: () => false,
      canManageRequests: false,
      canEditSettings: false,
      canDeleteGroup: false,
      canPromoteMembers: false,
      canTransferOwnership: false,
    };
  }, [userRole, userPromotedAt]);
}

export default useGroupPermissions;
