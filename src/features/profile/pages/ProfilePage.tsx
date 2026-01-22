/**
 * ProfilePage component
 *
 * Phase 5: Displays user authentication state and account info.
 * Features:
 * - Shows username and display name for authenticated users
 * - Editable display name
 * - Show real name toggle
 * - Username setup for existing users without one
 * - Anonymous user badge for guests
 * - Sign-in prompt for anonymous users
 * - Sign-out button for authenticated users
 * - Link to Settings page
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SimplePageTransition } from '../../shared/components/PageTransition';
import Breadcrumbs from '../../shared/components/Breadcrumbs';
import {
  Settings,
  LogOut,
  Pencil,
  Check,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuthState, useAuthActions } from '@/features/auth/hooks/useAuth';
import SignInModal from '@/features/auth/components/SignInModal';
import UserAvatar from '@/components/UserAvatar';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { useDebounce } from '@/hooks/useDebounce';

export function ProfilePage() {
  const { user, loading } = useAuthState();
  const { signOut } = useAuthActions();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Edit states
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [isSavingDisplayName, setIsSavingDisplayName] = useState(false);

  // Username setup (for existing users without username)
  const [isSettingUsername, setIsSettingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);

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

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Profile', path: '/profile' },
  ];

  const isAnonymous = user?.isAnonymous ?? true;

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch {
      // Error already logged by AuthProvider
    } finally {
      setIsSigningOut(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

    // Allow clearing display name
    if (trimmed === '') {
      // For now, we require at least 3 chars if set
      // Could add a clearDisplayName mutation if needed
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

  if (loading) {
    return (
      <SimplePageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </SimplePageTransition>
    );
  }

  return (
    <SimplePageTransition>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumbs items={breadcrumbs} />
          </div>

          {/* Page Header */}
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account and preferences
            </p>
          </header>

          {/* Profile Card */}
          <Card className="mb-6">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <div className="mb-6">
                <UserAvatar
                  userId={user?.id ? (user.id as Id<"users">) : undefined}
                  displayName={user?.displayName}
                  email={user?.email}
                  size="xl"
                />
              </div>

              {isAnonymous ? (
                // Anonymous User View
                <>
                  <CardTitle className="text-2xl mb-2 flex items-center gap-2">
                    Welcome, Guest
                    <Badge variant="secondary">Anonymous</Badge>
                  </CardTitle>

                  <CardDescription className="text-base mb-6 max-w-md">
                    You're using HSA Songbook as a guest. Sign in to sync your
                    data across devices and back up to the cloud.
                  </CardDescription>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mb-8">
                    <Button
                      className="flex-1"
                      onClick={() => setShowAuthModal(true)}
                    >
                      Sign In
                    </Button>

                    <Link to="/settings" className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                  </div>

                  {/* Feature List */}
                  <div className="text-left w-full max-w-md">
                    <p className="text-sm font-semibold mb-3 text-muted-foreground">
                      Sign in to unlock:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Sync songs and setlists across devices
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Cloud backup of your data
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Share arrangements with your team
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Access from any device
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                // Authenticated User View
                <>
                  <CardTitle className="text-2xl mb-2">
                    {user?.showRealName && user?.displayName
                      ? user.displayName
                      : user?.username
                        ? `@${user.username}`
                        : user?.email || 'User'}
                  </CardTitle>

                  {user?.username && user?.showRealName && user?.displayName && (
                    <p className="text-muted-foreground mb-2">
                      @{user.username}
                    </p>
                  )}

                  <CardDescription className="text-base mb-6">
                    Member since {formatDate(user?.createdAt)}
                  </CardDescription>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    <Link to="/settings" className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </Link>

                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Account Details Card (Authenticated users only) */}
          {!isAnonymous && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Username */}
                <div>
                  <Label className="text-muted-foreground">Username</Label>
                  {user?.username ? (
                    <p className="font-medium">@{user.username}</p>
                  ) : isSettingUsername ? (
                    <div className="space-y-2 mt-2">
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
                    <div className="flex items-center gap-2 mt-1">
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

                {/* Email */}
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{user?.email}</p>
                </div>

                {/* Display Name */}
                <div>
                  <Label className="text-muted-foreground">Display Name</Label>
                  {isEditingDisplayName ? (
                    <div className="space-y-2 mt-2">
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
                    <div className="flex items-center gap-2 mt-1">
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
                  <div className="flex items-center justify-between">
                    <div>
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Sign-in modal (for anonymous users) */}
      <SignInModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        defaultView="signin"
      />
    </SimplePageTransition>
  );
}
