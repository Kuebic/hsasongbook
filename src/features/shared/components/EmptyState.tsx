/**
 * EmptyState Component
 *
 * A reusable empty state for lists and search results.
 * Shows an icon, title, and description when no content is available.
 */

import { type LucideIcon, FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  className?: string;
}

export default function EmptyState({
  icon: Icon = FileQuestion,
  title = 'No results found',
  description = 'Try adjusting your search or filters',
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <Icon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
