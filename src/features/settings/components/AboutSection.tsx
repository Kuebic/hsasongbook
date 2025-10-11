/**
 * AboutSection Component
 *
 * Settings section displaying app information and database statistics.
 * Shows song counts, arrangement counts, setlist counts, and app version.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDatabaseStats, type DatabaseStats } from '@/features/pwa/db/database';
import logger from '@/lib/logger';

/**
 * About Settings Section
 *
 * Displays app metadata and database statistics.
 *
 * Features:
 * - Song, arrangement, and setlist counts from IndexedDB
 * - App version
 * - Async data loading with loading states
 * - Error handling for database access
 *
 * Usage:
 * ```tsx
 * // In SettingsPage:
 * <AboutSection />
 * ```
 */
export default function AboutSection() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getDatabaseStats();
        setStats(data);
      } catch (error) {
        logger.error('Failed to load database stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Songs</p>
            <p className="text-lg font-semibold">
              {loading ? '...' : stats?.songs ?? '-'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Arrangements</p>
            <p className="text-lg font-semibold">
              {loading ? '...' : stats?.arrangements ?? '-'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Setlists</p>
            <p className="text-lg font-semibold">
              {loading ? '...' : stats?.setlists ?? '-'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Version</p>
            <p className="text-lg font-semibold">0.0.0</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
