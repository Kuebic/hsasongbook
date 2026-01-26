import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import ThemeCard from './ThemeCard';
import SectionHeader from './SectionHeader';

interface BrowseByThemeProps {
  limit?: number;
}

export default function BrowseByTheme({ limit = 6 }: BrowseByThemeProps) {
  const themes = useQuery(api.songs.getThemesWithCounts, { limit });
  const isLoading = themes === undefined;

  // Don't render if no themes available
  if (!isLoading && (!themes || themes.length === 0)) {
    return null;
  }

  return (
    <section className="mb-12">
      <SectionHeader title="Browse by Theme" viewAllLink="/songs" />

      {/* Theme cards grid */}
      {isLoading ? (
        <BrowseByThemeSkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {themes.map((item, index) => (
            <div
              key={item.theme}
              className="animate-in fade-in-0 slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
            >
              <ThemeCard theme={item.theme} count={item.count} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function BrowseByThemeSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="min-h-[80px] rounded-xl border border-border bg-card p-5"
        >
          <Skeleton className="h-5 w-2/3 mb-2" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-px w-3" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
