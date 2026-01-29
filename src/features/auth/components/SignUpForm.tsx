/**
 * SignUpForm Component
 * Phase 5: Authentication Flow
 *
 * Form for creating a new account with username, email, and password.
 * Features:
 * - React Hook Form with Zod validation
 * - Username field with real-time availability check
 * - Email, password, and confirm password fields
 * - Password strength requirements display
 * - Loading state during submission
 * - Error display
 * - Accessibility support (ARIA labels)
 *
 * Pattern from: PRPs/phase5-authentication-flow-prd.md
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { useQuery, useMutation } from 'convex/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthActions } from '../hooks/useAuth';
import { signUpSchema } from '../validation/authSchemas';
import { AlertCircle, Check, X, Loader2 } from 'lucide-react';
import { api } from '../../../../convex/_generated/api';
import { useDebounce } from '@/features/shared/hooks/useDebounce';
import { extractErrorMessage } from '@/lib/utils';

// Infer TypeScript type from Zod schema
type SignUpFormData = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  /** @deprecated No longer used - page reloads after sign-up due to Convex Auth state race condition */
  onSuccess?: () => void;
  onSwitchToSignIn?: () => void;
}

/**
 * SignUpForm - New account creation form
 *
 * Usage:
 * ```tsx
 * <SignUpForm
 *   onSwitchToSignIn={() => setShowSignIn(true)}
 * />
 * ```
 */
export default function SignUpForm({ onSwitchToSignIn }: SignUpFormProps) {
  const { signUp } = useAuthActions();
  const _setUsername = useMutation(api.users.setUsername);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Username availability checking
  const [usernameToCheck, setUsernameToCheck] = useState('');
  const debouncedUsername = useDebounce(usernameToCheck, 300);

  // Only query when we have a valid-looking username (3+ chars, valid format)
  const shouldCheckUsername =
    debouncedUsername.length >= 3 && /^[a-z0-9_-]+$/.test(debouncedUsername);

  const usernameAvailability = useQuery(
    api.users.isUsernameAvailable,
    shouldCheckUsername ? { username: debouncedUsername } : 'skip'
  );

  const isCheckingUsername =
    usernameToCheck !== debouncedUsername ||
    (shouldCheckUsername && usernameAvailability === undefined);

  // Initialize react-hook-form with Zod validation
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onBlur', // Validate on blur for better UX
  });

  // Watch username field for availability checking
  const watchedUsername = watch('username');
  useEffect(() => {
    if (watchedUsername) {
      setUsernameToCheck(watchedUsername.toLowerCase());
    } else {
      setUsernameToCheck('');
    }
  }, [watchedUsername]);

  // Get username availability status for display
  const getUsernameStatus = useCallback(() => {
    if (!usernameToCheck || usernameToCheck.length < 3) return null;
    if (isCheckingUsername) return 'checking';
    if (!usernameAvailability) return null;
    if (usernameAvailability.available) return 'available';
    return 'taken';
  }, [usernameToCheck, isCheckingUsername, usernameAvailability]);

  const onSubmit = async (data: SignUpFormData) => {
    // Prevent submission if username is taken
    if (usernameAvailability && !usernameAvailability.available) {
      setSubmitError(
        usernameAvailability.reason || 'Username is already taken'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Store username and email in localStorage for after verification
      // Username will be set by AuthProvider after verification completes
      localStorage.setItem('pendingUsername', data.username);
      localStorage.setItem('pendingVerificationEmail', data.email);

      // Create auth account - this triggers the verification email
      await signUp(data.email, data.password);

      // Redirect to email verification page
      window.location.href = '/auth/verify-email';
    } catch (error) {
      // Clear pending username on error
      localStorage.removeItem('pendingUsername');
      setSubmitError(extractErrorMessage(error));
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Global error message */}
      {submitError && (
        <div
          className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{submitError}</p>
        </div>
      )}

      {/* Username field */}
      <div>
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <Input
            id="username"
            type="text"
            placeholder="your_username"
            autoComplete="username"
            disabled={isSubmitting}
            aria-invalid={errors.username ? 'true' : 'false'}
            aria-describedby={
              errors.username
                ? 'username-error username-requirements'
                : 'username-requirements'
            }
            className="pr-10"
            {...register('username')}
          />
          {/* Availability indicator */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {getUsernameStatus() === 'checking' && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {getUsernameStatus() === 'available' && (
              <Check className="h-4 w-4 text-green-500" />
            )}
            {getUsernameStatus() === 'taken' && (
              <X className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>
        <p
          id="username-requirements"
          className="text-xs text-muted-foreground mt-1"
        >
          3-30 characters. Lowercase letters, numbers, underscores, and hyphens
          only.
        </p>
        {errors.username && (
          <p id="username-error" className="text-sm text-destructive mt-1">
            {errors.username.message}
          </p>
        )}
        {getUsernameStatus() === 'taken' && !errors.username && (
          <p className="text-sm text-destructive mt-1">
            {usernameAvailability?.reason || 'Username is already taken'}
          </p>
        )}
      </div>

      {/* Email field */}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          disabled={isSubmitting}
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive mt-1">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password field */}
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Create a strong password"
          autoComplete="new-password"
          disabled={isSubmitting}
          aria-invalid={errors.password ? 'true' : 'false'}
          aria-describedby={errors.password ? 'password-error password-requirements' : 'password-requirements'}
          {...register('password')}
        />
        <p id="password-requirements" className="text-xs text-muted-foreground mt-1">
          Must be at least 8 characters with one uppercase, one lowercase, and one number.
        </p>
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm password field */}
      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          disabled={isSubmitting}
          aria-invalid={errors.confirmPassword ? 'true' : 'false'}
          aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p id="confirm-password-error" className="text-sm text-destructive mt-1">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit button */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account...' : 'Sign Up'}
      </Button>

      {/* Switch to sign-in */}
      {onSwitchToSignIn && (
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="text-primary hover:underline font-medium"
            disabled={isSubmitting}
          >
            Sign in
          </button>
        </div>
      )}
    </form>
  );
}
