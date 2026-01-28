/**
 * Auth Module Barrel Export
 * Phase 5: Authentication Flow
 *
 * Centralizes all auth exports for cleaner imports.
 *
 * Usage:
 * ```tsx
 * // Instead of:
 * import { useAuth } from '@/features/auth/hooks/useAuth';
 * import SignInForm from '@/features/auth/components/SignInForm';
 *
 * // Use:
 * import { useAuth, SignInForm } from '@/features/auth';
 * ```
 */

// Hooks
export { useAuth, useAuthState, useAuthActions } from './hooks/useAuth';

// Components
export { default as SignInForm } from './components/SignInForm';
export { default as SignUpForm } from './components/SignUpForm';
export { default as SignInModal } from './components/SignInModal';
export { default as UserDropdown } from './components/UserDropdown';
export { default as ProfilePictureUpload } from './components/ProfilePictureUpload';
export { default as ForgotPasswordForm } from './components/ForgotPasswordForm';

// Pages
export { default as SignInPage } from './pages/SignInPage';
export { default as SignUpPage } from './pages/SignUpPage';
export { default as ForgotPasswordPage } from './pages/ForgotPasswordPage';

// Context (rarely needed directly, use hooks instead)
export { AuthProvider } from './context/AuthProvider';
export { AuthStateContext, AuthActionsContext } from './context/AuthContext';

// Validation schemas (for form usage)
export {
  signInSchema,
  signUpSchema,
  emailSchema,
  passwordSchema,
  verificationCodeSchema,
  passwordResetSchema,
} from './validation/authSchemas';

// Types (re-exported from @/types/User.types.ts for convenience)
export type {
  User,
  AuthSession,
  AuthState,
  AuthActions,
} from '@/types/User.types';
