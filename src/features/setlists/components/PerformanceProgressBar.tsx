/**
 * PerformanceProgressBar Component
 *
 * Progress indicator showing current position in setlist.
 * Features: Text indicator, visual progress bar, clickable dots for navigation.
 */

import { cn } from '@/lib/utils';

interface PerformanceProgressBarProps {
  currentIndex: number;
  total: number;
  onNavigate?: (index: number) => void;
}

export default function PerformanceProgressBar({
  currentIndex,
  total,
  onNavigate
}: PerformanceProgressBarProps) {
  const percentage = total > 1 ? (currentIndex / (total - 1)) * 100 : 0;

  return (
    <div className="performance-progress p-4 bg-muted/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">
          {currentIndex + 1} of {total}
        </span>
      </div>

      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {onNavigate && total > 1 && (
        <div className="flex gap-1 mt-2">
          {Array.from({ length: total }).map((_, index) => (
            <button
              key={index}
              onClick={() => onNavigate(index)}
              className={cn(
                'flex-1 h-1 rounded-full transition-colors',
                index === currentIndex ? 'bg-primary' : 'bg-muted'
              )}
              aria-label={`Go to arrangement ${index + 1}`}
              type="button"
            />
          ))}
        </div>
      )}
    </div>
  );
}
