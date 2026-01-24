import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music, User, Hash } from 'lucide-react';
import { EmptyState } from '@/features/shared';
import type { Song } from '@/types';

interface SongListProps {
  songs: Song[];
}

export default function SongList({ songs }: SongListProps) {
  // Get arrangement counts per song (server-side aggregation, minimal data transfer)
  const arrangementCounts = useQuery(api.arrangements.getCountsBySong) ?? {};

  if (!songs || songs.length === 0) {
    return (
      <EmptyState
        icon={Music}
        title="No songs found"
        description="Try adjusting your search terms"
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {songs.map((song: Song) => {
        const arrangementCount = arrangementCounts[song.id] || 0;

        return (
          <Link
            key={song.id}
            to={`/song/${song.slug}`}
            className="block transition-transform hover:scale-[1.02]"
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-1">{song.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <User className="h-3 w-3" />
                  {song.artist}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {arrangementCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {arrangementCount} {arrangementCount === 1 ? 'arrangement' : 'arrangements'}
                    </Badge>
                  )}
                  {song.themes?.slice(0, 2).map((theme: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs capitalize">
                      <Hash className="h-3 w-3 mr-1" />
                      {theme}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
