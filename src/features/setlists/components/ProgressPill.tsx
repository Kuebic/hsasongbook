/**
 * ProgressPill Component
 *
 * Minimalist progress indicator for performance mode.
 * Shows "X / Y" in a small, semi-transparent floating pill.
 */

import { cn } from '@/lib/utils';

interface ProgressPillProps {
  current: number;
  total: number;
  className?: string;
}

export default function ProgressPill({
  current,
  total,
  className
}: ProgressPillProps) {
  return (
    <div
      className={cn(
        'bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium',
        'backdrop-blur-sm shadow-lg',
        'pointer-events-auto',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`Song ${current} of ${total}`}
    >
      {current} / {total}
    </div>
  );
}
