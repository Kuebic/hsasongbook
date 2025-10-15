/**
 * Auth Error Handling Utilities
 *
 * Maps Supabase error codes to user-friendly messages
 * Pattern from: PRPs/ai_docs/supabase-auth-anonymous-offline-patterns.md
 *
 * Phase 5: Authentication Flow
 */

/**
 * Map Supabase error codes to user-friendly messages
 *
 * IMPORTANT: Always check error.code, never match error.message strings
 * (messages can change between versions)
 */
export function getUserFriendlyErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    // Sign-up errors
    email_exists: 'This email is already registered. Please sign in instead.',
    weak_password: 'Password must be at least 8 characters.',
    invalid_email: 'Please enter a valid email address.',
    captcha_failed: 'CAPTCHA verification failed. Please try again.',

    // Sign-in errors
    invalid_credentials: 'Invalid email or password.',
    email_not_confirmed: 'Please confirm your email before signing in.',
    user_banned: 'Your account has been suspended. Contact support.',

    // Update user errors
    same_password: 'New password must be different from current password.',

    // Network errors
    network_error: 'Network error. Please check your connection.',
    timeout_error: 'Request timed out. Please try again.',

    // Generic
    unknown_error: 'An unexpected error occurred. Please try again.',
  };

  return messages[errorCode] || messages.unknown_error;
}

/**
 * Check if error is a network-related error
 */
export function isNetworkError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const errorObj = error as { message?: string; code?: string };

  return (
    errorObj.code === 'network_error' ||
    errorObj.code === 'timeout_error' ||
    (errorObj.message?.toLowerCase().includes('network') ?? false) ||
    (errorObj.message?.toLowerCase().includes('timeout') ?? false) ||
    !navigator.onLine
  );
}

/**
 * Check if error is a rate limit error (HTTP 429)
 */
export function isRateLimitError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const errorObj = error as { status?: number; code?: string };

  return errorObj.status === 429 || errorObj.code === 'rate_limit_exceeded';
}

/**
 * Calculate exponential backoff delay for retries
 *
 * @param attempt - Retry attempt number (0-indexed)
 * @param baseDelayMs - Base delay in milliseconds (default: 1000)
 * @param maxDelayMs - Maximum delay in milliseconds (default: 30000)
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelayMs = 1000,
  maxDelayMs = 30000
): number {
  const delay = baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, maxDelayMs);
}
