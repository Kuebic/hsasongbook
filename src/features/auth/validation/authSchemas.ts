/**
 * Zod validation schemas for authentication forms
 * Phase 5: Cloud Integration - Auth Foundation
 */

import { z } from 'zod';

/**
 * Username validation schema
 * - 3-30 characters
 * - Lowercase letters, numbers, underscores, hyphens only
 * - Automatically lowercased
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(
    /^[a-z0-9_-]+$/,
    'Only lowercase letters, numbers, underscores, and hyphens allowed'
  )
  .transform((val) => val.toLowerCase());

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must be less than 255 characters');

/**
 * Password validation schema
 * Supabase default minimum is 6 characters, but we enforce stricter requirements
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be less than 72 characters')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter');

/**
 * Sign-in form schema
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'), // Don't validate complexity on sign-in
});

export type SignInFormData = z.infer<typeof signInSchema>;

/**
 * Sign-up form schema
 */
export const signUpSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;

/**
 * Verification code schema (8-digit numeric code)
 */
export const verificationCodeSchema = z
  .string()
  .length(8, 'Code must be 8 digits')
  .regex(/^\d+$/, 'Code must contain only numbers');

/**
 * Password reset schema (step 2: enter code and new password)
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
