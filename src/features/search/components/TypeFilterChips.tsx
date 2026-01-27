/**
 * TypeFilterChips Component
 *
 * Simple filter chips for Traditional/Modern/Original song types.
 * Clicking a chip navigates to the browse page with the origin filter applied.
 */

import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Music, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TypeFilterChipsProps {
  className?: string;
}

const typeFilters = [
  {
    label: 'Traditional',
    origin: 'traditional-holy-songs',
    icon: BookOpen,
    description: 'Classic hymns and holy songs',
  },
  {
    label: 'Modern',
    origin: 'new-holy-songs',
    icon: Music,
    description: 'Contemporary worship songs',
  },
  {
    label: 'Original',
    origin: 'original',
    icon: Sparkles,
    description: 'Community compositions',
  },
];

export function TypeFilterChips({ className }: TypeFilterChipsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {typeFilters.map((filter) => {
        const Icon = filter.icon;
        return (
          <Link
            key={filter.origin}
            to={`/songs?origin=${encodeURIComponent(filter.origin)}`}
            title={filter.description}
          >
            <Badge
              variant="outline"
              className={cn(
                'px-3 py-1.5 text-sm font-medium cursor-pointer transition-all duration-200',
                'hover:bg-secondary hover:border-primary/40',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'flex items-center gap-1.5'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {filter.label}
            </Badge>
          </Link>
        );
      })}
    </div>
  );
}

export default TypeFilterChips;
