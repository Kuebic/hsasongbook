import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import SongMetadata from '../components/SongMetadata';
import ArrangementList from '../../arrangements/components/ArrangementList';
import Breadcrumbs from '../../shared/components/Breadcrumbs';
import { PageSpinner } from '../../shared/components/LoadingStates';
import { SimplePageTransition } from '../../shared/components/PageTransition';
import { useNavigation } from '../../shared/hooks/useNavigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import AddArrangementDialog from '@/features/arrangements/components/AddArrangementDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Music, Plus } from 'lucide-react';
import type { Song } from '@/types/Song.types';
import type { Arrangement } from '@/types/Arrangement.types';

export function SongPage() {
  const { songSlug } = useParams();
  const navigate = useNavigate();
  const { breadcrumbs } = useNavigation();
  const [addArrangementDialogOpen, setAddArrangementDialogOpen] = useState(false);
  const { user } = useAuth();
  const isAuthenticated = user && !user.isAnonymous;

  // Get song by slug from Convex
  const convexSong = useQuery(
    api.songs.getBySlug,
    songSlug ? { slug: songSlug } : 'skip'
  );

  // Get arrangements for this song
  const convexArrangements = useQuery(
    api.arrangements.getBySong,
    convexSong?._id ? { songId: convexSong._id } : 'skip'
  );

  // Map Convex song to frontend Song type
  const song: Song | null = useMemo(() => {
    if (!convexSong) return null;
    return {
      id: convexSong._id,
      slug: convexSong.slug,
      title: convexSong.title,
      artist: convexSong.artist ?? '',
      themes: convexSong.themes,
      copyright: convexSong.copyright,
      lyrics: convexSong.lyrics ? { en: convexSong.lyrics } : undefined,
      createdAt: new Date(convexSong._creationTime).toISOString(),
      updatedAt: new Date(convexSong._creationTime).toISOString(),
    };
  }, [convexSong]);

  // Map Convex arrangements to frontend Arrangement type
  const arrangements: Arrangement[] = useMemo(() => {
    if (!convexArrangements) return [];
    return convexArrangements.map((arr) => ({
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
    }));
  }, [convexArrangements]);

  // Loading states
  const isLoadingSong = songSlug !== undefined && convexSong === undefined;
  const isLoadingArrangements = convexSong?._id && convexArrangements === undefined;
  const isLoading = isLoadingSong || isLoadingArrangements;

  // Loading state
  if (isLoading) {
    return <PageSpinner message="Loading song details..." />;
  }

  // Error state (song not found)
  if (!song) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Song not found
              </h2>
              <p className="text-muted-foreground text-sm">
                The song you're looking for doesn't exist or couldn't be loaded
              </p>
            </div>
            <Button onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to search
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SimplePageTransition>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Improved Navigation */}
          <div className="mb-6">
            <Breadcrumbs items={breadcrumbs} />
          </div>

          {/* Song Metadata */}
          <div className="mb-8">
            <SongMetadata song={song} />
          </div>

          {/* Arrangements Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">
                Available Arrangements ({arrangements.length})
              </h2>
              {/* Add Arrangement button or Sign in prompt */}
              {isAuthenticated ? (
                <Button onClick={() => setAddArrangementDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Arrangement
                </Button>
              ) : (
                <Link
                  to="/auth/signin"
                  className="text-sm text-primary hover:underline"
                >
                  Sign in to add arrangements
                </Link>
              )}
            </div>

            {/* Add Arrangement Dialog */}
            <AddArrangementDialog
              open={addArrangementDialogOpen}
              onOpenChange={setAddArrangementDialogOpen}
              songId={song.id}
              songSlug={song.slug}
              songTitle={song.title}
            />

            {arrangements.length > 0 ? (
              <ArrangementList
                arrangements={arrangements}
                songSlug={song.slug}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No arrangements available for this song yet
                  </p>
                  {isAuthenticated && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setAddArrangementDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create the first arrangement
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </SimplePageTransition>
  );
}
