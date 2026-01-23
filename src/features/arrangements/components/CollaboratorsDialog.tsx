/**
 * CollaboratorsDialog Component
 * Phase 1: Collaborators - Dialog for managing arrangement collaborators
 *
 * Owner-only dialog for searching and adding/removing collaborators.
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/UserAvatar';
import { Search, UserPlus, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollaboratorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  arrangementId: string;
  arrangementName: string;
}

export default function CollaboratorsDialog({
  open,
  onOpenChange,
  arrangementId,
  arrangementName,
}: CollaboratorsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get current collaborators
  const collaborators = useQuery(api.arrangements.getCollaborators, {
    arrangementId: arrangementId as Id<'arrangements'>,
  });

  // Search users
  const searchResults = useQuery(
    api.users.searchByUsername,
    searchQuery.length >= 2 ? { query: searchQuery } : 'skip'
  );

  // Mutations
  const addCollaborator = useMutation(api.arrangements.addCollaborator);
  const removeCollaborator = useMutation(api.arrangements.removeCollaborator);

  // Filter out users who are already collaborators from search results
  const collaboratorIds = new Set(collaborators?.map((c) => c.userId) ?? []);
  const filteredSearchResults =
    searchResults?.filter((u) => !collaboratorIds.has(u._id)) ?? [];

  const handleAddCollaborator = useCallback(
    async (userId: string) => {
      setAddingUserId(userId);
      setError(null);
      try {
        await addCollaborator({
          arrangementId: arrangementId as Id<'arrangements'>,
          userId: userId as Id<'users'>,
        });
        setSearchQuery(''); // Clear search after adding
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add collaborator');
      } finally {
        setAddingUserId(null);
      }
    },
    [arrangementId, addCollaborator]
  );

  const handleRemoveCollaborator = useCallback(
    async (userId: string) => {
      setRemovingUserId(userId);
      setError(null);
      try {
        await removeCollaborator({
          arrangementId: arrangementId as Id<'arrangements'>,
          userId: userId as Id<'users'>,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove collaborator');
      } finally {
        setRemovingUserId(null);
      }
    },
    [arrangementId, removeCollaborator]
  );

  const getDisplayName = (user: {
    username?: string | null;
    displayName?: string | null;
    showRealName?: boolean | null;
  }) => {
    if (user.showRealName && user.displayName) {
      return user.displayName;
    }
    return user.username ?? 'Unknown';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Collaborators</DialogTitle>
          <DialogDescription>
            Add collaborators who can edit "{arrangementName}". Search by username to find users.
          </DialogDescription>
        </DialogHeader>

        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Search results */}
        {searchQuery.length >= 2 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Search Results</p>
            {filteredSearchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                {searchResults === undefined ? 'Searching...' : 'No users found'}
              </p>
            ) : (
              <div className="max-h-[150px] overflow-y-auto">
                <div className="space-y-1">
                  {filteredSearchResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          userId={user._id as Id<'users'>}
                          displayName={user.displayName}
                          size="sm"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {getDisplayName(user)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            @{user.username}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAddCollaborator(user._id)}
                        disabled={addingUserId === user._id}
                      >
                        {addingUserId === user._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Current collaborators */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Current Collaborators ({collaborators?.length ?? 0})
          </p>
          {collaborators === undefined ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : collaborators.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No collaborators yet. Search for users above to add them.
            </p>
          ) : (
            <div className="max-h-[200px] overflow-y-auto">
              <div className="space-y-1">
                {collaborators.map((collab) => (
                  <div
                    key={collab._id}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-md',
                      'bg-muted/30'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        userId={collab.userId as Id<'users'>}
                        displayName={collab.user?.displayName}
                        size="sm"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {collab.user ? getDisplayName(collab.user) : 'Unknown'}
                        </span>
                        {collab.user?.username && (
                          <span className="text-xs text-muted-foreground">
                            @{collab.user.username}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveCollaborator(collab.userId)}
                      disabled={removingUserId === collab.userId}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {removingUserId === collab.userId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
