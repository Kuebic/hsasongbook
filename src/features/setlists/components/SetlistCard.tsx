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
import { ListMusic, Calendar, Music2 } from 'lucide-react';
import type { Setlist } from '@/types';

interface SetlistCardProps {
  setlist: Setlist;
}

function SetlistCard({ setlist }: SetlistCardProps) {
  const navigate = useNavigate();

  const handleViewSetlist = (): void => {
    navigate(`/setlist/${setlist.id}`);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'No date set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const songCount = setlist.songs?.length || 0;

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-200 hover:scale-[1.01] hover:-translate-y-1 group">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg line-clamp-2 font-semibold">
          <span>{setlist.name}</span>
        </CardTitle>
        {setlist.description && (
          <CardDescription className="mt-2 line-clamp-2">
            {setlist.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between pt-0">
        <div className="space-y-3">
          {/* Performance date */}
          {setlist.performanceDate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 opacity-70" />
              <span className="text-sm">{formatDate(setlist.performanceDate)}</span>
            </div>
          )}

          {/* Song count */}
          <div className="flex items-center gap-2 py-2 px-3 bg-muted/30 rounded-md">
            <Music2 className="h-4 w-4 opacity-70" />
            <span className="text-sm font-medium">
              {songCount} {songCount === 1 ? 'song' : 'songs'}
            </span>
          </div>

          {/* Last updated */}
          <div className="text-xs text-muted-foreground">
            Updated {formatDate(setlist.updatedAt)}
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
