/**
 * PerformanceControls Component
 *
 * Control toolbar for performance mode with navigation and fullscreen controls.
 * Features: Previous/Next, Fullscreen toggle, Exit button.
 */

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from 'lucide-react';

interface PerformanceControlsProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onExit: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
}

export default function PerformanceControls({
  isFullscreen,
  onToggleFullscreen,
  onExit,
  canGoNext,
  canGoPrevious,
  onNext,
  onPrevious
}: PerformanceControlsProps) {
  return (
    <div
      className="performance-controls flex items-center gap-2 p-4 bg-background border-b"
      role="toolbar"
      aria-label="Performance controls"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        aria-label="Previous arrangement"
        type="button"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Next arrangement"
        type="button"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleFullscreen}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        type="button"
      >
        {isFullscreen ? (
          <Minimize2 className="h-6 w-6" />
        ) : (
          <Maximize2 className="h-6 w-6" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onExit}
        aria-label="Exit performance mode"
        type="button"
      >
        <X className="h-6 w-6" />
      </Button>
    </div>
  );
}
