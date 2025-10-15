/**
 * Auth Provider Component
 * Phase 5: Cloud Integration - Auth Foundation
 *
 * Responsibilities:
 * - Initialize with anonymous sign-in on first load
 * - Listen for auth state changes (onAuthStateChange)
 * - Handle token refresh with offline fallback
 * - Track offline days (14-day offline window)
 * - Provide auth methods (signIn, signUp, signOut, etc.)
 *
 * Pattern from: src/lib/theme/ThemeProvider.tsx + PRP AuthProvider example
 */

import { ReactNode, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthStateContext, AuthActionsContext } from './AuthContext';
import type { User, AuthSession, AuthState, AuthActions } from '@/types/User.types';
import { useOnlineStatus } from '@/features/pwa/hooks/useOnlineStatus';
import logger from '@/lib/logger';
import type { Session as SupabaseSession, User as SupabaseUser } from '@supabase/supabase-js';

const MAX_OFFLINE_DAYS = 14; // Maximum days user can stay offline before forced sign-out

interface AuthProviderProps {
  children: ReactNode;
}

// Helper: Map Supabase user to our User type
function mapSupabaseUserToUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    isAnonymous: supabaseUser.is_anonymous || false,
    createdAt: supabaseUser.created_at,
    lastSignInAt: supabaseUser.last_sign_in_at,
  };
}

// Helper: Map Supabase session to our AuthSession type
function mapSupabaseSessionToAuthSession(supabaseSession: SupabaseSession): AuthSession {
  return {
    accessToken: supabaseSession.access_token,
    refreshToken: supabaseSession.refresh_token,
    expiresAt: supabaseSession.expires_at || 0,
    expiresIn: supabaseSession.expires_in || 0,
    user: mapSupabaseUserToUser(supabaseSession.user),
  };
}

/**
 * AuthProvider - Manages authentication state and actions
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [offlineDays, setOfflineDays] = useState(0);

  // Hooks
  const isOnline = useOnlineStatus();

  // CRITICAL: Initialize with anonymous sign-in on first load
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Check if session exists in storage (IndexedDB via custom adapter)
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (existingSession) {
          // Session found - restore user
          logger.info('Session restored from storage');
          setUser(mapSupabaseUserToUser(existingSession.user));
          setSession(mapSupabaseSessionToAuthSession(existingSession));
        } else {
          // No session - sign in anonymously
          logger.info('No session found - signing in anonymously');
          const { data, error: anonError } = await supabase.auth.signInAnonymously();

          if (anonError) throw anonError;

          if (data.user && data.session) {
            setUser(mapSupabaseUserToUser(data.user));
            setSession(mapSupabaseSessionToAuthSession(data.session));
          }
        }
      } catch (err) {
        logger.error('Auth initialization failed:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // CRITICAL: Listen for auth state changes (token refresh, sign-out, etc.)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logger.info('Auth event:', event);

      switch (event) {
        case 'INITIAL_SESSION':
          // Already handled in initAuth
          break;

        case 'SIGNED_IN':
          if (session) {
            setUser(mapSupabaseUserToUser(session.user));
            setSession(mapSupabaseSessionToAuthSession(session));
          }
          setError(null);
          break;

        case 'TOKEN_REFRESHED':
          logger.debug('Token refreshed successfully');
          if (session) {
            setSession(mapSupabaseSessionToAuthSession(session));
          }
          setOfflineDays(0); // Reset offline counter

          // Trigger sync queue processing (future Phase 5.2)
          window.dispatchEvent(new CustomEvent('sync-queued-operations'));
          break;

        case 'SIGNED_OUT':
          // CRITICAL: Check if this is offline sign-out (don't clear user)
          if (!isOnline) {
            logger.warn('Token expired while offline - keeping user logged in locally');
            return; // Don't clear user state
          }

          // Online sign-out - clear everything
          logger.info('User signed out');
          setUser(null);
          setSession(null);
          setError(null);
          window.dispatchEvent(new CustomEvent('clear-user-cache'));
          break;

        case 'USER_UPDATED':
          if (session) {
            setUser(mapSupabaseUserToUser(session.user));
          }
          break;
      }
    });

    return () => subscription.unsubscribe();
  }, [isOnline]);

  // CRITICAL: Track offline duration (force sign-out after 14 days)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOnline && session) {
        const daysSinceRefresh = Math.floor(
          (Date.now() - session.expiresAt) / (1000 * 60 * 60 * 24)
        );

        setOfflineDays(daysSinceRefresh);

        // Force sign-out if offline too long
        if (daysSinceRefresh > MAX_OFFLINE_DAYS) {
          logger.warn(`Offline for ${daysSinceRefresh} days - forcing sign out`);
          supabase.auth.signOut();
        }
      }
    }, 1000 * 60 * 60 * 24); // Check daily

    return () => clearInterval(interval);
  }, [isOnline, session]);

  // Actions
  const signInAnonymously = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error: anonError } = await supabase.auth.signInAnonymously();

      if (anonError) throw anonError;

      logger.info('User signed in anonymously');
    } catch (err) {
      logger.error('Anonymous sign-in failed:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      logger.info('User signed in:', data.user?.email);
    } catch (err) {
      logger.error('Sign in failed:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      logger.info('User signed up:', data.user?.email);
    } catch (err) {
      logger.error('Sign up failed:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) throw signOutError;

      logger.info('User signed out');

      // Sign in anonymously after sign-out (preserve offline-first UX)
      await supabase.auth.signInAnonymously();
    } catch (err) {
      logger.error('Sign out failed:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const convertToAuthenticated = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // CRITICAL: updateUser() converts anonymous → authenticated (preserves user ID)
      const { data, error: updateError } = await supabase.auth.updateUser({
        email,
        password,
      });

      if (updateError) throw updateError;

      logger.info('Anonymous user converted to authenticated:', data?.user?.email);

      // Upload local data to Supabase
      // (Handled by useAnonymousConversion hook in calling component)
    } catch (err) {
      logger.error('Conversion failed:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const { error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        if (!isOnline) {
          logger.debug('Token refresh skipped (offline)');
          return;
        }

        throw refreshError;
      }

      logger.info('Session refreshed manually');
    } catch (err) {
      logger.error('Session refresh failed:', err);
      throw err;
    }
  };


  // Context values
  const stateValue: AuthState = useMemo(
    () => ({
      user,
      session,
      loading,
      error,
      isOnline,
      offlineDays,
    }),
    [user, session, loading, error, isOnline, offlineDays]
  );

  const actionsValue: AuthActions = useMemo(
    () => ({
      signInAnonymously,
      signIn,
      signUp,
      signOut,
      convertToAuthenticated,
      refreshSession,
    }),
    // Actions never change, so empty dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <AuthStateContext.Provider value={stateValue}>
      <AuthActionsContext.Provider value={actionsValue}>
        {children}
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
}
