/**
 * AccountSection Component
 *
 * Settings section for user account management.
 * Shows sign-in prompt for anonymous users, account info for authenticated users.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuthState, useAuthActions } from '@/features/auth/hooks/useAuth';
import SignInModal from '@/features/auth/components/SignInModal';

/**
 * Account Settings Section
 *
 * Displays account info and authentication actions.
 *
 * Features:
 * - Anonymous users: Sign-in prompt with modal
 * - Authenticated users: Email, member since date, sign out
 *
 * Usage:
 * ```tsx
 * // In SettingsPage:
 * <AccountSection />
 * ```
 */
export default function AccountSection() {
  const { user } = useAuthState();
  const { signOut } = useAuthActions();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isAnonymous = user?.isAnonymous ?? true;

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAnonymous ? (
            // Anonymous user view
            <>
              <p className="text-sm text-muted-foreground">
                Sign in to sync your data across devices and back up to the cloud.
              </p>
              <Button variant="outline" onClick={() => setShowAuthModal(true)}>
                Sign In
              </Button>
            </>
          ) : (
            // Authenticated user view
            <>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member since:</span>
                  <span className="font-medium">{formatDate(user?.createdAt)}</span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-destructive hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sign-in modal */}
      <SignInModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        defaultView="signin"
      />
    </>
  );
}
