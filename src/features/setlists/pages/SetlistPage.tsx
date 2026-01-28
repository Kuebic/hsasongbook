/**
 * SetlistPage
 *
 * View/edit individual setlist with drag-and-drop song reordering.
 * Pattern: Uses @dnd-kit DndContext + SortableContext
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { useSetlistData } from '../hooks/useSetlistData';
import { useSetlistSongs } from '../hooks/useSetlistSongs';
import { useDragReorder } from '../hooks/useDragReorder';
import SetlistSongItem from '../components/SetlistSongItem';
import { AddArrangementModal } from '../components/AddArrangementModal';
import SetlistPrivacyBadge from '../components/SetlistPrivacyBadge';
import SetlistFavoriteButton from '../components/SetlistFavoriteButton';
import SetlistSharedBadge from '../components/SetlistSharedBadge';
import SetlistAttribution from '../components/SetlistAttribution';
import SetlistShareDialog from '../components/SetlistShareDialog';
import SetlistEditDialog from '../components/SetlistEditDialog';
import Breadcrumbs from '@/features/shared/components/Breadcrumbs';
import { PageSpinner } from '@/features/shared/components/LoadingStates';
import { SimplePageTransition } from '@/features/shared/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Play, ListMusic, Copy, Share2, MoreVertical, Pencil } from 'lucide-react';
import { toast } from 'sonner';

export function SetlistPage() {
  const { setlistId } = useParams<{ setlistId: string }>();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const {
    setlist,
    arrangements,
    songs,
    loading,
    error,
    updateSetlist,
    isAuthenticated
  } = useSetlistData(setlistId);

  // Get sharing info for permission checks
  const sharingInfo = useQuery(
    api.setlists.getSharingInfo,
    setlistId ? { setlistId: setlistId as Id<'setlists'> } : 'skip'
  );

  // Mutations for setlist actions
  const duplicateSetlist = useMutation(api.setlists.duplicate);
  const toggleAttribution = useMutation(api.setlists.toggleAttribution);

  const { addSong, removeSong, reorderSongs, updateSongKey } = useSetlistSongs(
    setlist,
    (updated) => updateSetlist(updated)
  );

  // Use local state during drag to prevent animation glitches from Convex reactivity
  const { items: dragItems, handleReorder } = useDragReorder(setlist?.songs ?? []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (over && active.id !== over.id && setlist) {
      const oldIndex = dragItems.findIndex(s => s.id === active.id);
      const newIndex = dragItems.findIndex(s => s.id === over.id);
      // Use handleReorder which manages local state to prevent animation glitches
      // It passes the reordered items to reorderSongs for persistence
      handleReorder(oldIndex, newIndex, (reorderedItems) => reorderSongs(reorderedItems));
    }
  };

  const handleDuplicate = async (): Promise<void> => {
    if (!setlistId) return;
    try {
      const newId = await duplicateSetlist({
        setlistId: setlistId as Id<'setlists'>
      });
      toast.success('Setlist duplicated!');
      navigate(`/setlist/${newId}`);
    } catch (err) {
      toast.error('Failed to duplicate setlist');
      console.error('Failed to duplicate:', err);
    }
  };

  const handleToggleAttribution = async (): Promise<void> => {
    if (!setlistId) return;
    try {
      await toggleAttribution({
        setlistId: setlistId as Id<'setlists'>
      });
    } catch (err) {
      toast.error('Failed to update attribution');
      console.error('Failed to toggle attribution:', err);
    }
  };

  // Determine if user can edit
  const canEdit = sharingInfo?.canEdit ?? sharingInfo?.isOwner ?? false;

  // Auth gating: Show sign-in prompt for anonymous users
  if (!isAuthenticated) {
    return (
      <SimplePageTransition>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-6">
              <Breadcrumbs items={[
                { label: 'Setlists', path: '/setlists' },
                { label: 'Setlist', path: '#' }
              ]} />
            </div>

            <Card className="max-w-md mx-auto mt-12">
              <CardContent className="pt-6 text-center">
                <ListMusic className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Sign in to view setlists</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Setlists are private and require authentication.
                </p>
                <Link to="/auth/signin">
                  <Button className="w-full">Sign In</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </SimplePageTransition>
    );
  }

  if (loading) return <PageSpinner message="Loading setlist..." />;
  if (error || !setlist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">{error || 'Setlist not found'}</p>
      </div>
    );
  }

  return (
    <SimplePageTransition>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Breadcrumbs items={[
              { label: 'Setlists', path: '/setlists' },
              { label: setlist.name, path: `/setlist/${setlist.id}` }
            ]} />
          </div>

          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h1 className="text-3xl font-bold">{setlist.name}</h1>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {sharingInfo && (
                  <>
                    <SetlistPrivacyBadge privacyLevel={sharingInfo.privacyLevel} />
                    <SetlistSharedBadge
                      isOwner={sharingInfo.isOwner}
                      canEdit={sharingInfo.canEdit}
                    />
                  </>
                )}
              </div>

              {setlist.description && (
                <p className="text-muted-foreground">{setlist.description}</p>
              )}
              {setlist.performanceDate && (
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(setlist.performanceDate).toLocaleDateString()}
                </p>
              )}

              {/* Attribution */}
              {setlist.duplicatedFrom && (
                <SetlistAttribution
                  setlistId={setlist.id}
                  showAttribution={setlist.showAttribution ?? true}
                  isOwner={sharingInfo?.isOwner ?? false}
                  onToggleAttribution={handleToggleAttribution}
                  className="mt-2"
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <SetlistFavoriteButton
                setlistId={setlist.id}
                favoriteCount={setlist.favorites ?? 0}
                variant="ghost"
              />

              {setlist.songs.length > 0 && (
                <Button
                  onClick={() => navigate(`/setlist/${setlist.id}/performance/0`)}
                  variant="default"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Performance Mode
                </Button>
              )}

              {/* More actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">More actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {sharingInfo?.isOwner && (
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  {(sharingInfo?.isOwner || sharingInfo?.canEdit) && (
                    <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Add Song button - only if user can edit */}
          {canEdit && (
            <Button onClick={() => setShowAddModal(true)} className="mb-6">
              <Plus className="mr-2 h-4 w-4" />
              Add Song
            </Button>
          )}

          {dragItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No songs in this setlist yet.{canEdit && ' Add songs to get started.'}</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={dragItems.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {dragItems.map((song, index) => {
                    const arrangement = arrangements.get(song.arrangementId);
                    const parentSong = arrangement ? songs.get(arrangement.songId) : undefined;
                    return (
                      <SetlistSongItem
                        key={song.id}
                        song={song}
                        arrangement={arrangement}
                        parentSong={parentSong}
                        index={index}
                        onRemove={canEdit ? removeSong : () => {}}
                        onKeyChange={canEdit ? updateSongKey : () => {}}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <AddArrangementModal
            open={showAddModal}
            onOpenChange={setShowAddModal}
            onAdd={async (arrangementId, customKey) => {
              await addSong(arrangementId, customKey);
              setShowAddModal(false);
            }}
          />

          {setlistId && (
            <>
              <SetlistShareDialog
                setlistId={setlistId}
                open={showShareDialog}
                onOpenChange={setShowShareDialog}
              />
              <SetlistEditDialog
                setlistId={setlistId}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
              />
            </>
          )}
        </div>
      </div>
    </SimplePageTransition>
  );
}
