/**
 * StatsWidget component
 *
 * Displays database statistics (song count, arrangement count, setlist count)
 * on the homepage.
 */

import { useDatabaseStats } from '../hooks/useDatabaseStats';
import { Card, CardContent } from '@/components/ui/card';
import { Music, FileMusic, List } from 'lucide-react';

export default function StatsWidget() {
  const { stats, loading } = useDatabaseStats();

  return (
    <Card className="mb-8">
      <CardContent className="py-6">
        <div className="grid grid-cols-3 gap-4">
          {/* Songs Count */}
          <div className="flex flex-col items-center text-center">
            <Music className="h-8 w-8 text-primary mb-2" />
            <p className="text-2xl font-bold">
              {loading ? '-' : stats?.songs ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">Songs</p>
          </div>

          {/* Arrangements Count */}
          <div className="flex flex-col items-center text-center">
            <FileMusic className="h-8 w-8 text-primary mb-2" />
            <p className="text-2xl font-bold">
              {loading ? '-' : stats?.arrangements ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">Arrangements</p>
          </div>

          {/* Setlists Count */}
          <div className="flex flex-col items-center text-center">
            <List className="h-8 w-8 text-primary mb-2" />
            <p className="text-2xl font-bold">
              {loading ? '-' : stats?.setlists ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">Setlists</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
