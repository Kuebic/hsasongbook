/**
 * useAuth Hook - Convenience wrapper for auth contexts
 * Phase 5: Cloud Integration - Auth Foundation
 *
 * Combines AuthStateContext and AuthActionsContext for easier consumption.
 * Pattern from: src/lib/theme/ThemeProvider.tsx
 */

import { useContext } from 'react';
import { AuthStateContext, AuthActionsContext } from '../context/AuthContext';
import type { AuthState, AuthActions } from '@/types/User.types';

/**
 * Hook to access auth state (user, session, loading, etc.)
 */
export function useAuthState(): AuthState {
  const context = useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error('useAuthState must be used within AuthProvider');
  }
  return context;
}

/**
 * Hook to access auth actions (signIn, signOut, etc.)
 */
export function useAuthActions(): AuthActions {
  const context = useContext(AuthActionsContext);
  if (context === undefined) {
    throw new Error('useAuthActions must be used within AuthProvider');
  }
  return context;
}

/**
 * Convenience hook - Combines state + actions
 *
 * Usage:
 * ```tsx
 * const { user, loading, signIn, signOut } = useAuth();
 * ```
 */
export function useAuth(): AuthState & AuthActions {
  return {
    ...useAuthState(),
    ...useAuthActions(),
  };
}
