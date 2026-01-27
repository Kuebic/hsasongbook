/**
 * User type definitions for HSA Songbook authentication
 * Phase 5: Cloud Integration - Auth Foundation
 */

/**
 * User type definition
 * Represents authenticated or anonymous user
 */
export interface User {
  id: string;                          // UUID from Convex Auth
  email?: string;                      // Email (only for authenticated users)
  username?: string;                   // Unique public username
  displayName?: string;                // Optional real name
  showRealName?: boolean;              // Toggle to show displayName on contributions
  showRecentlyViewed?: boolean;        // Toggle to make recently viewed list public
  isAnonymous: boolean;                // True for anonymous users
  createdAt: string;                   // ISO timestamp
  lastSignInAt?: string;               // ISO timestamp (last sign-in time)
}

/**
 * Auth session type
 */
export interface AuthSession {
  accessToken: string;                 // JWT access token (1 hour expiry)
  refreshToken: string;                // Refresh token (30 days expiry)
  expiresAt: number;                   // Unix timestamp (access token expiry)
  expiresIn: number;                   // Seconds until expiry
  user: User;
}

/**
 * Auth state for React Context
 */
export interface AuthState {
  user: User | null;                   // Current user (null = not initialized)
  session: AuthSession | null;         // Current session
  loading: boolean;                    // Loading state (true during initialization)
  error: Error | null;                 // Auth error (sign-in failures, etc.)
  isOnline: boolean;                   // Network status
  offlineDays: number;                 // Days since last token refresh
}

/**
 * Auth actions for React Context
 */
export interface AuthActions {
  signInAnonymously: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  convertToAuthenticated: (email: string, password: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}
