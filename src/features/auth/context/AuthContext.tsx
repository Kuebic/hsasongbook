/**
 * Auth Context Definitions
 * Phase 5: Cloud Integration - Auth Foundation
 *
 * Performance optimization: Split into AuthStateContext and AuthActionsContext
 * to prevent unnecessary re-renders (actions rarely change, state changes frequently)
 *
 * Pattern from: src/lib/theme/ThemeProvider.tsx
 */

import { createContext } from 'react';
import type { AuthState, AuthActions } from '@/types/User.types';

/**
 * AuthStateContext - User state (changes frequently)
 * Consumers: Components that display user info (Header, Profile, etc.)
 */
export const AuthStateContext = createContext<AuthState | undefined>(undefined);

/**
 * AuthActionsContext - Auth actions (never changes)
 * Consumers: Components that trigger auth actions (SignInForm, UserDropdown, etc.)
 */
export const AuthActionsContext = createContext<AuthActions | undefined>(undefined);
