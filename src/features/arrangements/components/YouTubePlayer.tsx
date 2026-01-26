/**
 * YouTubePlayer Component
 *
 * Inline YouTube player that stays on the arrangement page.
 * YouTube requires a visible iframe for playback, so this cannot
 * be moved to a global player that persists across navigation.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, X, Youtube } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  extractYoutubeVideoId,
  getYoutubeEmbedUrl,
} from '../validation/audioSchemas';

interface YouTubePlayerProps {
  youtubeUrl: string;
  songTitle: string;
  arrangementName: string;
  onClose?: () => void;
}

export default function YouTubePlayer({
  youtubeUrl,
  songTitle,
  arrangementName,
  onClose,
}: YouTubePlayerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const videoId = extractYoutubeVideoId(youtubeUrl);

  if (!videoId) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed left-0 right-0 bg-card border-t shadow-lg transition-all duration-300 no-print',
        // Position above mobile nav (pb-16 = 64px)
        'bottom-16 md:bottom-0',
        // Z-index between sticky and mobile nav
        'z-[1025]'
      )}
    >
      {/* Collapsed view */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3',
          isExpanded && 'border-b'
        )}
      >
        {/* YouTube indicator */}
        <div className="h-10 w-10 rounded-full bg-[#FF0000] flex items-center justify-center">
          <Youtube className="h-5 w-5 text-white" />
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{arrangementName}</p>
          <p className="text-xs text-muted-foreground truncate">{songTitle}</p>
        </div>

        {/* Expand/Collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>

        {/* Close button */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Expanded view with YouTube iframe */}
      {isExpanded && (
        <div className="px-4 py-3">
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
            <iframe
              src={`${getYoutubeEmbedUrl(videoId)}?autoplay=0&rel=0`}
              title={`${songTitle} - ${arrangementName}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
