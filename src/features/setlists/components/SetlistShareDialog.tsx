/**
 * SetlistShareDialog Component
 *
 * Dialog for managing setlist sharing: privacy level, share link, and user access.
 * Owner can modify privacy, add/remove users, toggle permissions.
 * Editors see limited info.
 */

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import SetlistPrivacySelector from './SetlistPrivacySelector';
import { Copy, Check, UserPlus, X } from 'lucide-react';
import type { Id } from '../../../../convex/_generated/dataModel';

interface SetlistShareDialogProps {
  setlistId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SetlistShareDialog({
  setlistId,
  open,
  onOpenChange,
}: SetlistShareDialogProps) {
  const sharingInfo = useQuery(api.setlists.getSharingInfo, {
    setlistId: setlistId as Id<'setlists'>,
  });
  const setlist = useQuery(api.setlists.get, {
    id: setlistId as Id<'setlists'>,
  });

  const updatePrivacy = useMutation(api.setlists.updatePrivacy);
  const addSharedUser = useMutation(api.setlists.addSharedUser);
  const removeSharedUser = useMutation(api.setlists.removeSharedUser);
  const updatePermission = useMutation(api.setlists.updateSharedUserPermission);

  const [copied, setCopied] = useState(false);
  const [userInput, setUserInput] = useState('');

  const shareUrl = `${window.location.origin}/setlists/${setlistId}`;

  // Search for users
  const searchResults = useQuery(
    api.users.searchByUsernameOrEmail,
    userInput.length >= 2 ? { searchTerm: userInput } : 'skip'
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handlePrivacyChange = async (
    newLevel: 'private' | 'unlisted' | 'public'
  ) => {
    try {
      await updatePrivacy({
        setlistId: setlistId as Id<'setlists'>,
        privacyLevel: newLevel,
      });
      toast.success(`Privacy updated to ${newLevel}`);
    } catch {
      toast.error('Failed to update privacy');
    }
  };

  const handleAddUser = async (userIdToAdd: Id<'users'>) => {
    try {
      await addSharedUser({
        setlistId: setlistId as Id<'setlists'>,
        userIdToAdd,
        canEdit: false, // Default to view-only
      });
      setUserInput('');
      toast.success('User added');
    } catch {
      toast.error('Failed to add user');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await removeSharedUser({
        setlistId: setlistId as Id<'setlists'>,
        userIdToRemove: userId as Id<'users'>,
      });
      toast.success('User removed');
    } catch {
      toast.error('Failed to remove user');
    }
  };

  const handleTogglePermission = async (
    userId: string,
    currentCanEdit: boolean
  ) => {
    try {
      await updatePermission({
        setlistId: setlistId as Id<'setlists'>,
        targetUserId: userId as Id<'users'>,
        canEdit: !currentCanEdit,
      });
      toast.success(`Permission updated to ${!currentCanEdit ? 'edit' : 'view only'}`);
    } catch {
      toast.error('Failed to update permission');
    }
  };

  if (!sharingInfo || !setlist) return null;

  const privacyLevel = setlist.privacyLevel ?? 'private';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Setlist</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Privacy Level */}
          {sharingInfo.isOwner ? (
            <SetlistPrivacySelector
              value={privacyLevel}
              onChange={handlePrivacyChange}
            />
          ) : (
            <div>
              <Label>Privacy Level</Label>
              <p className="text-sm text-muted-foreground capitalize mt-1">
                {privacyLevel}
              </p>
            </div>
          )}

          {/* Share Link */}
          {(privacyLevel === 'unlisted' || privacyLevel === 'public') && (
            <div>
              <Label>Share Link</Label>
              <div className="flex gap-2 mt-2">
                <Input value={shareUrl} readOnly className="text-sm" />
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Shared Users Management (Owner only) */}
          {sharingInfo.isOwner && (
            <div>
              <Label>Shared With</Label>

              {/* Add User Input with Search Results */}
              <div className="mt-2 mb-4 space-y-2">
                <Input
                  placeholder="Search by username or email..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                />

                {/* Search Results Dropdown */}
                {searchResults && searchResults.length > 0 && (
                  <div className="border rounded-md shadow-sm max-h-48 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => handleAddUser(user._id)}
                        className="w-full flex items-center justify-between p-2 hover:bg-accent text-left"
                        type="button"
                      >
                        <div>
                          <p className="font-medium">@{user.username}</p>
                          {user.displayName && (
                            <p className="text-sm text-muted-foreground">
                              {user.displayName}
                            </p>
                          )}
                        </div>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}

                {userInput.length >= 2 && searchResults?.length === 0 && (
                  <p className="text-sm text-muted-foreground">No users found</p>
                )}
              </div>

              {/* Shared Users List */}
              {sharingInfo.sharedUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Not shared with anyone yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {sharingInfo.sharedUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div>
                        <p className="font-medium">@{user.username}</p>
                        {user.displayName && (
                          <p className="text-sm text-muted-foreground">
                            {user.displayName}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.canEdit}
                            onCheckedChange={() =>
                              handleTogglePermission(user.userId, user.canEdit)
                            }
                          />
                          <Label className="text-sm">
                            {user.canEdit ? 'Can Edit' : 'View Only'}
                          </Label>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveUser(user.userId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* View-only users see limited info */}
          {!sharingInfo.isOwner && sharingInfo.canEdit && (
            <div>
              <Label>Collaborators</Label>
              <p className="text-sm text-muted-foreground mt-2">
                You have edit access to this setlist. Contact the owner to
                manage sharing.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
