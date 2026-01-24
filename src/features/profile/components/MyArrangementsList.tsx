/**
 * MyArrangementsList component
 *
 * Displays a grid of arrangements that the current user has created OR is a collaborator on.
 * Used in the ProfilePage for authenticated users.
 */

import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Music } from 'lucide-react';
import ArrangementCard from '@/features/arrangements/components/ArrangementCard';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { ArrangementWithSongAndCreator } from '@/types/Arrangement.types';

export function MyArrangementsList() {
  const { user } = useAuth();
  const myArrangements = useQuery(api.arrangements.getMyArrangements);

  // Map Convex arrangements to frontend type
  const arrangements: ArrangementWithSongAndCreator[] = useMemo(() => {
    if (!myArrangements || !user) return [];
    return myArrangements
      .filter((arr) => arr.song !== null)
      .map((arr) => ({
        id: arr._id,
        slug: arr.slug,
        songId: arr.songId,
        name: arr.name,
        key: arr.key ?? '',
        tempo: arr.tempo ?? 0,
        timeSignature: arr.timeSignature ?? '4/4',
        capo: arr.capo ?? 0,
        tags: arr.tags,
        rating: arr.rating,
        favorites: arr.favorites,
        chordProContent: arr.chordProContent,
        createdAt: new Date(arr._creationTime).toISOString(),
        updatedAt: arr.updatedAt
          ? new Date(arr.updatedAt).toISOString()
          : new Date(arr._creationTime).toISOString(),
        song: {
          id: arr.song!._id,
          slug: arr.song!.slug,
          title: arr.song!.title,
          artist: arr.song!.artist ?? '',
        },
        // Creator info - for "my" arrangements, the creator is the current user
        // (this is a simplification - collaborator arrangements may have different creators)
        creator: {
          _id: user.id,
          username: user.username,
          displayName: user.displayName,
          showRealName: user.showRealName,
        },
      }));
  }, [myArrangements, user]);

  // Loading state
  if (myArrangements === undefined) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="h-48">
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="space-y-2 mt-4">
                <Skeleton className="h-8 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
  if (arrangements.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            You haven't created any arrangements yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
      {arrangements.map((arrangement) => (
        <ArrangementCard
          key={arrangement.id}
          arrangement={arrangement}
          isOwner={true}
          isAuthenticated={true}
        />
      ))}
    </div>
  );
}

export default MyArrangementsList;
