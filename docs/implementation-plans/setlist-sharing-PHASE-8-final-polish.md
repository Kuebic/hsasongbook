# Phase 8: Final Polish - Share Dialog, Profiles, Offline

## Goal
Complete the remaining features: sharing dialog, user profile integration, offline support, and broken reference handling.

## Prerequisites
✅ Phases 1-7 completed (all core features working)

## Changes Required

### 0. Add User Search Query to [convex/users.ts](convex/users.ts)

**This query is needed for the share dialog to find users to share with:**

```typescript
import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Search for users by username or email (for sharing)
 * Returns up to 10 results to avoid overwhelming the UI
 */
export const searchByUsernameOrEmail = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    // Require authentication to search users
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Don't search for very short terms
    if (args.searchTerm.length < 2) return [];

    const users = await ctx.db.query("users").collect();
    const term = args.searchTerm.toLowerCase();

    return users
      .filter(u =>
        // Exclude current user from results
        u._id !== userId &&
        // Match username or email
        (u.username?.toLowerCase().includes(term) ||
         u.email?.toLowerCase().includes(term))
      )
      .slice(0, 10)  // Limit results
      .map(u => ({
        _id: u._id,
        username: u.username,
        displayName: u.displayName,
        // Don't expose full email for privacy
      }));
  },
});
```

---

### 1. Create Share Dialog Component

**Create [src/features/setlists/components/SetlistShareDialog.tsx](src/features/setlists/components/SetlistShareDialog.tsx):**

Pattern similar to CollaboratorsList component. Features:
- Show current privacy level with inline edit (owner only)
- Copy shareable link
- Add/remove shared users
- Toggle edit/view permissions

```tsx
import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SetlistPrivacySelector } from './SetlistPrivacySelector';
import { Copy, Check, UserPlus, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Id } from '@/convex/_generated/dataModel';

interface Props {
  setlistId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetlistShareDialog({ setlistId, open, onOpenChange }: Props) {
  const sharingInfo = useQuery(api.setlists.getSharingInfo, {
    setlistId: setlistId as Id<'setlists'>,
  });
  const setlist = useQuery(api.setlists.get, { id: setlistId as Id<'setlists'> });

  const updatePrivacy = useMutation(api.setlists.updatePrivacy);
  const addSharedUser = useMutation(api.setlists.addSharedUser);
  const removeSharedUser = useMutation(api.setlists.removeSharedUser);
  const updatePermission = useMutation(api.setlists.updateSharedUserPermission);

  const [copied, setCopied] = useState(false);
  const [userInput, setUserInput] = useState('');

  const shareUrl = `${window.location.origin}/setlists/${setlistId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrivacyChange = async (newLevel: 'private' | 'unlisted' | 'public') => {
    await updatePrivacy({
      setlistId: setlistId as Id<'setlists'>,
      privacyLevel: newLevel,
    });
  };

  // Search for users (see new query below)
  const searchResults = useQuery(
    api.users.searchByUsernameOrEmail,
    userInput.length >= 2 ? { searchTerm: userInput } : "skip"
  );

  const handleAddUser = async (userIdToAdd: Id<'users'>) => {
    try {
      await addSharedUser({
        setlistId: setlistId as Id<'setlists'>,
        userIdToAdd,
        canEdit: false, // Default to view-only
      });
      setUserInput('');
      toast.success("User added!");
    } catch (error) {
      toast.error("Failed to add user");
    }
  };

  const handleRemoveUser = async (userId: string) => {
    await removeSharedUser({
      setlistId: setlistId as Id<'setlists'>,
      userIdToRemove: userId as Id<'users'>,
    });
  };

  const handleTogglePermission = async (userId: string, currentCanEdit: boolean) => {
    await updatePermission({
      setlistId: setlistId as Id<'setlists'>,
      targetUserId: userId as Id<'users'>,
      canEdit: !currentCanEdit,
    });
  };

  if (!sharingInfo || !setlist) return null;

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
              value={setlist.privacyLevel}
              onChange={handlePrivacyChange}
            />
          ) : (
            <div>
              <Label>Privacy Level</Label>
              <p className="text-sm text-muted-foreground capitalize mt-1">
                {setlist.privacyLevel}
              </p>
            </div>
          )}

          {/* Share Link */}
          {(setlist.privacyLevel === 'unlisted' ||
            setlist.privacyLevel === 'public') && (
            <div>
              <Label>Share Link</Label>
              <div className="flex gap-2 mt-2">
                <Input value={shareUrl} readOnly />
                <Button variant="outline" onClick={handleCopyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Shared Users List */}
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
                  <div className="border rounded-md shadow-sm">
                    {searchResults.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => handleAddUser(user._id)}
                        className="w-full flex items-center justify-between p-2 hover:bg-accent text-left"
                      >
                        <div>
                          <p className="font-medium">{user.username}</p>
                          {user.displayName && (
                            <p className="text-sm text-muted-foreground">{user.displayName}</p>
                          )}
                        </div>
                        <UserPlus className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                )}

                {userInput.length >= 2 && searchResults?.length === 0 && (
                  <p className="text-sm text-muted-foreground">No users found</p>
                )}
              </div>

              {/* Shared Users */}
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
                        <p className="font-medium">{user.username}</p>
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
                You have edit access to this setlist. Contact the owner to manage sharing.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 2. Add Public Setlists to User Profile Page

