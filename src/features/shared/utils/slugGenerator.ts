/**
 * Slug generation utilities for songs and arrangements
 *
 * Generates URL-friendly slugs:
 * - Songs: title-based slug + nanoid (e.g., "amazing-grace-x4k9p")
 * - Arrangements: nanoid only (e.g., "gh2lk")
 */

import { nanoid } from 'nanoid';

/**
 * Generate a URL-friendly slug from a title
 *
 * @param title - The song/arrangement title
 * @param type - 'song' or 'arrangement'
 * @returns URL-safe slug with nanoid suffix
 *
 * @example
 * ```typescript
 * generateSlug('Amazing Grace', 'song')
 * // => "amazing-grace-x4k9p"
 *
 * generateSlug('Holy, Holy, Holy!', 'song')
 * // => "holy-holy-holy-y7m3q"
 *
 * generateSlug('Traditional Hymn', 'arrangement')
 * // => "gh2lk"
 * ```
 */
export function generateSlug(title: string, type: 'song' | 'arrangement'): string {
  if (type === 'arrangement') {
    // Arrangements: nanoid only (no title)
    // Arrangement names change frequently, so we use a stable random ID
    return nanoid(6);
  }

  // Songs: title-based slug + nanoid
  // Handle empty or whitespace-only titles
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return `untitled-${nanoid(6)}`;
  }

  const slug = trimmedTitle
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars (keep alphanumeric, spaces, hyphens)
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Collapse multiple hyphens into one
    .slice(0, 30)              // Truncate to 30 chars for readability
    .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens

  // If slug is empty after sanitization (e.g., title was "!!!")
  if (!slug) {
    return `song-${nanoid(6)}`;
  }

  const uniqueId = nanoid(6);  // 6-char random suffix (68.7B combinations)
  return `${slug}-${uniqueId}`;
}
