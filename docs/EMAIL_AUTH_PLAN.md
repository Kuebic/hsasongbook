# Email Verification & Password Reset Implementation Plan

**Created**: 2026-01-28
**Status**: Ready for implementation when Resend account is set up

## Summary

Implement email verification and password reset for HSA Songbook using Convex Auth + Resend, plus essential pre-release items for a small group (~50 users) launch.

---

## Prerequisites

1. **Sign up for Resend** at [resend.com](https://resend.com)
   - Free tier: 100 emails/day (sufficient for small group)
   - Get API key from dashboard
   - Verify a sending domain or use their test domain initially

2. **Install dependencies**
   ```bash
   npm install resend
   ```

3. **Set Convex environment variables**
   ```bash
   npx convex env set AUTH_RESEND_KEY "re_xxxxx"
   npx convex env set AUTH_EMAIL "HSA Songbook <noreply@yourdomain.com>"
   ```

---

## Backend Changes

### 1. Create email provider for verification

**New file: `convex/email/ResendOTP.ts`**

```typescript
import { Email } from "@convex-dev/auth/providers/Email";
import { alphabet, generateRandomString } from "oslo/crypto";
import { Resend as ResendAPI } from "resend";

export const ResendOTP = Email({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 20, // 20 minutes

  async generateVerificationToken() {
    return generateRandomString(8, alphabet("0-9"));
  },

  async sendVerificationRequest({ identifier: email, provider, token, expires }) {
    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: process.env.AUTH_EMAIL ?? "HSA Songbook <noreply@yourdomain.com>",
      to: [email],
      subject: "Verify your email for HSA Songbook",
      html: `
        <h1>Verify your email</h1>
        <p>Your verification code is: <strong>${token}</strong></p>
        <p>This code expires in 20 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });

    if (error) {
      throw new Error(JSON.stringify(error));
    }
  },
});
```

### 2. Create email provider for password reset

**New file: `convex/email/ResendOTPPasswordReset.ts`**

```typescript
import { Email } from "@convex-dev/auth/providers/Email";
import { alphabet, generateRandomString } from "oslo/crypto";
import { Resend as ResendAPI } from "resend";

