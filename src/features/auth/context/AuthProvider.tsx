/**
 * Auth Provider Component - Convex Implementation
 * MVP: Minimal auth with anonymous + email/password
 */

import { ReactNode, useEffect, useState, useMemo, useCallback } from 'react';
import { useConvexAuth } from "convex/react";
import { useAuthActions as useConvexAuthActions } from "@convex-dev/auth/react";
import { AuthStateContext, AuthActionsContext } from './AuthContext';
import type { User, AuthState, AuthActions } from '@/types/User.types';
import { useOnlineStatus } from '@/features/pwa/hooks/useOnlineStatus';
import logger from '@/lib/logger';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useConvexAuthActions();
  const isOnline = useOnlineStatus();
  const [error, setError] = useState<Error | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);

  // Auto sign-in anonymously on first load if not authenticated
  useEffect(() => {
    const initAnonymous = async () => {
      if (!isLoading && !isAuthenticated) {
        try {
          logger.info('No session found - signing in anonymously');
          await signIn("anonymous");
          setIsAnonymous(true);
        } catch (err) {
          logger.error('Anonymous sign-in failed:', err);
          setError(err as Error);
        }
      }
    };
    initAnonymous();
  }, [isLoading, isAuthenticated, signIn]);

  // Map to existing User type
  const user: User | null = useMemo(() => {
    if (!isAuthenticated) return null;
    return {
      id: 'convex-user', // MVP: actual user ID can be fetched via query later
      email: undefined,  // MVP: can add user query to get email
      isAnonymous,
      createdAt: new Date().toISOString(),
    };
  }, [isAuthenticated, isAnonymous]);

  // Auth actions - maintain same API surface for components
  const signInAnonymously = useCallback(async () => {
    try {
      setError(null);
      await signIn("anonymous");
      setIsAnonymous(true);
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
      setIsAnonymous(false);
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
      setIsAnonymous(false);
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
      setIsAnonymous(true);
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
    loading: isLoading,
    error,
    isOnline,
    offlineDays: 0, // MVP: Skip offline tracking
  }), [user, isLoading, error, isOnline]);

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
