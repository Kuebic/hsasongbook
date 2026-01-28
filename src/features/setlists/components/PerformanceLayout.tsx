/**
 * PerformanceLayout Component
 *
 * Responsive layout for performance mode:
 *
 * Mobile (< 768px):
 * - Full-width content area for maximum readability
 * - Overlay navigation buttons on left/right edges (64px wide)
 * - Fixed progress pill and exit button
 *
 * Desktop (≥ 768px):
 * - Large tap zones (20% left/right) for one-handed navigation
 * - 60% content area in center
 * - Fixed progress pill and exit button
 */

import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProgressPill from './ProgressPill';

interface PerformanceLayoutProps {
  children: React.ReactNode;
  currentIndex: number;
  total: number;
  songTitle?: string;
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
  songTitle,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  onExit
}: PerformanceLayoutProps) {
  const mobileContentRef = useRef<HTMLDivElement>(null);
  const desktopContentRef = useRef<HTMLDivElement>(null);

  // Reset scroll to top whenever song changes
  useEffect(() => {
    mobileContentRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    desktopContentRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentIndex]);

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

      {/* Mobile overlay navigation buttons - shown on < md breakpoint */}
      <div className="md:hidden">
        {/* Left navigation overlay */}
        <div className="fixed inset-y-0 left-0 z-30 w-16 flex items-center justify-center pointer-events-none">
          <button
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className={cn(
              'pointer-events-auto p-2 rounded-full',
              'bg-black/40 hover:bg-black/60 backdrop-blur-sm',
              'transition-opacity',
              canGoPrevious ? 'cursor-pointer' : 'cursor-default opacity-30'
            )}
            aria-label="Previous song"
            type="button"
          >
            <ChevronLeft
              className={cn(
                'h-8 w-8 text-white',
                'transition-opacity',
                canGoPrevious && 'hover:text-white/80 active:text-white/100'
              )}
            />
          </button>
        </div>

        {/* Right navigation overlay */}
        <div className="fixed inset-y-0 right-0 z-30 w-16 flex items-center justify-center pointer-events-none">
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className={cn(
              'pointer-events-auto p-2 rounded-full',
              'bg-black/40 hover:bg-black/60 backdrop-blur-sm',
              'transition-opacity',
              canGoNext ? 'cursor-pointer' : 'cursor-default opacity-30'
            )}
            aria-label="Next song"
            type="button"
          >
            <ChevronRight
              className={cn(
                'h-8 w-8 text-white',
                'transition-opacity',
                canGoNext && 'hover:text-white/80 active:text-white/100'
              )}
            />
          </button>
        </div>
      </div>

      {/* Mobile content area - full width, no horizontal padding for maximum space */}
      <div ref={mobileContentRef} className="md:hidden w-full h-full overflow-y-auto pb-8">
        {/* Header bar - aligned with content */}
        <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-4 pr-14">
          {songTitle && (
            <div className="bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm shadow-lg truncate max-w-[70%]">
              {songTitle}
            </div>
          )}
          <div className={songTitle ? '' : 'ml-auto'}>
            <ProgressPill current={currentIndex + 1} total={total} />
          </div>
        </div>
        {children}
      </div>

      {/* Desktop tap zone layout - shown on ≥ md breakpoint */}
      <div className="hidden md:flex h-full">
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
        <div ref={desktopContentRef} className="w-[60%] flex-shrink-0 overflow-y-auto pb-8">
          {/* Header bar - aligned with content */}
          <div className="sticky top-0 z-40 flex items-center justify-between py-4 pr-14">
            {songTitle && (
              <div className="bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm shadow-lg truncate max-w-[70%]">
                {songTitle}
              </div>
            )}
            <div className={songTitle ? '' : 'ml-auto'}>
              <ProgressPill current={currentIndex + 1} total={total} />
            </div>
          </div>
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
