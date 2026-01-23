import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Extract a user-friendly error message from an unknown error.
 * Returns the error message if it's an Error instance,
 * otherwise returns a generic fallback message.
 */
export function extractErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'An unexpected error occurred. Please try again.';
}
