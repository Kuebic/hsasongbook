/**
 * EmailVerificationForm Component
 * Email verification flow using 8-digit OTP code.
 *
 * Shows verification code input and handles resending codes.
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
import { verificationCodeSchema } from '../validation/authSchemas';

const verifyCodeSchema = z.object({
  code: verificationCodeSchema,
});

type VerifyCodeFormData = z.infer<typeof verifyCodeSchema>;

interface EmailVerificationFormProps {
  email: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EmailVerificationForm({
  email,
  onSuccess,
  onCancel,
}: EmailVerificationFormProps) {
  const { signIn } = useConvexAuthActions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);

  const form = useForm<VerifyCodeFormData>({
    resolver: zodResolver(verifyCodeSchema),
    mode: 'onBlur',
  });

  const handleVerify = async (data: VerifyCodeFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setResendSuccess(false);
      await signIn('password', {
        email,
        code: data.code,
        flow: 'email-verification',
      });
      onSuccess?.();
    } catch (error) {
      setSubmitError(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsResending(true);
      setSubmitError(null);
      setResendSuccess(false);
      await signIn('resend-otp-verify', { email });
      setResendSuccess(true);
    } catch (error) {
      setSubmitError(extractErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleVerify)} className="space-y-4">
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
        We sent a verification code to <strong>{email}</strong>.
      </p>

      <div>
        <Label htmlFor="code">Verification Code</Label>
        <Input
          id="code"
          name="verification-code"
          type="text"
          inputMode="numeric"
          maxLength={8}
          placeholder="12345678"
          autoComplete="one-time-code"
          disabled={isSubmitting}
          aria-invalid={form.formState.errors.code ? 'true' : 'false'}
          {...form.register('code')}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Enter the 8-digit code from your email
        </p>
        {form.formState.errors.code && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.code.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Verifying...' : 'Verify Email'}
      </Button>

      <div className="flex flex-col gap-2 text-center">
        {resendSuccess && (
          <p className="text-xs text-green-600">
            A new code has been sent to your email.
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isResending || isSubmitting}
            className="text-primary hover:underline disabled:opacity-50"
          >
            {isResending ? 'Sending...' : 'Resend code'}
          </button>
        </p>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-primary hover:underline"
          >
            Use a different email
          </button>
        )}
      </div>
    </form>
  );
}
