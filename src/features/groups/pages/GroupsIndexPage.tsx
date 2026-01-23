/**
 * GroupsIndexPage Component
 * Phase 2: Groups - Browse and discover groups
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGroupsList, useUserGroups } from '../hooks/useGroupData';
import { useAuth } from '@/features/auth/hooks/useAuth';
import GroupCard from '../components/GroupCard';
import CreateGroupDialog from '../components/CreateGroupDialog';
import Breadcrumbs from '@/features/shared/components/Breadcrumbs';
import { PageSpinner } from '@/features/shared/components/LoadingStates';
import { SimplePageTransition } from '@/features/shared/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Users, LogIn } from 'lucide-react';

export function GroupsIndexPage() {
  const { user } = useAuth();
  const isAuthenticated = user && !user.isAnonymous;
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  const { groups: allGroups, loading: loadingAll } = useGroupsList();
  const { groups: userGroups, loading: loadingUser } = useUserGroups();

  const loading = loadingAll || (isAuthenticated && loadingUser);

  if (loading) {
    return <PageSpinner message="Loading groups..." />;
  }

  const breadcrumbs = [
    { label: 'Groups', path: '/groups' },
  ];

  return (
    <SimplePageTransition>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Navigation */}
          <div className="mb-6">
            <Breadcrumbs items={breadcrumbs} />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Groups</h1>
              <p className="text-muted-foreground">
                Join groups to collaborate on songs and arrangements
              </p>
            </div>

            {isAuthenticated ? (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link to="/auth/signin">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign in
                </Link>
              </Button>
            )}
          </div>

          {/* Tab buttons for authenticated users */}
          {isAuthenticated && (
            <div className="flex gap-2 mb-4">
              <Button
                variant={activeTab === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('all')}
              >
                All Groups
              </Button>
              <Button
                variant={activeTab === 'my' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('my')}
              >
                My Groups ({userGroups.length})
              </Button>
            </div>
          )}

          {/* Content based on active tab */}
          {isAuthenticated ? (
            <div className="space-y-3">
              {activeTab === 'all' ? (
                allGroups.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        No groups yet. Be the first to create one!
                      </p>
                      <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Group
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  allGroups.map((group) => (
                    <GroupCard key={group._id} group={group} />
                  ))
                )
              ) : userGroups.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      You haven't joined any groups yet.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Browse groups above or create your own!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                userGroups.map((group) => (
                  <GroupCard key={group._id} group={group} />
                ))
              )}
            </div>
          ) : (
            /* All groups for unauthenticated users */
            <div className="space-y-3">
              {allGroups.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No groups yet.</p>
                  </CardContent>
                </Card>
              ) : (
                allGroups.map((group) => (
                  <GroupCard key={group._id} group={group} />
                ))
              )}
            </div>
          )}

          {/* Create Group Dialog */}
          <CreateGroupDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
          />
        </div>
      </div>
    </SimplePageTransition>
  );
}

export default GroupsIndexPage;
