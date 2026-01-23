/**
 * GroupSettingsPage Component
 * Phase 2: Groups - Group settings page (owner only)
 */

import { useParams, Link, Navigate } from 'react-router-dom';
import { useGroupData } from '../hooks/useGroupData';
import GroupSettingsForm from '../components/GroupSettingsForm';
import Breadcrumbs from '@/features/shared/components/Breadcrumbs';
import { PageSpinner } from '@/features/shared/components/LoadingStates';
import { SimplePageTransition } from '@/features/shared/components/PageTransition';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';

export function GroupSettingsPage() {
  const { groupSlug } = useParams();
  const { group, loading, error } = useGroupData(groupSlug);

  if (loading) {
    return <PageSpinner message="Loading settings..." />;
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

  // Only owner can access settings
  if (group.role !== 'owner') {
    return <Navigate to={`/groups/${group.slug}`} replace />;
  }

  const breadcrumbs = [
    { label: 'Groups', path: '/groups' },
    { label: group.name, path: `/groups/${group.slug}` },
    { label: 'Settings', path: `/groups/${group.slug}/settings` },
  ];

  return (
    <SimplePageTransition>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Navigation */}
          <div className="mb-6">
            <Breadcrumbs items={breadcrumbs} />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{group.name} Settings</h1>
            <p className="text-muted-foreground">
              Manage your group settings and preferences
            </p>
          </div>

          {/* Settings Form */}
          <GroupSettingsForm group={group} />
        </div>
      </div>
    </SimplePageTransition>
  );
}

export default GroupSettingsPage;
