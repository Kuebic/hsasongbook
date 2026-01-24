import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Map of known error patterns to user-friendly messages.
 * Keys are substrings to search for in error messages.
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'InvalidAccountId': 'Invalid email or password. Please try again.',
  'InvalidSecret': 'Invalid email or password. Please try again.',
  'AccountAlreadyExists': 'An account with this email already exists.',
  'InvalidVerificationCode': 'Invalid verification code. Please try again.',
  'TooManyFailedAttempts': 'Too many failed attempts. Please try again later.',
};

/**
 * Extract a user-friendly error message from an unknown error.
 * Maps known auth errors to friendly messages,
 * otherwise returns a generic fallback message.
 */
export function extractErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An unexpected error occurred. Please try again.';
  }

  // Check for known auth error patterns
  for (const [pattern, friendlyMessage] of Object.entries(AUTH_ERROR_MESSAGES)) {
    if (error.message.includes(pattern)) {
      return friendlyMessage;
    }
  }

  // For other errors, return a generic message to avoid exposing internals
  return 'An unexpected error occurred. Please try again.';
}
