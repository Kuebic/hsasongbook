/**
 * MyFavoritesList component
 *
 * Displays the current user's favorited songs and arrangements in a tabbed interface.
 * Used in the ProfilePage for authenticated users.
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Music } from 'lucide-react';
import ArrangementCard from '@/features/arrangements/components/ArrangementCard';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { ArrangementWithSongAndCreator } from '@/types/Arrangement.types';

type TabType = 'songs' | 'arrangements';

export function MyFavoritesList() {
  const [activeTab, setActiveTab] = useState<TabType>('songs');
  const { user } = useAuth();

  const favoriteSongs = useQuery(api.favorites.getUserFavoriteSongs);
  const favoriteArrangements = useQuery(api.favorites.getUserFavoriteArrangements);

  // Map Convex arrangements to frontend type
  const arrangements: ArrangementWithSongAndCreator[] = useMemo(() => {
    if (!favoriteArrangements || !user) return [];
    return favoriteArrangements.map((arr) => ({
      id: arr._id,
      slug: arr.slug,
      songId: arr.songId,
      name: arr.name,
      key: arr.key ?? '',
      tempo: arr.tempo ?? 0,
      timeSignature: arr.timeSignature ?? '4/4',
      capo: arr.capo ?? 0,
      tags: arr.tags,
      favorites: arr.favorites,
      chordProContent: arr.chordProContent,
      createdAt: new Date(arr._creationTime).toISOString(),
      updatedAt: arr.updatedAt
        ? new Date(arr.updatedAt).toISOString()
        : new Date(arr._creationTime).toISOString(),
      song: {
        id: arr.song._id,
        slug: arr.song.slug,
        title: arr.song.title,
        artist: arr.song.artist ?? '',
      },
      creator: arr.creator
        ? {
            _id: arr.creator._id,
            username: arr.creator.username,
            displayName: arr.creator.displayName,
          }
        : undefined,
    }));
  }, [favoriteArrangements, user]);

  const isLoading =
    (activeTab === 'songs' && favoriteSongs === undefined) ||
    (activeTab === 'arrangements' && favoriteArrangements === undefined);

  const songsCount = favoriteSongs?.length ?? 0;
  const arrangementsCount = favoriteArrangements?.length ?? 0;

  return (
    <div className="space-y-4">
      {/* Tab Buttons */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'songs' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('songs')}
          className="flex-1 sm:flex-none"
        >
          Songs {songsCount > 0 && `(${songsCount})`}
        </Button>
        <Button
          variant={activeTab === 'arrangements' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('arrangements')}
          className="flex-1 sm:flex-none"
        >
          Arrangements {arrangementsCount > 0 && `(${arrangementsCount})`}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="h-32">
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Songs Tab */}
      {!isLoading && activeTab === 'songs' && (
        <>
          {favoriteSongs && favoriteSongs.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {favoriteSongs.map((song) => (
                <Link key={song._id} to={`/song/${song.slug}`}>
                  <Card className="h-full transition-all hover:shadow-md hover:scale-[1.01]">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-base line-clamp-1 mb-1">
                        {song.title}
                      </h3>
                      {song.artist && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                          {song.artist}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Music className="h-3 w-3" />
                        <span>
                          {song.arrangementCount || 0}{' '}
                          {(song.arrangementCount || 0) === 1
                            ? 'arrangement'
                            : 'arrangements'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState type="songs" />
          )}
        </>
      )}

      {/* Arrangements Tab */}
      {!isLoading && activeTab === 'arrangements' && (
        <>
          {arrangements.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {arrangements.map((arrangement) => (
                <ArrangementCard
                  key={arrangement.id}
                  arrangement={arrangement}
                  isOwner={arrangement.creator?._id === user?.id}
                  isAuthenticated={true}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="arrangements" />
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ type }: { type: 'songs' | 'arrangements' }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          {type === 'songs'
            ? "You haven't favorited any songs yet."
            : "You haven't favorited any arrangements yet."}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Tap the heart icon on {type} to add them to your favorites.
        </p>
      </CardContent>
    </Card>
  );
}

export default MyFavoritesList;