**Update [src/features/profile/pages/UserProfilePage.tsx](src/features/profile/pages/UserProfilePage.tsx):**

```tsx
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SetlistCard } from '@/features/setlists/components/SetlistCard';

export function UserProfilePage() {
  const { username } = useParams();
  const user = useQuery(api.users.getByUsername, { username: username! });
  const publicSetlists = useQuery(
    api.setlists.getByCreator,
    user ? { userId: user._id } : 'skip'
  );

  return (
    <div className="container py-8">
      {/* Existing profile content */}

      {/* Public Setlists Section */}
      {publicSetlists && publicSetlists.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Public Setlists</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicSetlists.map((setlist) => (
              <SetlistCard key={setlist._id} setlist={setlist} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### 3. Handle Broken References in getWithArrangements

**Update [convex/setlists.ts](convex/setlists.ts) - `getWithArrangements` query:**

```typescript
export const getWithArrangements = query({
  args: { id: v.id("setlists") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const setlist = await ctx.db.get(args.id);

    if (!setlist) return null;

    const canView = await canViewSetlist(ctx, args.id, userId);
    if (!canView) return null;

    const songs = setlist.songs ?? [];

    const arrangementsData = await Promise.all(
      songs.map(async (song) => {
        const arrangement = await ctx.db.get(song.arrangementId);

        // If arrangement doesn't exist
        if (!arrangement) {
          return {
            arrangementId: song.arrangementId,
            customKey: song.customKey,
            unavailable: true,
            songTitle: "[Unavailable]",
            songId: null,
          };
        }

        // Fetch song data
        const songData = await ctx.db.get(arrangement.songId);

        return {
          arrangement,
          song: songData,
          customKey: song.customKey,
          unavailable: false,
        };
      })
    );

    return {
      ...setlist,
      arrangementsData,
    };
  },
});
```

---

### 4. Update SetlistSongItem to Show Unavailable Placeholder

**Update [src/features/setlists/components/SetlistSongItem.tsx](src/features/setlists/components/SetlistSongItem.tsx):**

```tsx
export function SetlistSongItem({ song, index }: Props) {
  if (song.unavailable) {
    return (
      <div className="flex items-center gap-3 p-3 border rounded bg-muted/20">
        <span className="text-muted-foreground font-mono">{index + 1}</span>
        <div className="flex-1">
          <p className="text-muted-foreground italic">
            [Unavailable] - This arrangement has been removed or is no longer accessible
          </p>
        </div>
      </div>
    );
  }

  // Existing component for available songs
  return (
    <Link to={`/arrangements/${song.arrangementId}`} className="...">
      {/* Existing content */}
    </Link>
  );
}
```

---

### 5. Add Offline Caching (PWA)

**Update [vite.config.ts](vite.config.ts):**

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      workbox: {
        runtimeCaching: [
          // Existing caching rules...
          {
            urlPattern: /^https:\/\/.*\.convex\.cloud\/api\/.*\/setlists/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'setlists-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60, // 1 day
              },
            },
          },
        ],
      },
    }),
  ],
});
```

**Add offline indicator to [src/features/setlists/pages/SetlistPerformancePage.tsx](src/features/setlists/pages/SetlistPerformancePage.tsx):**

```tsx
export function SetlistPerformancePage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div>
      {!isOnline && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-sm text-center">
          Offline mode - viewing cached version
        </div>
      )}

      {/* Rest of component */}
    </div>
  );
}
```

---

## Testing Steps

### Share Dialog
1. Open share dialog as owner
2. Change privacy level → updates correctly
3. Copy link → copies to clipboard
4. Add shared user → appears in list
5. Toggle edit permission → updates correctly
6. Remove shared user → disappears from list
7. Open as shared user with edit → see limited view

### User Profiles
1. Visit user profile with public setlists → shows them
2. Visit user profile without public setlists → section hidden
3. Private setlists don't appear

### Broken References
1. Add arrangement to setlist
2. Delete arrangement
3. View setlist → shows "[Unavailable]" placeholder
4. Edit setlist → can remove unavailable entry
5. Duplicate setlist → includes unavailable placeholder

### Offline Support
1. View setlist while online
2. Go offline (airplane mode)
3. Refresh page → loads from cache
4. See offline indicator
5. Go back online → indicator disappears

---

## Final Checklist

✅ **Backend Complete:**
- Schema with privacy, sharing, favorites
- Permission functions
- Sharing mutations
- Browse queries
- Duplication
- Favorites integration
- Broken reference handling

✅ **Frontend Complete:**
- Types updated
- Privacy selector & badge
- Favorite button
- Attribution display
- Share dialog
- Browse page
- Anonymous favorites
- User profile integration
- Offline support

✅ **Testing:**
- All E2E scenarios validated
- Type checking passes
- No console errors
- Mobile-friendly UI

---

## Post-Implementation

1. **Run Type Check:**
   ```bash
   npm run typecheck
   ```

2. **Run Linter:**
   ```bash
   npm run lint
   ```

3. **Update PROJECT_STATUS.md:**
   - Mark Phase 11 (Setlist Sharing) as complete
   - Add any new decisions or learnings

4. **Test in Production:**
   - Deploy to staging
   - Run full E2E test suite
   - Verify migration completes successfully

---

## Dependencies
- Phases 1-7 (all foundational work)

## Result
✅ **Complete setlist privacy, sharing, and discovery system**
