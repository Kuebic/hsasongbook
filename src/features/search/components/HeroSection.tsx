import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SearchBar from './SearchBar';
import { TypeFilterChips } from './TypeFilterChips';

interface HeroSectionProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAddSongClick: () => void;
  isAuthenticated: boolean;
}

export default function HeroSection({
  searchValue,
  onSearchChange,
  onAddSongClick,
  isAuthenticated,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-secondary via-secondary/80 to-background">
      {/* Subtle geometric accent - top corner */}
      <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 opacity-[0.07]">
        <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
          <circle cx="100" cy="0" r="80" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="100" cy="0" r="60" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="100" cy="0" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Subtle geometric accent - bottom left */}
      <div className="absolute bottom-0 left-0 w-24 h-24 md:w-36 md:h-36 opacity-[0.05]">
        <svg viewBox="0 0 100 100" className="w-full h-full text-accent">
          <rect x="-20" y="60" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(-15)" />
          <rect x="-10" y="70" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="0.5" transform="rotate(-15)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl relative">
        {/* Title block with editorial styling */}
        <div className="text-center mb-8 md:mb-10">
          {/* Small decorative element above title */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-px w-8 bg-primary/30" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-medium">
              Worship Collection
            </span>
            <span className="h-px w-8 bg-primary/30" />
          </div>

          <h1 className="text-display text-foreground mb-3 tracking-tight">
            HSA Songbook
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground font-light tracking-wide">
            Worship songs for your team
          </p>
        </div>

        {/* Search section */}
        <div className="max-w-xl mx-auto mb-4">
          <SearchBar value={searchValue} onChange={onSearchChange} />
        </div>

        {/* Quick filter chips */}
        <div className="flex justify-center mb-6">
          <TypeFilterChips />
        </div>

        {/* Action area */}
        <div className="flex justify-center">
          {isAuthenticated ? (
            <Button
              onClick={onAddSongClick}
              className="group relative overflow-hidden transition-all duration-300 hover:shadow-md"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                Add Song
              </span>
            </Button>
          ) : (
            <Link
              to="/auth/signin"
              className="text-sm text-primary hover:text-primary/80 transition-colors duration-200 underline-offset-4 hover:underline flex items-center gap-1.5"
            >
              <span className="h-px w-4 bg-primary/40" />
              Sign in to add songs
              <span className="h-px w-4 bg-primary/40" />
            </Link>
          )}
        </div>
      </div>

      {/* Bottom fade transition */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
