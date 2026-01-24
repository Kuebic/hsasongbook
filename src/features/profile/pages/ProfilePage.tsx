/**
 * ProfilePage component
 *
 * Public-facing profile page that displays user information.
 * This is what others see when clicking on a username in arrangements.
 *
 * Features:
 * - Avatar display
 * - Username and display name
 * - Member since date
 * - User's arrangements (created + collaborating on)
 *
 * For editing profile settings, see Settings > Account section.
 */

import { Link } from 'react-router-dom';
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SimplePageTransition } from '../../shared/components/PageTransition';
import Breadcrumbs from '../../shared/components/Breadcrumbs';
import { Settings, Users } from 'lucide-react';
import { useAuthState } from '@/features/auth/hooks/useAuth';
import SignInModal from '@/features/auth/components/SignInModal';
import { MyArrangementsList } from '../components/MyArrangementsList';
import { MyFavoritesList } from '../components/MyFavoritesList';
import UserAvatar from '@/components/UserAvatar';
import { formatDateString } from '../../shared/utils/dateFormatter';
import type { Id } from '../../../../convex/_generated/dataModel';
import { useState } from 'react';

export function ProfilePage() {
  const { user, loading } = useAuthState();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Profile', path: '/profile' },
  ];

  const isAnonymous = user?.isAnonymous ?? true;

  // Get display name based on user preferences
  const getDisplayedName = () => {
    if (user?.showRealName && user?.displayName) {
      return user.displayName;
    }
    if (user?.username) {
      return `@${user.username}`;
    }
    return user?.email || 'User';
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
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumbs items={breadcrumbs} />
          </div>

          {/* Profile Card */}
          <Card>
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
                // Authenticated User View (public profile)
                <>
                  <CardTitle className="text-2xl mb-2">
                    {getDisplayedName()}
                  </CardTitle>

                  {/* Show username below display name if showing real name */}
                  {user?.username && user?.showRealName && user?.displayName && (
                    <p className="text-muted-foreground mb-2">
                      @{user.username}
                    </p>
                  )}

                  <CardDescription className="text-base mb-6">
                    Member since {formatDateString(user?.createdAt)}
                  </CardDescription>

                  {/* Navigation Links */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mt-2">
                    <Link to="/groups" className="flex-1">
                      <Button variant="outline" className="w-full min-h-[44px]">
                        <Users className="h-4 w-4 mr-2" />
                        Groups
                      </Button>
                    </Link>

                    <Link to="/settings" className="flex-1">
                      <Button variant="outline" className="w-full min-h-[44px]">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* My Favorites Section - only for authenticated users */}
          {!isAnonymous && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">My Favorites</h2>
              <MyFavoritesList />
            </div>
          )}

          {/* My Arrangements Section - only for authenticated users */}
          {!isAnonymous && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">My Arrangements</h2>
              <MyArrangementsList />
            </div>
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
