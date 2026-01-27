/**
 * SetlistCard component
 *
 * Presentational card for displaying setlist information.
 * Pattern: src/features/arrangements/components/ArrangementCard.tsx
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ListMusic, Calendar, Music2 } from 'lucide-react';
import { formatSetlistDate } from '../../shared/utils/dateFormatter';
import SetlistPrivacyBadge from './SetlistPrivacyBadge';
import SetlistFavoriteButton from './SetlistFavoriteButton';
import SetlistSharedBadge from './SetlistSharedBadge';
import type { Setlist } from '@/types';

interface SetlistCardProps {
  setlist: Setlist;
  isOwner?: boolean;
  canEdit?: boolean;
  showPrivacyBadge?: boolean;
}

function SetlistCard({
  setlist,
  isOwner = true,
  canEdit = false,
  showPrivacyBadge = true
}: SetlistCardProps) {
  const navigate = useNavigate();

  const handleViewSetlist = (): void => {
    navigate(`/setlist/${setlist.id}`);
  };

  const songCount = setlist.songs?.length || 0;
  const visibleTags = setlist.tags?.slice(0, 3) ?? [];
  const remainingTags = (setlist.tags?.length ?? 0) - 3;

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-200 hover:scale-[1.01] hover:-translate-y-1 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2 font-semibold">
              <span>{setlist.name}</span>
            </CardTitle>

            {/* Badges row */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {showPrivacyBadge && isOwner && (
                <SetlistPrivacyBadge
                  privacyLevel={setlist.privacyLevel}
                  className="text-xs"
                />
              )}
              {!isOwner && (
                <SetlistSharedBadge
                  isOwner={isOwner}
                  canEdit={canEdit}
                  className="text-xs"
                />
              )}
            </div>
          </div>

          {/* Favorite button */}
          <SetlistFavoriteButton
            setlistId={setlist.id}
            favoriteCount={setlist.favorites ?? 0}
            variant="ghost"
            size="sm"
            showCount={true}
          />
        </div>

        {setlist.description && (
          <CardDescription className="mt-2 line-clamp-2">
            {setlist.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between pt-0">
        <div className="space-y-3">
          {/* Tags */}
          {visibleTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {visibleTags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {remainingTags > 0 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  +{remainingTags}
                </Badge>
              )}
            </div>
          )}

          {/* Performance date */}
          {setlist.performanceDate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 opacity-70" />
              <span className="text-sm">{formatSetlistDate(setlist.performanceDate)}</span>
            </div>
          )}

          {/* Song count and metadata */}
          <div className="flex items-center gap-3 py-2 px-3 bg-muted/30 rounded-md">
            <div className="flex items-center gap-2">
              <Music2 className="h-4 w-4 opacity-70" />
              <span className="text-sm font-medium">
                {songCount} {songCount === 1 ? 'song' : 'songs'}
              </span>
            </div>
            {setlist.estimatedDuration && (
              <span className="text-sm text-muted-foreground">
                ~{setlist.estimatedDuration} min
              </span>
            )}
            {setlist.difficulty && (
              <Badge variant="secondary" className="text-xs capitalize">
                {setlist.difficulty}
              </Badge>
            )}
          </div>

          {/* Last updated */}
          <div className="text-xs text-muted-foreground">
            Updated {formatSetlistDate(setlist.updatedAt)}
          </div>
        </div>

        {/* Action button */}
        <Button
          onClick={handleViewSetlist}
          className="w-full mt-4 group-hover:bg-primary/90 transition-colors"
          variant="default"
        >
          <ListMusic className="h-4 w-4 mr-2" />
          View Setlist
        </Button>
      </CardContent>
    </Card>
  );
}

export default memo(SetlistCard);
