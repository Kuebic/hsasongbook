/**
 * AuthProvider Component
 *
 * React Context provider for managing authentication state across the application.
 *
 * Features:
 * - Anonymous sign-in on first launch (offline-first)
 * - Email/password authentication
 * - Anonymous → authenticated conversion (preserves user ID)
 * - Automatic token refresh with offline fallback
 * - Session persistence via IndexedDB
 * - onAuthStateChange event handling
 *
 * Pattern from: PRPs/ai_docs/supabase-auth-anonymous-offline-patterns.md
 * Phase 5: Authentication Flow
 */

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import supabase from '@/lib/supabase';
import logger from '@/lib/logger';
import type { AuthContextData } from '../types';

// Initial state for auth context
const initialState: AuthContextData = {
  user: null,
  session: null,
  isLoading: true,
  isAnonymous: false,
  signInAnonymously: async () => {
    throw new Error('AuthProvider not initialized');
  },
  signInWithPassword: async () => {
    throw new Error('AuthProvider not initialized');
  },
  signUp: async () => {
    throw new Error('AuthProvider not initialized');
  },
  convertToAuthenticated: async () => {
    throw new Error('AuthProvider not initialized');
  },
  signOut: async () => {
    throw new Error('AuthProvider not initialized');
  },
  refreshSession: async () => {
    throw new Error('AuthProvider not initialized');
  },
};

// Create auth context
const AuthContext = createContext<AuthContextData>(initialState);

/**
 * AuthProvider Props
 */
export interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider Component
 *
 * Wraps the application to provide authentication state and controls.
 *
 * Usage:
 * ```tsx
 * // In App.tsx:
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <YourApp />
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Derived state: Check if user is anonymous
  const isAnonymous = user?.is_anonymous ?? false;

  /**
   * Sign in anonymously (for offline-first experience)
   * Called automatically on first app launch
   */
  const signInAnonymously = useCallback(async (): Promise<User> => {
    logger.info('Signing in anonymously...');

    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      logger.error('Anonymous sign-in failed:', error);
      throw error;
    }

    if (!data.user) {
      throw new Error('Anonymous sign-in failed: No user returned');
    }

    logger.info('Anonymous user created:', data.user.id);
    return data.user;
  }, []);

  /**
   * Sign in with email and password (existing user)
   */
  const signInWithPassword = useCallback(async (email: string, password: string): Promise<User> => {
    logger.info('Signing in with password...');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error('Sign in failed:', error);
      throw error;
    }

    if (!data.user) {
      throw new Error('Sign in failed: No user returned');
    }

    logger.info('User signed in:', data.user.email);
    return data.user;
  }, []);

  /**
   * Sign up new user (email + password)
   * This is for creating a brand new account (not converting anonymous)
   */
  const signUp = useCallback(async (email: string, password: string): Promise<User> => {
    logger.info('Signing up new user...');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      logger.error('Sign up failed:', error);
      throw error;
    }

    if (!data.user) {
      throw new Error('Sign up failed: No user returned');
    }

    logger.info('User signed up:', data.user.email);
    return data.user;
  }, []);

  /**
   * Convert anonymous user to authenticated user
   * CRITICAL: User ID is preserved (zero data loss)
   */
  const convertToAuthenticated = useCallback(async (email: string, password: string): Promise<User> => {
    logger.info('Converting anonymous user to authenticated...');

    if (!user?.is_anonymous) {
      throw new Error('User is not anonymous');
    }

    // Update anonymous user with email and password
    const { data, error } = await supabase.auth.updateUser({
      email,
      password,
    });

    if (error) {
      logger.error('Conversion failed:', error);
      throw error;
    }

    if (!data.user) {
      throw new Error('Conversion failed: No user returned');
    }

    logger.info('Anonymous user converted to authenticated:', data.user.id);

    // TODO: Upload local data to Supabase (Task 13)
    // await uploadLocalDataToCloud(data.user.id);

    return data.user;
  }, [user]);

  /**
   * Sign out current user
   * IMPORTANT: Keep local data in IndexedDB (user might want offline access)
   */
  const signOut = useCallback(async (): Promise<void> => {
    logger.info('Signing out user...');

    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('Sign out failed:', error);
      throw error;
    }

    logger.info('User signed out successfully');

    // Create new anonymous session for offline-first experience
    await signInAnonymously();
  }, [signInAnonymously]);

  /**
   * Manually refresh session (for testing or recovery)
   */
  const refreshSession = useCallback(async (): Promise<void> => {
    logger.info('Manually refreshing session...');

    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      if (!navigator.onLine) {
        logger.debug('Token refresh skipped (offline mode)');
        return;
      }

      logger.error('Session refresh failed:', error);
      throw error;
    }

    logger.info('Session refreshed successfully');
    setSession(data.session);
  }, []);

  /**
   * Initialize auth on mount
   * Get initial session and set up anonymous sign-in if needed
   */
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (initialSession) {
          logger.info('Existing session found:', initialSession.user.email || 'anonymous');
          setSession(initialSession);
          setUser(initialSession.user);
        } else {
          // No session - sign in anonymously for offline-first experience
          logger.info('No session found, signing in anonymously...');
          await signInAnonymously();
        }
      } catch (error) {
        logger.error('Failed to initialize auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [signInAnonymously]);

  /**
   * Listen for auth state changes
   * Handles: TOKEN_REFRESHED, SIGNED_IN, SIGNED_OUT, USER_UPDATED
   */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.debug('Auth event:', event);

        switch (event) {
          case 'INITIAL_SESSION':
            // Already handled in initialization
            break;

          case 'SIGNED_IN':
            logger.info('User signed in:', session?.user?.email || 'anonymous');
            setSession(session);
            setUser(session?.user ?? null);
            break;

          case 'SIGNED_OUT':
            // Only sign out if truly expired (not just network error)
            if (navigator.onLine) {
              logger.warn('User session expired');
              setSession(null);
              setUser(null);
            } else {
              logger.debug('Offline, keeping user logged in locally');
            }
            break;

          case 'TOKEN_REFRESHED':
            logger.debug('Tokens refreshed successfully');
            setSession(session);
            // TODO: Trigger sync of queued offline operations (Task 13)
            // await syncQueuedOperations();
            break;

          case 'USER_UPDATED':
            logger.info('User profile updated');
            setSession(session);
            setUser(session?.user ?? null);
            break;

          case 'PASSWORD_RECOVERY':
            logger.info('Password recovery flow started');
            break;
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Listen for online/offline events to handle token refresh
   */
  useEffect(() => {
    const handleOnline = async () => {
      logger.info('Network connection restored');

      if (!user || !session) return;

      try {
        // Attempt to refresh session
        const { data, error } = await supabase.auth.refreshSession();

        if (error) {
          // Refresh token expired (user offline > 30 days)
          logger.warn('Session expired, requiring re-authentication');
          await supabase.auth.signOut();
        } else {
          // Success! Sync queued operations
          logger.info('Session refreshed successfully after reconnection');
          setSession(data.session);
          // TODO: Sync queued operations (Task 13)
          // await syncQueuedOperations();
        }
      } catch (error) {
        logger.error('Failed to refresh session after reconnection:', error);
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [user, session]);

  // Context value
  const value: AuthContextData = {
    user,
    session,
    isLoading,
    isAnonymous,
    signInAnonymously,
    signInWithPassword,
    signUp,
    convertToAuthenticated,
    signOut,
    refreshSession,
  };

  // Show loading spinner during initial auth check
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              Loading...
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access auth context
 *
 * Must be used within an AuthProvider component tree.
 * Throws an error if used outside of provider.
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { user, isAnonymous, signInWithPassword } = useAuth();
 *
 *   if (isAnonymous) {
 *     return <SignInButton />;
 *   }
 *
 *   return <div>Welcome, {user.email}!</div>;
 * }
 * ```
 *
 * @returns Auth state and methods
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
