/**
 * SectionHeader Component
 *
 * Reusable header for search page sections with title and "View all" link.
 */

import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  viewAllLink: string;
}

export default function SectionHeader({ title, viewAllLink }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-headline text-foreground">{title}</h2>
      <Link
        to={viewAllLink}
        className="group flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
      >
        <span>View all</span>
        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
