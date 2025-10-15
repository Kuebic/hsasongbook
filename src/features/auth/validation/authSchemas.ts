/**
 * Zod validation schemas for authentication forms
 * Phase 5: Cloud Integration - Auth Foundation
 */

import { z } from 'zod';

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
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;
