/**
 * AccountSection Component
 *
 * Settings section for user account management.
 * Shows sign-in prompt for anonymous users.
 * For authenticated users: profile picture, username, display name, email, and preferences.
 *
 * Exports:
 * - AccountSection: Full component with Card wrapper (for standalone use)
 * - AccountSectionContent: Content only (for use in accordion)
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  LogOut,
  Pencil,
  Check,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuthState, useAuthActions } from '@/features/auth/hooks/useAuth';
import SignInModal from '@/features/auth/components/SignInModal';
import ProfilePictureUpload from '@/features/auth/components/ProfilePictureUpload';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { useDebounce } from '@/features/shared/hooks/useDebounce';
import { formatDateString } from '../../shared/utils/dateFormatter';

/**
 * Custom hook for account section state and handlers
 */
function useAccountSection() {
  const { user } = useAuthState();
  const { signOut } = useAuthActions();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Edit states for display name
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [isSavingDisplayName, setIsSavingDisplayName] = useState(false);

  // Username setup (for existing users without username)
  const [isSettingUsername, setIsSettingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  const isAnonymous = user?.isAnonymous ?? true;

  // Fetch avatar URL for authenticated users
  const avatarUrl = useQuery(
    api.files.getAvatarUrl,
    !isAnonymous && user?.id ? { userId: user.id as Id<'users'> } : 'skip'
  );

  // Mutations
  const updateDisplayName = useMutation(api.users.updateDisplayName);
  const updateShowRealName = useMutation(api.users.updateShowRealName);
  const setUsername = useMutation(api.users.setUsername);

  // Username availability check
  const debouncedUsername = useDebounce(usernameInput.toLowerCase(), 300);
  const shouldCheckUsername =
    debouncedUsername.length >= 3 && /^[a-z0-9_-]+$/.test(debouncedUsername);
  const usernameAvailability = useQuery(
    api.users.isUsernameAvailable,
    shouldCheckUsername ? { username: debouncedUsername } : 'skip'
  );
  const isCheckingUsername =
    usernameInput.toLowerCase() !== debouncedUsername ||
    (shouldCheckUsername && usernameAvailability === undefined);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  // Display name editing
  const startEditingDisplayName = () => {
    setDisplayNameInput(user?.displayName || '');
    setDisplayNameError(null);
    setIsEditingDisplayName(true);
  };

  const cancelEditingDisplayName = () => {
    setIsEditingDisplayName(false);
    setDisplayNameError(null);
  };

  const saveDisplayName = async () => {
    const trimmed = displayNameInput.trim();

    if (trimmed === '') {
      setDisplayNameError('Display name must be at least 3 characters');
      return;
    }

    if (trimmed.length < 3 || trimmed.length > 50) {
      setDisplayNameError('Display name must be between 3 and 50 characters');
      return;
    }

    try {
      setIsSavingDisplayName(true);
      setDisplayNameError(null);
      await updateDisplayName({ displayName: trimmed });
      setIsEditingDisplayName(false);
    } catch (err) {
      setDisplayNameError(
        err instanceof Error ? err.message : 'Failed to update display name'
      );
    } finally {
      setIsSavingDisplayName(false);
    }
  };

  // Show real name toggle
  const handleShowRealNameToggle = async (checked: boolean) => {
    try {
      await updateShowRealName({ showRealName: checked });
    } catch (err) {
      console.error('Failed to update showRealName:', err);
    }
  };

  // Username setup
  const startSettingUsername = () => {
    setUsernameInput('');
    setUsernameError(null);
    setIsSettingUsername(true);
  };

  const cancelSettingUsername = () => {
    setIsSettingUsername(false);
    setUsernameError(null);
  };

  const getUsernameStatus = useCallback(() => {
    if (!usernameInput || usernameInput.length < 3) return null;
    if (isCheckingUsername) return 'checking';
    if (!usernameAvailability) return null;
    if (usernameAvailability.available) return 'available';
    return 'taken';
  }, [usernameInput, isCheckingUsername, usernameAvailability]);

  const saveUsername = async () => {
    const normalized = usernameInput.toLowerCase().trim();

    if (normalized.length < 3 || normalized.length > 30) {
      setUsernameError('Username must be between 3 and 30 characters');
      return;
    }

    if (!/^[a-z0-9_-]+$/.test(normalized)) {
      setUsernameError(
        'Only lowercase letters, numbers, underscores, and hyphens allowed'
      );
      return;
    }

    if (usernameAvailability && !usernameAvailability.available) {
      setUsernameError(
        usernameAvailability.reason || 'Username is already taken'
      );
      return;
    }

    try {
      setIsSavingUsername(true);
      setUsernameError(null);
      await setUsername({ username: normalized });
      setIsSettingUsername(false);
    } catch (err) {
      setUsernameError(
        err instanceof Error ? err.message : 'Failed to set username'
      );
    } finally {
      setIsSavingUsername(false);
    }
  };

  // Initialize display name input when user loads
  useEffect(() => {
    if (user?.displayName) {
      setDisplayNameInput(user.displayName);
    }
  }, [user?.displayName]);

  return {
    user,
    isAnonymous,
    avatarUrl,
    // Sign out
    isSigningOut,
    handleSignOut,
    // Display name
    isEditingDisplayName,
    displayNameInput,
    displayNameError,
    isSavingDisplayName,
    setDisplayNameInput,
    startEditingDisplayName,
    cancelEditingDisplayName,
    saveDisplayName,
    // Username
    isSettingUsername,
    usernameInput,
    usernameError,
    isSavingUsername,
    setUsernameInput,
    startSettingUsername,
    cancelSettingUsername,
    saveUsername,
    getUsernameStatus,
    // Show real name
    handleShowRealNameToggle,
    // Auth modal
    showAuthModal,
    setShowAuthModal,
  };
}

/**
 * AccountSectionContent - Content without Card wrapper
 * For use in accordion or other container layouts
 */
export function AccountSectionContent() {
  const {
    user,
    isAnonymous,
    avatarUrl,
    isSigningOut,
    handleSignOut,
    isEditingDisplayName,
    displayNameInput,
    displayNameError,
    isSavingDisplayName,
    setDisplayNameInput,
    startEditingDisplayName,
    cancelEditingDisplayName,
    saveDisplayName,
    isSettingUsername,
    usernameInput,
    usernameError,
    isSavingUsername,
    setUsernameInput,
    startSettingUsername,
    cancelSettingUsername,
    saveUsername,
    getUsernameStatus,
    handleShowRealNameToggle,
    showAuthModal,
    setShowAuthModal,
  } = useAccountSection();

  return (
    <>
      <div className="space-y-6">
        {isAnonymous ? (
            // Anonymous user view
            <>
              <p className="text-sm text-muted-foreground">
                Sign in to sync your data across devices and back up to the
                cloud.
              </p>
              <Button variant="outline" onClick={() => setShowAuthModal(true)}>
                Sign In
              </Button>
            </>
          ) : (
            // Authenticated user view
            <>
              {/* Profile Picture */}
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <ProfilePictureUpload currentAvatarUrl={avatarUrl} />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label>Username</Label>
                {user?.username ? (
                  <p className="font-medium">@{user.username}</p>
                ) : isSettingUsername ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        value={usernameInput}
                        onChange={(e) =>
                          setUsernameInput(e.target.value.toLowerCase())
                        }
                        placeholder="your_username"
                        disabled={isSavingUsername}
                        className="pr-10"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {getUsernameStatus() === 'checking' && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {getUsernameStatus() === 'available' && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                        {getUsernameStatus() === 'taken' && (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      3-30 characters. Lowercase letters, numbers, underscores,
                      and hyphens only.
                    </p>
                    {usernameError && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {usernameError}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={saveUsername}
                        disabled={
                          isSavingUsername ||
                          getUsernameStatus() === 'taken' ||
                          getUsernameStatus() === 'checking' ||
                          usernameInput.length < 3
                        }
                      >
                        {isSavingUsername ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Check className="h-4 w-4 mr-1" />
                        )}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelSettingUsername}
                        disabled={isSavingUsername}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-orange-600">
                      Not set
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={startSettingUsername}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Set Username
                    </Button>
                  </div>
                )}
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label>Display Name</Label>
                {isEditingDisplayName ? (
                  <div className="space-y-2">
                    <Input
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      placeholder="Your display name"
                      disabled={isSavingDisplayName}
                    />
                    <p className="text-xs text-muted-foreground">
                      3-50 characters. This is your optional "real name" shown
                      on contributions.
                    </p>
                    {displayNameError && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {displayNameError}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={saveDisplayName}
                        disabled={isSavingDisplayName}
                      >
                        {isSavingDisplayName ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Check className="h-4 w-4 mr-1" />
                        )}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEditingDisplayName}
                        disabled={isSavingDisplayName}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {user?.displayName ? (
                      <p className="font-medium">{user.displayName}</p>
                    ) : (
                      <span className="text-muted-foreground italic">
                        Not set
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={startEditingDisplayName}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Show Real Name Toggle */}
              {user?.displayName && (
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label>Show display name on contributions</Label>
                    <p className="text-xs text-muted-foreground">
                      When enabled, your display name will be shown instead of
                      your username on songs and arrangements you create.
                    </p>
                  </div>
                  <Switch
                    checked={user?.showRealName ?? false}
                    onCheckedChange={handleShowRealNameToggle}
                  />
                </div>
              )}

              {/* Email & Member Since (read-only) */}
              <div className="border-t pt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member since:</span>
                  <span className="font-medium">
                    {formatDateString(user?.createdAt)}
                  </span>
                </div>
              </div>

              {/* Sign Out */}
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="text-destructive hover:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                </Button>
              </div>
            </>
          )}
      </div>

      {/* Sign-in modal */}
      <SignInModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        defaultView="signin"
      />
    </>
  );
}

/**
 * AccountSection - Full component with Card wrapper
 * For standalone use
 */
export default function AccountSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
      </CardHeader>
      <CardContent>
        <AccountSectionContent />
      </CardContent>
    </Card>
  );
}
