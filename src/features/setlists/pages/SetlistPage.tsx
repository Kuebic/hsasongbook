/**
 * SetlistPage
 *
 * View/edit individual setlist with drag-and-drop song reordering.
 * Pattern: Uses @dnd-kit DndContext + SortableContext
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import { useSetlistData } from '../hooks/useSetlistData';
import { useSetlistSongs } from '../hooks/useSetlistSongs';
import SetlistSongItem from '../components/SetlistSongItem';
import Breadcrumbs from '@/features/shared/components/Breadcrumbs';
import { PageSpinner } from '@/features/shared/components/LoadingStates';
import { SimplePageTransition } from '@/features/shared/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Plus, Play } from 'lucide-react';

export function SetlistPage() {
  const { setlistId } = useParams<{ setlistId: string }>();
  const navigate = useNavigate();

  const {
    setlist,
    arrangements,
    loading,
    error,
    updateSetlist
  } = useSetlistData(setlistId);

  const { removeSong, reorderSongs } = useSetlistSongs(
    setlist,
    (updated) => updateSetlist(updated)
  );

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
      const oldIndex = setlist.songs.findIndex(s => s.id === active.id);
      const newIndex = setlist.songs.findIndex(s => s.id === over.id);
      reorderSongs(oldIndex, newIndex);
    }
  };

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

          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{setlist.name}</h1>
              {setlist.description && (
                <p className="text-muted-foreground">{setlist.description}</p>
              )}
              {setlist.performanceDate && (
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(setlist.performanceDate).toLocaleDateString()}
                </p>
              )}
            </div>
            {setlist.songs.length > 0 && (
              <Button
                onClick={() => navigate(`/setlist/${setlist.id}/performance/0`)}
                variant="default"
              >
                <Play className="mr-2 h-4 w-4" />
                Performance Mode
              </Button>
            )}
          </div>

          <Button onClick={() => {/* TODO: Add song modal */}} className="mb-6">
            <Plus className="mr-2 h-4 w-4" />
            Add Song
          </Button>

          {setlist.songs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No songs in this setlist yet. Add songs to get started.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={setlist.songs.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {setlist.songs.map((song, index) => (
                    <SetlistSongItem
                      key={song.id}
                      song={song}
                      arrangement={arrangements.get(song.arrangementId)}
                      index={index}
                      onRemove={removeSong}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </SimplePageTransition>
  );
}
