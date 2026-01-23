/**
 * GroupPage Component
 * Phase 2: Groups - Single group view with members and join requests
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGroupData } from '../hooks/useGroupData';
import {
  useGroupMembers,
  usePendingRequests,
  useUserPendingRequest,
} from '../hooks/useGroupMembership';
import { useAuth } from '@/features/auth/hooks/useAuth';
import GroupHeader from '../components/GroupHeader';
import GroupMemberList from '../components/GroupMemberList';
import JoinRequestList from '../components/JoinRequestList';
import Breadcrumbs from '@/features/shared/components/Breadcrumbs';
import { PageSpinner } from '@/features/shared/components/LoadingStates';
import { SimplePageTransition } from '@/features/shared/components/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Settings, UserPlus } from 'lucide-react';
import type { Id } from '../../../../convex/_generated/dataModel';

export function GroupPage() {
  const { groupSlug } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'members' | 'requests'>('members');

  const { group, loading: groupLoading, error } = useGroupData(groupSlug);
  const { members, loading: membersLoading } = useGroupMembers(
    group?._id as Id<'groups'> | undefined
  );
  const { requests, loading: requestsLoading } = usePendingRequests(
    group?._id as Id<'groups'> | undefined
  );
  const { hasPendingRequest, loading: pendingLoading } = useUserPendingRequest(
    group?._id as Id<'groups'> | undefined
  );

  const loading = groupLoading || membersLoading || pendingLoading;
  const isOwnerOrAdmin =
    group?.isMember && (group.role === 'owner' || group.role === 'admin');

  // Find current user's membership for seniority info
  const currentUserMembership = members.find((m) => m.userId === user?._id);

  if (loading) {
    return <PageSpinner message="Loading group..." />;
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Group not found</h2>
              <p className="text-muted-foreground text-sm">
                The group you're looking for doesn't exist
              </p>
            </div>
            <Button asChild className="w-full">
              <Link to="/groups">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to groups
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Groups', path: '/groups' },
    { label: group.name, path: `/groups/${group.slug}` },
  ];

  return (
    <SimplePageTransition>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Breadcrumbs items={breadcrumbs} />

            {/* Settings button for owner */}
            {group.role === 'owner' && !group.isSystemGroup && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/groups/${group.slug}/settings`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            )}
          </div>

          {/* Group Header */}
          <div className="mb-8">
            <GroupHeader group={group} hasPendingRequest={hasPendingRequest} />
          </div>

          {/* Content */}
          {group.isMember ? (
            <div className="space-y-4">
              {/* Tab buttons */}
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'members' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('members')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Members ({members.length})
                </Button>
                {isOwnerOrAdmin && (
                  <Button
                    variant={activeTab === 'requests' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('requests')}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Requests
                    {requests.length > 0 && (
                      <span className="ml-1 bg-primary-foreground text-primary rounded-full px-2 py-0.5 text-xs">
                        {requests.length}
                      </span>
                    )}
                  </Button>
                )}
              </div>

              {/* Tab content */}
              {activeTab === 'members' ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GroupMemberList
                      groupId={group._id as Id<'groups'>}
                      members={members}
                      currentUserRole={group.role}
                      currentUserPromotedAt={currentUserMembership?.promotedAt}
                      loading={membersLoading}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Join Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <JoinRequestList
                      requests={requests}
                      loading={requestsLoading}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            /* Non-member view - just show member count */
            <Card>
              <CardHeader>
                <CardTitle>Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                  </p>
                  <p className="text-sm mt-2">
                    Join this group to see members and collaborate.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </SimplePageTransition>
  );
}

export default GroupPage;
