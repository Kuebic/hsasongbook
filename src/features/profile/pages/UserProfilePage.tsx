/**
 * UserProfilePage component
 *
 * Public-facing profile page that displays another user's information.
 * Accessed via /user/:username route.
 *
 * Features:
 * - Avatar display
 * - Username and display name (respecting privacy settings)
 * - Member since date
 * - User's public arrangements
 */

import { useParams, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimplePageTransition } from '../../shared/components/PageTransition';
import { PageSpinner } from '../../shared/components/LoadingStates';
import Breadcrumbs from '../../shared/components/Breadcrumbs';
import ArrangementCard from '@/features/arrangements/components/ArrangementCard';
import UserAvatar from '@/components/UserAvatar';
import { formatTimestamp } from '../../shared/utils/dateFormatter';
import { ArrowLeft, User, Music } from 'lucide-react';
import type { ArrangementWithSongAndCreator } from '@/types/Arrangement.types';

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();

  // Fetch user by username
  const userData = useQuery(
    api.users.getByUsername,
    username ? { username } : 'skip'
  );

  // Fetch user's arrangements
  const userArrangements = useQuery(
    api.arrangements.getByCreator,
    userData?._id ? { userId: userData._id } : 'skip'
  );

  // Map arrangements to frontend type
  const arrangements: ArrangementWithSongAndCreator[] = useMemo(() => {
    if (!userArrangements || !userData) return [];
    return userArrangements
      .filter((arr) => arr.song !== null)
      .map((arr) => ({
        id: arr._id,
        slug: arr.slug,
        songId: arr.songId,
        name: arr.name,
        key: arr.key ?? '',
        tempo: arr.tempo ?? 0,
        timeSignature: arr.timeSignature ?? '4/4',
        capo: arr.capo ?? 0,
        tags: arr.tags,
        rating: arr.rating,
        favorites: arr.favorites,
        chordProContent: arr.chordProContent,
        createdAt: new Date(arr._creationTime).toISOString(),
        updatedAt: arr.updatedAt
          ? new Date(arr.updatedAt).toISOString()
          : new Date(arr._creationTime).toISOString(),
        song: {
          id: arr.song!._id,
          slug: arr.song!.slug,
          title: arr.song!.title,
          artist: arr.song!.artist ?? '',
        },
        creator: {
          _id: userData._id,
          username: userData.username,
          displayName: userData.displayName,
          showRealName: userData.showRealName,
          avatarKey: userData.avatarKey,
        },
      }));
  }, [userArrangements, userData]);

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: userData?.username ? `@${userData.username}` : 'User', path: `/user/${username}` },
  ];

  // Get display name based on user preferences
  const getDisplayedName = () => {
    if (userData?.showRealName && userData?.displayName) {
      return userData.displayName;
    }
    if (userData?.username) {
      return `@${userData.username}`;
    }
    return 'Unknown User';
  };

  // Loading state
  const isLoading = username !== undefined && userData === undefined;
  if (isLoading) {
    return <PageSpinner message="Loading profile..." />;
  }

  // User not found
  if (!userData) {
    return (
      <SimplePageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">User not found</h2>
                <p className="text-muted-foreground text-sm">
                  The user @{username} doesn't exist or has been removed.
                </p>
              </div>
              <Link to="/">
                <Button className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to home
                </Button>
              </Link>
            </CardContent>
          </Card>
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
          <Card className="mb-8">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <div className="mb-6">
                <UserAvatar
                  userId={userData._id}
                  displayName={userData.displayName}
                  email={userData.email}
                  size="xl"
                />
              </div>

              <CardTitle className="text-2xl mb-2">{getDisplayedName()}</CardTitle>

              {/* Show username below display name if showing real name */}
              {userData.username && userData.showRealName && userData.displayName && (
                <p className="text-muted-foreground mb-2">@{userData.username}</p>
              )}

              <CardDescription className="text-base mb-4">
                Member since {formatTimestamp(userData._creationTime)}
              </CardDescription>

              {/* Stats */}
              <div className="flex gap-6 text-sm text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground">{arrangements.length}</span>
                  {' '}arrangement{arrangements.length !== 1 ? 's' : ''}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User's Arrangements */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Arrangements by {getDisplayedName()}
            </h2>

            {arrangements.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {arrangements.map((arrangement) => (
                  <ArrangementCard
                    key={arrangement.id}
                    arrangement={arrangement}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {getDisplayedName()} hasn't created any arrangements yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </SimplePageTransition>
  );
}
