/**
 * PerformanceLayout Component
 *
 * Mobile-optimized layout for performance mode with:
 * - Large tap zones (20% left/right) for one-handed navigation
 * - Floating progress pill
 * - Unobtrusive exit button
 * - Maximized content area
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProgressPill from './ProgressPill';

interface PerformanceLayoutProps {
  children: React.ReactNode;
  currentIndex: number;
  total: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onExit: () => void;
}

export default function PerformanceLayout({
  children,
  currentIndex,
  total,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  onExit
}: PerformanceLayoutProps) {
  return (
    <div className="performance-layout relative h-screen overflow-hidden">
      {/* Exit button - top right, fixed */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onExit}
        className="fixed top-4 right-4 z-50 bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm"
        aria-label="Exit performance mode"
        type="button"
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Progress pill - top center, fixed */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
        <ProgressPill current={currentIndex + 1} total={total} />
      </div>

      {/* Main content with tap zones */}
      <div className="flex h-full">
        {/* Left tap zone - 20% width */}
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={cn(
            'w-[20%] flex-shrink-0 flex items-center justify-start p-2',
            'transition-opacity',
            canGoPrevious ? 'cursor-pointer' : 'cursor-default opacity-30'
          )}
          aria-label="Previous song"
          type="button"
        >
          <ChevronLeft
            className={cn(
              'h-8 w-8 text-foreground/30',
              'transition-opacity',
              canGoPrevious && 'hover:text-foreground/60 active:text-foreground/80'
            )}
          />
        </button>

        {/* Content area - 60% width, scrollable */}
        <div className="w-[60%] flex-shrink-0 overflow-y-auto pt-16 pb-8">
          {children}
        </div>

        {/* Right tap zone - 20% width */}
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={cn(
            'w-[20%] flex-shrink-0 flex items-center justify-end p-2',
            'transition-opacity',
            canGoNext ? 'cursor-pointer' : 'cursor-default opacity-30'
          )}
          aria-label="Next song"
          type="button"
        >
          <ChevronRight
            className={cn(
              'h-8 w-8 text-foreground/30',
              'transition-opacity',
              canGoNext && 'hover:text-foreground/60 active:text-foreground/80'
            )}
          />
        </button>
      </div>
    </div>
  );
}
