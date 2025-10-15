/**
 * UserDropdown Component
 * Phase 5: Authentication Flow
 *
 * Dropdown menu for user profile and authentication actions.
 * Features:
 * - Display user email or "Anonymous" badge
 * - Sign In button (for anonymous users)
 * - Profile and Settings links (for authenticated users)
 * - Sign Out action
 * - Responsive design
 *
 * Pattern from: PRPs/phase5-authentication-flow-prd.md
 */

import { useState } from 'react';
import { User, Settings, LogOut, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthState, useAuthActions } from '../hooks/useAuth';
import SignInModal from './SignInModal';

/**
 * UserDropdown - User profile dropdown menu
 *
 * Usage:
 * ```tsx
 * // In DesktopHeader:
 * <UserDropdown />
 * ```
 */
export default function UserDropdown() {
  const { user } = useAuthState();
  const { signOut } = useAuthActions();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isAnonymous = user?.isAnonymous ?? true;

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch {
      // Error is already logged by AuthProvider
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="h-5 w-5" />
            <span className="sr-only">User menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              {isAnonymous ? (
                <>
                  <p className="text-sm font-medium">Anonymous User</p>
                  <Badge variant="secondary" className="w-fit text-xs">
                    Guest
                  </Badge>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">My Account</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {isAnonymous ? (
            // Anonymous user actions
            <>
              <DropdownMenuItem onClick={handleSignIn}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </DropdownMenuItem>
            </>
          ) : (
            // Authenticated user actions
            <>
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
                <LogOut className="mr-2 h-4 w-4" />
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sign-in modal (desktop) */}
      <SignInModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        defaultView="signin"
      />
    </>
  );
}
