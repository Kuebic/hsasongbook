/**
 * Date formatting utilities
 * Centralized date formatting for consistent display across the app
 */

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

/**
 * Format a date string (ISO format) to a human-readable locale string
 * @param dateString - ISO date string or any string parseable by Date
 * @returns Formatted date string (e.g., "January 22, 2026") or "Unknown" if invalid
 */
export function formatDateString(dateString?: string | null): string {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString('en-US', DATE_OPTIONS);
  } catch {
    return 'Unknown';
  }
}

/**
 * Format a Unix timestamp (milliseconds) to a human-readable locale string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string (e.g., "January 22, 2026") or "Unknown" if invalid
 */
export function formatTimestamp(timestamp?: number | null): string {
  if (!timestamp) return 'Unknown';
  try {
    return new Date(timestamp).toLocaleDateString('en-US', DATE_OPTIONS);
  } catch {
    return 'Unknown';
  }
}

/**
 * Format a date for setlist display (shorter format)
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "Jan 22, 2026") or "No date set" if invalid
 */
export function formatSetlistDate(dateString?: string | null): string {
  if (!dateString) return 'No date set';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'No date set';
  }
}
