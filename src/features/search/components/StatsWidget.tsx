/**
 * StatsWidget component
 *
 * Displays database statistics in a minimal, inline format at the bottom of the homepage.
 */

import { useDatabaseStats } from '../hooks/useDatabaseStats';

export default function StatsWidget() {
  const { stats, loading } = useDatabaseStats();

  const songCount = loading ? '—' : stats?.songs ?? 0;
  const arrangementCount = loading ? '—' : stats?.arrangements ?? 0;

  return (
    <div className="pt-8 pb-4 mt-8 border-t border-border">
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground/70">{songCount}</span>
        <span>songs</span>
        <span className="mx-2 text-border">·</span>
        <span className="font-medium text-foreground/70">{arrangementCount}</span>
        <span>arrangements</span>
      </div>
    </div>
  );
}
