/**
 * SongCardEnhanced Component
 *
 * Enhanced song card showing arrangement summary for the browse page.
 * Displays: title, artist, arrangement count, available keys, difficulty range, and favorites.
 */

import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music } from 'lucide-react';
import FavoriteButton from '@/features/shared/components/FavoriteButton';
import type { SongWithSummary } from '@/types';
import { DIFFICULTY_OPTIONS } from '../utils/filterConstants';

interface SongCardEnhancedProps {
  song: SongWithSummary;
}

export default function SongCardEnhanced({ song }: SongCardEnhancedProps) {
  const { arrangementSummary } = song;

  // Format difficulty range display
  const difficultyDisplay = formatDifficultyRange(arrangementSummary.difficulties);

  // Format keys display (show first 3)
  const keysDisplay = arrangementSummary.keys.slice(0, 3);
  const hasMoreKeys = arrangementSummary.keys.length > 3;

  return (
    <Link to={`/song/${song.slug}`}>
      <Card className="h-full transition-all hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5">
        <CardContent className="p-4">
          {/* Title and Artist */}
          <h3 className="font-semibold text-base line-clamp-1 mb-1">{song.title}</h3>
          {song.artist && (
            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{song.artist}</p>
          )}

          {/* Arrangement Summary Line */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Music className="h-3 w-3" />
              {arrangementSummary.count} {arrangementSummary.count === 1 ? 'arrangement' : 'arrangements'}
            </span>

            {keysDisplay.length > 0 && (
              <>
                <span>•</span>
                <span>
                  Keys: {keysDisplay.join(', ')}
                  {hasMoreKeys && '...'}
                </span>
              </>
            )}

            {difficultyDisplay && (
              <>
                <span>•</span>
                <span className="font-mono">{difficultyDisplay}</span>
              </>
            )}
          </div>

          {/* Favorite Button */}
          <div className="flex items-center justify-between mb-3">
            <FavoriteButton
              targetType="song"
              targetId={song.id}
              count={song.favorites || 0}
              size="sm"
            />
          </div>

          {/* Theme Badges */}
          {song.themes && song.themes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {song.themes.slice(0, 2).map((theme) => (
                <Badge key={theme} variant="secondary" className="text-xs">
                  {theme}
                </Badge>
              ))}
              {song.themes.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{song.themes.length - 2}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Format difficulty range for display
 * Returns e.g., "●○○ to ●●●" for range, or "●●○" for single
 */
function formatDifficultyRange(
  difficulties: Array<'simple' | 'standard' | 'advanced'>
): string | null {
  if (difficulties.length === 0) return null;

  const order = ['simple', 'standard', 'advanced'] as const;
  const sorted = [...difficulties].sort(
    (a, b) => order.indexOf(a) - order.indexOf(b)
  );

  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  if (min === max) {
    return DIFFICULTY_OPTIONS[min].dots;
  }

  return `${DIFFICULTY_OPTIONS[min].dots} to ${DIFFICULTY_OPTIONS[max].dots}`;
}
