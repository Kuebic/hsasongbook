/**
 * ForgotPasswordForm Component
 * Password reset flow using email verification code.
 *
 * Two-step flow:
 * 1. Request reset: Enter email to receive 8-digit code
 * 2. Reset password: Enter code and new password
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthActions as useConvexAuthActions } from '@convex-dev/auth/react';
import { AlertCircle } from 'lucide-react';
import { extractErrorMessage } from '@/lib/utils';
import { emailSchema, passwordSchema } from '../validation/authSchemas';

// Step 1: Request reset code
const requestResetSchema = z.object({
  email: emailSchema,
});

type RequestResetFormData = z.infer<typeof requestResetSchema>;

// Step 2: Enter code and new password
const resetPasswordSchema = z
  .object({
    code: z
      .string()
      .length(8, 'Code must be 8 digits')
      .regex(/^\d+$/, 'Code must be numeric'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ForgotPasswordForm({
  onSuccess,
  onCancel,
}: ForgotPasswordFormProps) {
  const { signIn } = useConvexAuthActions();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form for step 1: request reset
  const requestForm = useForm<RequestResetFormData>({
    resolver: zodResolver(requestResetSchema),
    mode: 'onBlur',
  });

  // Form for step 2: reset password
  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
  });

  const handleRequestReset = async (data: RequestResetFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await signIn('password', { email: data.email, flow: 'reset' });
      setEmail(data.email);
      setStep('reset');
    } catch (error) {
      setSubmitError(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await signIn('password', {
        email,
        code: data.code,
        newPassword: data.newPassword,
        flow: 'reset-verification',
      });
      onSuccess?.();
    } catch (error) {
      setSubmitError(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Request reset code
  if (step === 'request') {
    return (
      <form
        onSubmit={requestForm.handleSubmit(handleRequestReset)}
        className="space-y-4"
      >
        {submitError && (
          <div
            className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{submitError}</p>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          Enter your email and we'll send you a code to reset your password.
        </p>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isSubmitting}
            aria-invalid={requestForm.formState.errors.email ? 'true' : 'false'}
            {...requestForm.register('email')}
          />
          {requestForm.formState.errors.email && (
            <p className="text-sm text-destructive mt-1">
              {requestForm.formState.errors.email.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send Reset Code'}
        </Button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-muted-foreground hover:underline w-full text-center"
          >
            Back to sign in
          </button>
        )}
      </form>
    );
  }

  // Step 2: Reset password with code
  return (
    <form
      onSubmit={resetForm.handleSubmit(handleResetPassword)}
      className="space-y-4"
    >
      {submitError && (
        <div
          className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{submitError}</p>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        We sent a code to <strong>{email}</strong>.
      </p>

      <div>
        <Label htmlFor="code">Reset Code</Label>
        <Input
          id="code"
          name="reset-code"
          type="text"
          inputMode="numeric"
          maxLength={8}
          placeholder="12345678"
          autoComplete="off"
          disabled={isSubmitting}
          aria-invalid={resetForm.formState.errors.code ? 'true' : 'false'}
          {...resetForm.register('code')}
        />
        {resetForm.formState.errors.code && (
          <p className="text-sm text-destructive mt-1">
            {resetForm.formState.errors.code.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="Enter new password"
          autoComplete="new-password"
          disabled={isSubmitting}
          aria-invalid={
            resetForm.formState.errors.newPassword ? 'true' : 'false'
          }
          {...resetForm.register('newPassword')}
        />
        <p className="text-xs text-muted-foreground mt-1">
          8+ chars, uppercase, lowercase, number
        </p>
        {resetForm.formState.errors.newPassword && (
          <p className="text-sm text-destructive mt-1">
            {resetForm.formState.errors.newPassword.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm new password"
          autoComplete="new-password"
          disabled={isSubmitting}
          aria-invalid={
            resetForm.formState.errors.confirmPassword ? 'true' : 'false'
          }
          {...resetForm.register('confirmPassword')}
        />
        {resetForm.formState.errors.confirmPassword && (
          <p className="text-sm text-destructive mt-1">
            {resetForm.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Resetting...' : 'Reset Password'}
      </Button>

      <button
        type="button"
        onClick={() => {
          setStep('request');
          setSubmitError(null);
          resetForm.reset();
        }}
        className="text-sm text-muted-foreground hover:underline w-full text-center"
      >
        Try a different email
      </button>
    </form>
  );
}
