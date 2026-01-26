import { Link } from 'react-router-dom';

interface ThemeCardProps {
  theme: string;
  count: number;
}

export default function ThemeCard({ theme, count }: ThemeCardProps) {
  const capitalizedTheme = theme.charAt(0).toUpperCase() + theme.slice(1);

  return (
    <Link
      to={`/songs?themes=${encodeURIComponent(theme)}`}
      className="group block"
    >
      <div className="relative min-h-[80px] rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 ease-out group-hover:border-primary/30 group-hover:shadow-lg group-hover:-translate-y-1 group-active:scale-[0.98]">
        {/* Decorative horizontal lines - evokes sheet music staves */}
        <div className="absolute inset-0 flex flex-col justify-end pb-2 opacity-[0.04] transition-opacity duration-300 group-hover:opacity-[0.08]">
          <div className="h-px bg-foreground" />
          <div className="h-px bg-foreground mt-1.5" />
          <div className="h-px bg-foreground mt-1.5" />
        </div>

        {/* Corner accent - subtle geometric element */}
        <div className="absolute -top-3 -right-3 w-10 h-10 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:top-2 group-hover:right-2">
          <svg viewBox="0 0 40 40" className="w-full h-full text-primary/20">
            <path
              d="M0 20 L20 0 L40 20 L20 40 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-center px-5 py-4">
          {/* Theme name */}
          <h3 className="text-title text-foreground mb-1 transition-colors duration-200 group-hover:text-primary">
            {capitalizedTheme}
          </h3>

          {/* Song count with decorative dash */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-px bg-muted-foreground/50 transition-all duration-300 group-hover:w-5 group-hover:bg-primary/50" />
            <span className="text-sm text-muted-foreground">
              {count} {count === 1 ? 'song' : 'songs'}
            </span>
          </div>
        </div>

        {/* Left edge accent that appears on hover */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-primary/60 rounded-r transition-all duration-300 group-hover:h-8" />
      </div>
    </Link>
  );
}
