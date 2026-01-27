/**
 * AddToSetlistDialog Component
 *
 * A dialog for adding an arrangement to one of the user's setlists.
 * Shows a list of the user's setlists and allows quick addition.
 */

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ListMusic, Plus, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AddToSetlistDialogProps {
  arrangementId: Id<'arrangements'>;
  arrangementName: string;
  songTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToSetlistDialog({
  arrangementId,
  arrangementName,
  songTitle,
  open,
  onOpenChange,
}: AddToSetlistDialogProps) {
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState<string | null>(null);

  // Fetch user's setlists
  const setlists = useQuery(api.setlists.list);
  const addToSetlist = useMutation(api.setlists.addArrangement);

  const isLoading = setlists === undefined;

  const handleAddToSetlist = async (setlistId: Id<'setlists'>) => {
    setIsAdding(setlistId);
    try {
      await addToSetlist({
        setlistId,
        arrangementId,
      });
      setAddedTo((prev) => new Set([...prev, setlistId]));
    } catch (error) {
      console.error('Failed to add to setlist:', error);
    } finally {
      setIsAdding(null);
    }
  };

  // Reset added state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setAddedTo(new Set());
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Setlist</DialogTitle>
          <DialogDescription>
            Add "{arrangementName}" ({songTitle}) to one of your setlists.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm">Loading setlists...</p>
            </div>
          ) : !setlists || setlists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <ListMusic className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm mb-4">You don't have any setlists yet.</p>
              <Button asChild variant="outline">
                <Link to="/setlists" onClick={() => onOpenChange(false)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create a Setlist
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {setlists.map((setlist) => {
                const isInSetlist = addedTo.has(setlist._id);
                const isCurrentlyAdding = isAdding === setlist._id;

                return (
                  <div
                    key={setlist._id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{setlist.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {setlist.arrangementIds.length} song
                        {setlist.arrangementIds.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Button
                      variant={isInSetlist ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => handleAddToSetlist(setlist._id)}
                      disabled={isInSetlist || isCurrentlyAdding}
                    >
                      {isCurrentlyAdding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isInSetlist ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddToSetlistDialog;
