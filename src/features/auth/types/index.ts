/**
 * Auth Feature Type Definitions
 *
 * Phase 5: Authentication Flow
 */

import type { User, Session } from '@supabase/supabase-js';

export type { User, Session } from '@supabase/supabase-js';

/**
 * Auth context state
 * Provides authentication state to the entire application
 */
export interface AuthContextData {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAnonymous: boolean;
  signInAnonymously: () => Promise<User>;
  signInWithPassword: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string) => Promise<User>;
  convertToAuthenticated: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

/**
 * Sign-in form data
 */
export interface SignInFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Sign-up form data
 */
export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Auth error types
 */
export interface AuthError {
  code: string;
  message: string;
  status?: number;
}

/**
 * Auth operation result
 */
export interface AuthResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
