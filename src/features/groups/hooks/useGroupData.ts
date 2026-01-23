/**
 * useGroupData Hook
 * Phase 2: Groups - Fetches group data from Convex
 */

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';

export interface GroupData {
  _id: Id<'groups'>;
  name: string;
  slug: string;
  description?: string;
  avatarKey?: string;
  joinPolicy: 'open' | 'approval';
  isSystemGroup?: boolean;
  memberCount: number;
  isMember: boolean;
  role: 'owner' | 'admin' | 'member' | null;
}

export interface UseGroupDataReturn {
  group: GroupData | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetch a group by slug
 */
export function useGroupData(slug: string | undefined): UseGroupDataReturn {
  const group = useQuery(
    api.groups.getBySlug,
    slug ? { slug } : 'skip'
  );

  const loading = slug !== undefined && group === undefined;
  const error = group === null && !loading ? 'Group not found' : null;

  return {
    group: group as GroupData | null,
    loading,
    error,
  };
}

/**
 * Fetch all groups
 */
export function useGroupsList() {
  const groups = useQuery(api.groups.list);
  const loading = groups === undefined;

  return {
    groups: (groups ?? []) as GroupData[],
    loading,
  };
}

/**
 * Fetch groups the current user belongs to
 */
export function useUserGroups() {
  const groups = useQuery(api.groups.getUserGroups);
  const loading = groups === undefined;

  return {
    groups: (groups ?? []) as (GroupData & { role: 'owner' | 'admin' | 'member' })[],
    loading,
  };
}

/**
 * Fetch the Public system group
 */
export function usePublicGroup() {
  const group = useQuery(api.groups.getPublicGroup);
  const loading = group === undefined;

  return {
    group: group as GroupData | null,
    loading,
  };
}

export default useGroupData;
