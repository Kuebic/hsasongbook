/**
 * PlaylistQueueView Component
 *
 * Slide-up panel showing the current playlist queue.
 * Features: track list, current track highlighting, click to skip.
 */

import { useEffect, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Music, Youtube, Play, Pause, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

export default function PlaylistQueueView() {
  const {
    playlist,
    isPlaying,
    isQueueVisible,
    toggleQueueVisibility,
    skipToIndex,
    clearPlaylist,
  } = useAudioPlayer();

  const currentItemRef = useRef<HTMLButtonElement>(null);

  // Scroll to current item when queue opens or current index changes
  useEffect(() => {
    if (isQueueVisible && currentItemRef.current) {
      currentItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isQueueVisible, playlist.currentIndex]);

  // Don't render if no playlist
  if (playlist.items.length === 0) {
    return null;
  }

  return (
    <Sheet open={isQueueVisible} onOpenChange={toggleQueueVisibility}>
      <SheetContent side="bottom" className="h-[60vh] max-h-[500px]">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <span>Queue</span>
              <span className="text-sm font-normal text-muted-foreground">
                {playlist.currentIndex >= 0 ? playlist.currentIndex + 1 : 0}/{playlist.items.length}
              </span>
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearPlaylist();
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-60px)]">
          <div className="space-y-1 pr-4">
            {playlist.items.map((item, index) => {
              const isCurrent = index === playlist.currentIndex;
              const isPlayable = item.hasAudio || item.hasYoutube;

              return (
                <button
                  key={`${item.arrangementId}-${index}`}
                  ref={isCurrent ? currentItemRef : undefined}
                  onClick={() => isPlayable && skipToIndex(index)}
                  disabled={!isPlayable}
                  className={cn(
                    'w-full text-left p-3 rounded-lg transition-colors',
                    'flex items-center gap-3',
                    isCurrent
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-accent',
                    !isPlayable && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {/* Track number / playing indicator */}
                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    {isCurrent && isPlaying ? (
                      <Pause className="h-4 w-4 text-primary" />
                    ) : isCurrent ? (
                      <Play className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Track info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'font-medium truncate',
                        isCurrent && 'text-primary'
                      )}
                    >
                      {item.songTitle}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.arrangementName}
                    </p>
                  </div>

                  {/* Media type indicators */}
                  <div className="flex items-center gap-1 shrink-0">
                    {item.hasAudio && (
                      <Music className="h-4 w-4 text-primary" />
                    )}
                    {item.hasYoutube && (
                      <Youtube className="h-4 w-4 text-[#FF0000]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
