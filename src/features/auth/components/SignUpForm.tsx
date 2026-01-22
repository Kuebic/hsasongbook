/**
 * SignUpForm Component
 * Phase 5: Authentication Flow
 *
 * Form for creating a new account with email and password.
 * Features:
 * - React Hook Form with Zod validation
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
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthActions } from '../hooks/useAuth';
import { signUpSchema } from '../validation/authSchemas';
import { AlertCircle } from 'lucide-react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize react-hook-form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onBlur', // Validate on blur for better UX
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Call auth action
      await signUp(data.email, data.password);

      // Workaround for Convex Auth state race condition:
      // useConvexAuth() doesn't update reliably after signUp resolves.
      // See POST_MVP_ROADMAP.md "Convex Auth Sign-in State Race Condition"
      location.reload();
    } catch (error) {
      // Display error message
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred. Please try again.';
      setSubmitError(errorMessage);
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
