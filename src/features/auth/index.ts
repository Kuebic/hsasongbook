/**
 * Auth Feature Barrel Export
 *
 * Phase 5: Authentication Flow
 *
 * Exports:
 * - Components: AuthProvider, SignInModal, SignInPage, SignUpModal, SignUpPage, SignInBanner
 * - Hooks: useAuth, useSupabase, useSession
 * - Types: AuthContextData, SignInFormData, SignUpFormData, AuthError, AuthResult
 * - Utils: getUserFriendlyErrorMessage, isNetworkError, isRateLimitError
 */

// Components
export { AuthProvider } from './components/AuthProvider';
// TODO: Add exports as components are created
// export { SignInModal } from './components/SignInModal';
// export { SignInPage } from './components/SignInPage';
// export { SignUpModal } from './components/SignUpModal';
// export { SignUpPage } from './components/SignUpPage';
// export { SignInBanner } from './components/SignInBanner';

// Hooks
export { useAuth } from './hooks/useAuth';
// TODO: Add exports as hooks are created
// export { useSupabase } from './hooks/useSupabase';
// export { useSession } from './hooks/useSession';

// Types
export type {
  AuthContextData,
  SignInFormData,
  SignUpFormData,
  AuthError,
  AuthResult,
  User,
  Session,
} from './types';

// Utils
export {
  getUserFriendlyErrorMessage,
  isNetworkError,
  isRateLimitError,
  calculateBackoffDelay,
} from './utils/errors';
