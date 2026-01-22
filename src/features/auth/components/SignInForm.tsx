/**
 * SignInForm Component
 * Phase 5: Authentication Flow
 *
 * Form for signing in with email and password.
 * Features:
 * - React Hook Form with Zod validation
 * - Email and password fields
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
import { signInSchema } from '../validation/authSchemas';
import { AlertCircle } from 'lucide-react';

// Infer TypeScript type from Zod schema
type SignInFormData = z.infer<typeof signInSchema>;

interface SignInFormProps {
  /** @deprecated No longer used - page reloads after sign-in due to Convex Auth state race condition */
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
}

/**
 * SignInForm - Email/password authentication form
 *
 * Usage:
 * ```tsx
 * <SignInForm
 *   onSwitchToSignUp={() => setShowSignUp(true)}
 * />
 * ```
 */
export default function SignInForm({ onSwitchToSignUp }: SignInFormProps) {
  const { signIn } = useAuthActions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize react-hook-form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: 'onBlur', // Validate on blur for better UX
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Call auth action
      await signIn(data.email, data.password);

      // Workaround for Convex Auth state race condition:
      // useConvexAuth() doesn't update reliably after signIn resolves.
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
          placeholder="Enter your password"
          autoComplete="current-password"
          disabled={isSubmitting}
          aria-invalid={errors.password ? 'true' : 'false'}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit button */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </Button>

      {/* Switch to sign-up */}
      {onSwitchToSignUp && (
        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-primary hover:underline font-medium"
            disabled={isSubmitting}
          >
            Sign up
          </button>
        </div>
      )}
    </form>
  );
}
