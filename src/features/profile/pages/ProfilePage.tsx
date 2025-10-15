/**
 * ProfilePage component
 *
 * Phase 5: Displays user authentication state and account info.
 * Features:
 * - Shows user email for authenticated users
 * - Anonymous user badge for guests
 * - Sign-in prompt for anonymous users
 * - Sign-out button for authenticated users
 * - Link to Settings page
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SimplePageTransition } from '../../shared/components/PageTransition';
import Breadcrumbs from '../../shared/components/Breadcrumbs';
import { User, Settings, LogOut } from 'lucide-react';
import { useAuthState, useAuthActions } from '@/features/auth/hooks/useAuth';
import SignInModal from '@/features/auth/components/SignInModal';

export function ProfilePage() {
  const { user, loading } = useAuthState();
  const { signOut } = useAuthActions();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Profile', path: '/profile' }
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
      day: 'numeric'
    });
  };

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
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <div className="rounded-full bg-muted p-6 mb-6">
                <User className="h-16 w-16 text-muted-foreground" />
              </div>

              {isAnonymous ? (
                // Anonymous User View
                <>
                  <CardTitle className="text-2xl mb-2 flex items-center gap-2">
                    Welcome, Guest
                    <Badge variant="secondary">Anonymous</Badge>
                  </CardTitle>

                  <CardDescription className="text-base mb-6 max-w-md">
                    You're using HSA Songbook as a guest. Sign in to sync your data across devices and back up to the cloud.
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
                    {user?.email || 'User'}
                  </CardTitle>

                  <CardDescription className="text-base mb-6">
                    Member since {formatDate(user?.createdAt)}
                  </CardDescription>

                  {/* User Info */}
                  <div className="w-full max-w-md mb-8 p-4 rounded-md bg-muted text-left">
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Email:</dt>
                        <dd className="font-medium">{user?.email}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Account Type:</dt>
                        <dd className="font-medium">
                          <Badge>Authenticated</Badge>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">User ID:</dt>
                        <dd className="font-mono text-xs">{user?.id.substring(0, 8)}...</dd>
                      </div>
                    </dl>
                  </div>

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
