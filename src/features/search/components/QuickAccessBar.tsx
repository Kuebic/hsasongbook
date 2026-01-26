import { Link } from 'react-router-dom';
import { Heart, Clock, ListMusic, TrendingUp, type LucideIcon } from 'lucide-react';

interface QuickAccessItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  requiresAuth?: boolean;
  accentPosition?: 'tl' | 'tr' | 'bl' | 'br';
}

const quickAccessItems: QuickAccessItem[] = [
  {
    id: 'favorites',
    label: 'Favorites',
    icon: Heart,
    href: '/songs?favorites=true',
    requiresAuth: true,
    accentPosition: 'tr',
  },
  {
    id: 'recent',
    label: 'Recent',
    icon: Clock,
    href: '/songs?sort=newest',
    accentPosition: 'bl',
  },
  {
    id: 'setlists',
    label: 'Setlists',
    icon: ListMusic,
    href: '/setlists',
    requiresAuth: true,
    accentPosition: 'tr',
  },
  {
    id: 'popular',
    label: 'Popular',
    icon: TrendingUp,
    href: '/songs?sort=popular',
    accentPosition: 'bl',
  },
];

interface QuickAccessBarProps {
  isAuthenticated: boolean;
}

export default function QuickAccessBar({ isAuthenticated }: QuickAccessBarProps) {
  const visibleItems = quickAccessItems.filter(
    (item) => !item.requiresAuth || isAuthenticated
  );

  return (
    <section className="mb-10">
      {/* Section header with editorial styling */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Quick Access
        </h2>
        <span className="flex-1 h-px bg-border" />
      </div>

      {/* Scrollable container */}
      <div className="relative -mx-4 px-4">
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2">
          {visibleItems.map((item, index) => (
            <QuickAccessCard
              key={item.id}
              item={item}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface QuickAccessCardProps {
  item: QuickAccessItem;
  index: number;
}

function QuickAccessCard({ item, index }: QuickAccessCardProps) {
  const Icon = item.icon;

  return (
    <Link
      to={item.href}
      className="group relative flex-shrink-0 snap-start animate-in fade-in-0 slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
    >
      <div className="relative w-[140px] h-[88px] rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 ease-out group-hover:border-primary/30 group-hover:shadow-md group-hover:-translate-y-0.5 group-active:scale-[0.98]">
        {/* Subtle corner accent */}
        <div
          className={`absolute w-12 h-12 opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.12] ${
            item.accentPosition === 'tr' ? '-top-4 -right-4' :
            item.accentPosition === 'bl' ? '-bottom-4 -left-4' :
            item.accentPosition === 'tl' ? '-top-4 -left-4' :
            '-bottom-4 -right-4'
          }`}
        >
          <svg viewBox="0 0 48 48" className="w-full h-full text-primary">
            <circle cx="24" cy="24" r="20" fill="currentColor" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center p-4">
          {/* Icon container with subtle background */}
          <div className="relative mb-2">
            <div className="absolute inset-0 rounded-lg bg-primary/5 scale-150 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100" />
            <Icon className="relative h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
          </div>

          {/* Label */}
          <span className="text-sm font-medium text-foreground/80 transition-colors duration-200 group-hover:text-foreground">
            {item.label}
          </span>
        </div>

        {/* Bottom accent line that appears on hover */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary/40 transition-all duration-300 group-hover:w-8" />
      </div>
    </Link>
  );
}
