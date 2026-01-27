/**
 * AddToSetlistDialog Component
 *
 * A dialog for adding an arrangement to one of the user's setlists.
 * Features:
 * - List of user's setlists with quick add buttons
 * - Search filter (when 5+ setlists)
 * - Inline setlist creation without losing arrangement context
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ListMusic, Plus, Check, Search, ArrowLeft } from 'lucide-react';
import { useSetlistSearch } from '../hooks/useSetlistSearch';
import { validateSetlist } from '../utils/setlistValidation';
import type { SetlistFormData, SetlistValidationErrors } from '../types';

/** Threshold for showing search input */
const SEARCH_THRESHOLD = 5;

type DialogMode = 'list' | 'create';

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
  const navigate = useNavigate();

  // Dialog mode state
  const [mode, setMode] = useState<DialogMode>('list');

  // List mode state
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState<string | null>(null);

  // Create mode state
  const [formData, setFormData] = useState<SetlistFormData>({
    name: '',
    description: '',
    performanceDate: '',
  });
  const [formErrors, setFormErrors] = useState<SetlistValidationErrors | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Convex queries and mutations
  const setlists = useQuery(api.setlists.list);
  const addToSetlist = useMutation(api.setlists.addArrangement);
  const createSetlist = useMutation(api.setlists.create);

  const isLoading = setlists === undefined;

  // Search hook - only used when we have setlists
  const { query, setQuery, results: filteredSetlists, isEmpty: searchIsEmpty } = useSetlistSearch(
    setlists ?? []
  );

  const showSearch = setlists && setlists.length >= SEARCH_THRESHOLD;

  // Add arrangement to existing setlist
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

  // Create new setlist with arrangement and navigate
  const handleCreateAndAdd = async () => {
    const validationErrors = validateSetlist(formData);
    if (validationErrors) {
      setFormErrors(validationErrors);
      return;
    }

    setFormErrors(null);
    setIsCreating(true);

    try {
      // Create setlist with the arrangement already included
      const setlistId = await createSetlist({
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        performanceDate: formData.performanceDate || undefined,
        arrangementIds: [arrangementId],
      });

      // Close dialog and navigate to the new setlist
      onOpenChange(false);
      navigate(`/setlist/${setlistId}`);
    } catch (error) {
      console.error('Failed to create setlist:', error);
      setFormErrors({ name: 'Failed to create setlist. Please try again.' });
    } finally {
      setIsCreating(false);
    }
  };

  // Reset all state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setAddedTo(new Set());
      setMode('list');
      setQuery('');
      setFormData({ name: '', description: '', performanceDate: '' });
      setFormErrors(null);
    }
    onOpenChange(newOpen);
  };

  // Switch to create mode
  const handleCreateNew = () => {
    setMode('create');
    setFormErrors(null);
  };

  // Go back to list mode
  const handleBackToList = () => {
    setMode('list');
    setFormData({ name: '', description: '', performanceDate: '' });
    setFormErrors(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'list' ? 'Add to Setlist' : 'Create New Setlist'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'list'
              ? `Add "${arrangementName}" (${songTitle}) to one of your setlists.`
              : `Create a setlist and add "${arrangementName}" to it.`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {mode === 'list' ? (
            <>
              {/* Create New button - always at top */}
              <Button
                variant="outline"
                className="w-full mb-4"
                onClick={handleCreateNew}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Setlist
              </Button>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p className="text-sm">Loading setlists...</p>
                </div>
              ) : !setlists || setlists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <ListMusic className="h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm">You don't have any setlists yet.</p>
                </div>
              ) : (
                <>
                  {/* Search input - only when 5+ setlists */}
                  {showSearch && (
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search setlists..."
                        className="pl-9"
                      />
                    </div>
                  )}

                  {/* Setlist list */}
                  {searchIsEmpty && query ? (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                      <p className="text-sm">No setlists match "{query}"</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {filteredSetlists.map((setlist) => {
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
                </>
              )}
            </>
          ) : (
            /* Create mode - inline form */
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="mb-2 -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>

              <div>
                <Label htmlFor="setlist-name">Setlist Name *</Label>
                <Input
                  id="setlist-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Sunday Worship - Jan 15, 2025"
                  aria-invalid={formErrors?.name ? 'true' : 'false'}
                  aria-describedby={formErrors?.name ? 'name-error' : undefined}
                />
                {formErrors?.name && (
                  <p id="name-error" className="text-sm text-destructive mt-1">
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="setlist-description">Description</Label>
                <Input
                  id="setlist-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Morning service setlist"
                />
              </div>

              <div>
                <Label htmlFor="setlist-date">Performance Date</Label>
                <Input
                  id="setlist-date"
                  type="date"
                  value={formData.performanceDate}
                  onChange={(e) =>
                    setFormData({ ...formData, performanceDate: e.target.value })
                  }
                  aria-invalid={formErrors?.performanceDate ? 'true' : 'false'}
                  aria-describedby={
                    formErrors?.performanceDate ? 'date-error' : undefined
                  }
                />
                {formErrors?.performanceDate && (
                  <p id="date-error" className="text-sm text-destructive mt-1">
                    {formErrors.performanceDate}
                  </p>
                )}
              </div>

              <Button
                onClick={handleCreateAndAdd}
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create & Add Song
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddToSetlistDialog;
