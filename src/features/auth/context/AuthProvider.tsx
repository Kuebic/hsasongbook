/**
 * Auth Provider Component - Convex Implementation
 * MVP: Minimal auth with anonymous + email/password
 */

import { ReactNode, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { useAuthActions as useConvexAuthActions } from "@convex-dev/auth/react";
import { AuthStateContext, AuthActionsContext } from './AuthContext';
import type { User, AuthState, AuthActions } from '@/types/User.types';
import { useOnlineStatus } from '@/features/pwa/hooks/useOnlineStatus';
import logger from '@/lib/logger';
import { api } from "../../../../convex/_generated/api";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useConvexAuthActions();
  const { isOnline } = useOnlineStatus();
  const [error, setError] = useState<Error | null>(null);

  // Fetch actual user data from Convex
  const convexUser = useQuery(api.users.currentUser);
  const setUsernameMutation = useMutation(api.users.setUsername);
  const pendingUsernameProcessed = useRef(false);

  // Auto sign-in anonymously on first load if not authenticated
  useEffect(() => {
    const initAnonymous = async () => {
      if (!isLoading && !isAuthenticated) {
        try {
          logger.info('No session found - signing in anonymously');
          await signIn("anonymous");
        } catch (err) {
          logger.error('Anonymous sign-in failed:', err);
          setError(err as Error);
        }
      }
    };
    initAnonymous();
  }, [isLoading, isAuthenticated, signIn]);

  // Handle pending username from signup (set after page reload)
  useEffect(() => {
    const setPendingUsername = async () => {
      // Only run once per mount, when user is loaded and authenticated
      if (pendingUsernameProcessed.current) return;
      if (!convexUser) return;
      if (!convexUser.email) return; // Only for authenticated users
      if (convexUser.username) return; // Already has username

      const pendingUsername = localStorage.getItem('pendingUsername');
      if (!pendingUsername) return;

      pendingUsernameProcessed.current = true;
      localStorage.removeItem('pendingUsername');

      try {
        await setUsernameMutation({ username: pendingUsername });
        logger.info('Set pending username after signup:', pendingUsername);
      } catch (err) {
        logger.error('Failed to set pending username:', err);
        // User can set it manually from profile page
      }
    };

    setPendingUsername();
  }, [convexUser, setUsernameMutation]);

  // Map Convex user to existing User type
  const user: User | null = useMemo(() => {
    // Wait for both auth state and user data to load
    if (!isAuthenticated) return null;
    if (convexUser === undefined) return null; // Still loading
    if (convexUser === null) return null; // No user found

    // Check if user has email (authenticated) or is anonymous
    const hasEmail = convexUser.email !== undefined && convexUser.email !== null;

    return {
      id: convexUser._id,
      email: convexUser.email,
      username: convexUser.username,
      displayName: convexUser.displayName,
      showRealName: convexUser.showRealName,
      isAnonymous: !hasEmail,
      createdAt: new Date(convexUser._creationTime).toISOString(),
    };
  }, [isAuthenticated, convexUser]);

  // Auth actions - maintain same API surface for components
  const signInAnonymously = useCallback(async () => {
    try {
      setError(null);
      await signIn("anonymous");
      logger.info('User signed in anonymously');
    } catch (err) {
      logger.error('Anonymous sign-in failed:', err);
      setError(err as Error);
      throw err;
    }
  }, [signIn]);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      await signIn("password", { email, password, flow: "signIn" });
      logger.info('User signed in:', email);
    } catch (err) {
      logger.error('Sign in failed:', err);
      setError(err as Error);
      throw err;
    }
  }, [signIn]);

  const signUpWithPassword = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      await signIn("password", { email, password, flow: "signUp" });
      logger.info('User signed up:', email);
    } catch (err) {
      logger.error('Sign up failed:', err);
      setError(err as Error);
      throw err;
    }
  }, [signIn]);

  const handleSignOut = useCallback(async () => {
    try {
      setError(null);
      await signOut();
      logger.info('User signed out');
      // Return to anonymous state
      await signIn("anonymous");
    } catch (err) {
      logger.error('Sign out failed:', err);
      setError(err as Error);
      throw err;
    }
  }, [signIn, signOut]);

  const convertToAuthenticated = useCallback(async (email: string, password: string) => {
    // MVP: Just sign up fresh - anonymous linking can be added later
    await signUpWithPassword(email, password);
  }, [signUpWithPassword]);

  const refreshSession = useCallback(async () => {
    // Convex handles this automatically - no-op for MVP
    logger.debug('Session refresh requested (handled by Convex)');
  }, []);

  // Context values
  const stateValue: AuthState = useMemo(() => ({
    user,
    session: null, // MVP: Not exposing session tokens
    loading: isLoading || (isAuthenticated && convexUser === undefined),
    error,
    isOnline,
    offlineDays: 0, // MVP: Skip offline tracking
  }), [user, isLoading, isAuthenticated, convexUser, error, isOnline]);

  const actionsValue: AuthActions = useMemo(() => ({
    signInAnonymously,
    signIn: signInWithPassword,
    signUp: signUpWithPassword,
    signOut: handleSignOut,
    convertToAuthenticated,
    refreshSession,
  }), [signInAnonymously, signInWithPassword, signUpWithPassword, handleSignOut, convertToAuthenticated, refreshSession]);

  return (
    <AuthStateContext.Provider value={stateValue}>
      <AuthActionsContext.Provider value={actionsValue}>
        {children}
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
}