export const ResendOTPPasswordReset = Email({
  id: "resend-otp-password-reset",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 15, // 15 minutes for security

  async generateVerificationToken() {
    return generateRandomString(8, alphabet("0-9"));
  },

  async sendVerificationRequest({ identifier: email, provider, token, expires }) {
    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: process.env.AUTH_EMAIL ?? "HSA Songbook <noreply@yourdomain.com>",
      to: [email],
      subject: "Reset your HSA Songbook password",
      html: `
        <h1>Password Reset</h1>
        <p>Your password reset code is: <strong>${token}</strong></p>
        <p>This code expires in 15 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });

    if (error) {
      throw new Error(JSON.stringify(error));
    }
  },
});
```

### 3. Update `convex/auth.ts`

```typescript
import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";
import { ResendOTP } from "./email/ResendOTP";
import { ResendOTPPasswordReset } from "./email/ResendOTPPasswordReset";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Anonymous,
    Password({
      verify: ResendOTP,              // Enable email verification
      reset: ResendOTPPasswordReset,  // Enable password reset
    }),
  ],
});
```

---

## Frontend Changes

### 1. Add validation schemas

**Update `src/features/auth/validation/authSchemas.ts`** - add these:

```typescript
/**
 * Email verification code schema
 */
export const verificationCodeSchema = z
  .string()
  .length(8, 'Code must be 8 digits')
  .regex(/^\d+$/, 'Code must contain only numbers');

/**
 * Password reset schema (step 2)
 */
export const passwordResetSchema = z
  .object({
    code: verificationCodeSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
```

### 2. Create ForgotPasswordForm

**New file: `src/features/auth/components/ForgotPasswordForm.tsx`**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthActions as useConvexAuthActions } from "@convex-dev/auth/react";
import { AlertCircle } from 'lucide-react';
import { extractErrorMessage } from '@/lib/utils';
import { emailSchema, passwordSchema } from '../validation/authSchemas';

const requestResetSchema = z.object({ email: emailSchema });

const resetPasswordSchema = z.object({
  code: z.string().length(8, 'Code must be 8 digits').regex(/^\d+$/, 'Code must be numeric'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ForgotPasswordForm({ onSuccess, onCancel }: ForgotPasswordFormProps) {
  const { signIn } = useConvexAuthActions();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const requestForm = useForm({
    resolver: zodResolver(requestResetSchema),
    mode: 'onBlur',
  });

  const resetForm = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
  });

  const handleRequestReset = async (data: { email: string }) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await signIn("password", { email: data.email, flow: "reset" });
      setEmail(data.email);
      setStep('reset');
    } catch (error) {
      setSubmitError(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (data: { code: string; newPassword: string }) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await signIn("password", {
        email,
        code: data.code,
        newPassword: data.newPassword,
        flow: "reset-verification",
      });
      onSuccess?.();
    } catch (error) {
      setSubmitError(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'request') {
    return (
      <form onSubmit={requestForm.handleSubmit(handleRequestReset)} className="space-y-4">
        {submitError && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{submitError}</p>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Enter your email and we'll send you a code to reset your password.
        </p>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" disabled={isSubmitting} {...requestForm.register('email')} />
          {requestForm.formState.errors.email && (
            <p className="text-sm text-destructive mt-1">{requestForm.formState.errors.email.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send Reset Code'}
        </Button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm text-muted-foreground hover:underline w-full text-center">
            Back to sign in
          </button>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
      {submitError && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{submitError}</p>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        We sent a code to <strong>{email}</strong>.
      </p>
      <div>
        <Label htmlFor="code">Reset Code</Label>
        <Input id="code" type="text" inputMode="numeric" maxLength={8} disabled={isSubmitting} {...resetForm.register('code')} />
      </div>
      <div>
        <Label htmlFor="newPassword">New Password</Label>
        <Input id="newPassword" type="password" disabled={isSubmitting} {...resetForm.register('newPassword')} />
        <p className="text-xs text-muted-foreground mt-1">8+ chars, uppercase, lowercase, number</p>
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input id="confirmPassword" type="password" disabled={isSubmitting} {...resetForm.register('confirmPassword')} />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Resetting...' : 'Reset Password'}
      </Button>
    </form>
  );
}
```

### 3. Create ForgotPasswordPage

**New file: `src/features/auth/pages/ForgotPasswordPage.tsx`**

```typescript
import { useNavigate } from 'react-router-dom';
import ForgotPasswordForm from '../components/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground">We'll help you get back in</p>
        </div>
        <ForgotPasswordForm
          onSuccess={() => navigate('/auth/signin', { replace: true })}
          onCancel={() => navigate('/auth/signin')}
        />
      </div>
    </div>
  );
}
```

### 4. Update SignInForm

**Modify `src/features/auth/components/SignInForm.tsx`** - add link after password field:

```typescript
// Add after password input, before submit button
<div className="text-right">
  <Link to="/auth/forgot-password" className="text-sm text-primary hover:underline">
    Forgot password?
  </Link>
</div>
```

### 5. Add route

In your router configuration, add:

```typescript
<Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
```

---

## Files Summary

| File | Action |
|------|--------|
| `convex/email/ResendOTP.ts` | Create |
| `convex/email/ResendOTPPasswordReset.ts` | Create |
| `convex/auth.ts` | Modify |
| `src/features/auth/components/ForgotPasswordForm.tsx` | Create |
| `src/features/auth/pages/ForgotPasswordPage.tsx` | Create |
| `src/features/auth/components/SignInForm.tsx` | Modify |
| `src/features/auth/validation/authSchemas.ts` | Modify |
| `src/features/auth/index.ts` | Modify (exports) |
| Router configuration | Add route |

---

## Pre-Release Checklist

### Essential (Do Before Launch)

- [ ] **Email verification & password reset** (this document)
- [ ] **Test the full auth flow** on mobile devices
  - Sign up → verify email → sign in → sign out → forgot password → reset
- [ ] **Review error messages** - ensure they're user-friendly, not technical
- [ ] **Test offline behavior** - app should gracefully handle no connectivity
- [ ] **Verify PWA installation** works on iOS and Android

### Recommended (High Value, Low Effort)

- [ ] **Welcome/onboarding modal** for new users
  - Explain community nature of the app
  - Guide to join Community group

- [ ] **Basic analytics** - know if people are using it
  - Convex has built-in usage dashboard
  - Consider Plausible or Simple Analytics for privacy-friendly tracking

- [ ] **Feedback mechanism** - way for users to report issues
  - Simple: email link in settings

### Nice to Have (Can Wait)

- [ ] **Collaborator notifications** (Priority 2 in POST_MVP_ROADMAP.md)
- [ ] **OAuth (Google)** - convenient but email/password works fine for small group

---

## Testing Plan

### Test Email Verification
1. Create new account with real email
2. Verify code arrives within 1-2 minutes
3. Enter code, confirm account is verified
4. Sign out and back in (should not require re-verification)

### Test Password Reset
1. Click "Forgot password?" on sign-in page
2. Enter email, verify code arrives
3. Enter code + new password
4. Sign in with new password

### Test on Mobile
1. Install PWA on iOS Safari
2. Install PWA on Android Chrome
3. Test full auth flow on both
4. Test offline fallback behavior

---

## Design Decisions

- **Email provider**: Resend (free tier: 100 emails/day)
- **Unverified user access**: Allow browsing, require verification for create/edit
  - Check `user.emailVerificationTime` in permission checks
  - Show banner prompting verification when trying to create content
- **Password reset flow**: OTP-based (8-digit code sent to email)

---

## Implementation Order

1. Set up Resend account and configure env vars
2. Create backend email providers
3. Update `convex/auth.ts`
4. Create `ForgotPasswordForm` and page (most useful feature)
5. Test password reset flow end-to-end
6. Create `EmailVerificationForm` (if implementing verification)
7. Update `SignUpForm` to handle verification
8. Test email verification flow
9. Update `SignInForm` with forgot password link
10. Test on mobile devices
