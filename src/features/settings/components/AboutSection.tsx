/**
 * AboutSection Component
 *
 * Settings section displaying app information and user statistics.
 * Shows song counts, arrangement counts, setlist counts, and app version.
 */

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * About Settings Section
 *
 * Displays app metadata and user statistics from Convex.
 *
 * Features:
 * - Song, arrangement, and setlist counts created by current user
 * - App version
 * - Real-time updates via Convex queries
 *
 * Usage:
 * ```tsx
 * // In SettingsPage:
 * <AboutSection />
 * ```
 */
export default function AboutSection() {
  const stats = useQuery(api.users.getUserStats);

  // stats is undefined while loading, null if not authenticated
  const loading = stats === undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Your Songs</p>
            <p className="text-lg font-semibold">
              {loading ? '...' : stats?.songs ?? '-'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Your Arrangements</p>
            <p className="text-lg font-semibold">
              {loading ? '...' : stats?.arrangements ?? '-'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Your Setlists</p>
            <p className="text-lg font-semibold">
              {loading ? '...' : stats?.setlists ?? '-'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Version</p>
            <p className="text-lg font-semibold">0.1.0</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
