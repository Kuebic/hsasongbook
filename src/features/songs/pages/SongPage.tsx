import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import SongMetadata from '../components/SongMetadata';
import SongEditForm from '../components/SongEditForm';
import { useSongPermissions } from '../hooks/useSongPermissions';
import ArrangementList from '../../arrangements/components/ArrangementList';
import Breadcrumbs from '../../shared/components/Breadcrumbs';
import { PageSpinner } from '../../shared/components/LoadingStates';
import { SimplePageTransition } from '../../shared/components/PageTransition';
import { useNavigation } from '../../shared/hooks/useNavigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import AddArrangementDialog from '@/features/arrangements/components/AddArrangementDialog';
import { VersionHistoryPanel } from '@/features/versions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Edit, Music, Plus, X } from 'lucide-react';
import { SongOwnershipMenu } from '../components/SongOwnershipMenu';
import type { Song } from '@/types/Song.types';
import type { ArrangementWithCreator } from '@/types/Arrangement.types';

export function SongPage() {
  const { songSlug } = useParams();
  const navigate = useNavigate();
  const { breadcrumbs } = useNavigation();
  const [addArrangementDialogOpen, setAddArrangementDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const { user } = useAuth();
  const isAuthenticated = user && !user.isAnonymous;

  // Get song by slug from Convex (with owner info for display)
  const convexSong = useQuery(
    api.songs.getBySlugWithOwner,
    songSlug ? { slug: songSlug } : 'skip'
  );

  // Check if user can edit this song
  const { canEdit, isOriginalCreator, loading: permissionsLoading } = useSongPermissions(
    convexSong?._id ?? null
  );

  // Check if song is owned by Community group (system group)
  const isCommunityOwned =
    convexSong?.ownerType === 'group' &&
    convexSong?.owner?.type === 'group' &&
    convexSong?.owner?.isSystemGroup === true;

  // Get arrangements for this song (with creator info)
  const convexArrangements = useQuery(
    api.arrangements.getBySongWithCreators,
    convexSong?._id ? { songId: convexSong._id } : 'skip'
  );

  // Get arrangement IDs where current user is a collaborator (for filtering)
  const myCollaborationIds = useQuery(
    api.arrangements.getMyCollaborationIds,
    isAuthenticated ? {} : 'skip'
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
      notes: convexSong.notes,
      bibleVerses: convexSong.bibleVerses,
      quotes: convexSong.quotes,
    };
  }, [convexSong]);

  // Map Convex arrangements to frontend Arrangement type (with creator info)
  const arrangements: ArrangementWithCreator[] = useMemo(() => {
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
      creator: arr.creator ?? null,
      owner: arr.owner,
      // Audio references (for play button on cards)
      audioFileKey: arr.audioFileKey,
      youtubeUrl: arr.youtubeUrl,
    }));
  }, [convexArrangements]);

  // Filter arrangements to "mine" (created by me OR I'm a collaborator)
  const filteredArrangements = useMemo(() => {
    if (!showOnlyMine || !user?.id) return arrangements;

    // Convert Convex IDs to strings for comparison
    const myCollabIdStrings = new Set(
      (myCollaborationIds ?? []).map((id) => id.toString())
    );

    return arrangements.filter((arr) => {
      // Check if I created it
      const isCreator = arr.creator?._id === user.id;
      // Check if I'm a collaborator (compare as strings)
      const isCollaborator = myCollabIdStrings.has(arr.id.toString());
      return isCreator || isCollaborator;
    });
  }, [arrangements, showOnlyMine, user?.id, myCollaborationIds]);

  // Loading states
  const isLoadingSong = songSlug !== undefined && convexSong === undefined;
  const isLoadingArrangements = convexSong?._id && convexArrangements === undefined;
  const isLoading = isLoadingSong || isLoadingArrangements || permissionsLoading;

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
          <div className="flex items-center justify-between mb-6">
            <Breadcrumbs items={breadcrumbs} />

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {/* Ownership transfer/reclaim (only for original creator) */}
              {isAuthenticated && (
                <SongOwnershipMenu
                  songId={song?.id ?? ''}
                  isOriginalCreator={isOriginalCreator}
                  isCommunityOwned={isCommunityOwned}
                  ownerType={convexSong?.ownerType}
                  groupName={convexSong?.owner?.type === 'group' ? convexSong.owner.name : undefined}
                />
              )}

              {/* Edit button (only if user can edit) */}
              {canEdit && !isEditMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditMode(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Song
                </Button>
              )}
            </div>
          </div>

          {/* Song Metadata or Edit Form */}
          <div className="mb-8">
            {isEditMode && canEdit ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Edit Song</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditMode(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <SongEditForm
                    songId={song.id}
                    initialData={{
                      title: song.title,
                      artist: song.artist,
                      themes: song.themes,
                      copyright: song.copyright,
                      lyrics: convexSong?.lyrics,
                      notes: convexSong?.notes,
                      bibleVerses: convexSong?.bibleVerses,
                      quotes: convexSong?.quotes,
                    }}
                    onSuccess={() => setIsEditMode(false)}
                    onCancel={() => setIsEditMode(false)}
                  />
                </CardContent>
              </Card>
            ) : (
              <SongMetadata song={song} owner={convexSong?.owner} />
            )}
          </div>

          {/* Version History Panel (Community group moderators only) */}
          <VersionHistoryPanel
            contentType="song"
            contentId={song.id}
            ownerType={convexSong?.ownerType}
          />

          {/* Arrangements Section */}
          <div className="mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-semibold">
                  Available Arrangements ({filteredArrangements.length})
                </h2>
                {/* Filter toggle - only for authenticated users with arrangements */}
                {isAuthenticated && arrangements.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Switch
                      id="show-only-mine"
                      checked={showOnlyMine}
                      onCheckedChange={setShowOnlyMine}
                    />
                    <Label
                      htmlFor="show-only-mine"
                      className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap"
                    >
                      Only mine
                    </Label>
                  </div>
                )}
              </div>
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
              songLyrics={convexSong?.lyrics}
            />

            {filteredArrangements.length > 0 ? (
              <ArrangementList
                arrangements={filteredArrangements}
                songSlug={song.slug}
              />
            ) : arrangements.length > 0 && showOnlyMine ? (
              // Show message when filter is active but no matches
              <Card>
                <CardContent className="py-12 text-center">
                  <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No arrangements match your filter
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowOnlyMine(false)}
                  >
                    Show all arrangements
                  </Button>
                </CardContent>
              </Card>
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
