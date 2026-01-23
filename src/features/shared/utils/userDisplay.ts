/**
 * User display utilities
 *
 * Shared functions for displaying user information while respecting privacy settings.
 */

import type { CreatorInfo } from '@/types';

/**
 * Options for getDisplayName function
 */
interface DisplayNameOptions {
  /** Whether to prefix usernames with @ (default: true) */
  prefixUsername?: boolean;
}

/**
 * User info shape accepted by getDisplayName.
 * Matches the shape returned by formatUserInfo() in convex/permissions.ts
 */
interface UserDisplayInfo {
  username?: string | null;
  displayName?: string | null;
  showRealName?: boolean | null;
}

/**
 * Get the display name for a user, respecting their privacy settings.
 *
 * @param user - The user info object (can be null)
 * @param options - Display options
 * @returns The appropriate display name based on privacy settings
 */
export function getDisplayName(
  user: UserDisplayInfo | null | undefined,
  options: DisplayNameOptions = {}
): string {
  const { prefixUsername = true } = options;

  if (!user) return 'Unknown';

  if (user.showRealName && user.displayName) {
    return user.displayName;
  }

  if (!user.username) return 'Unknown';

  return prefixUsername ? `@${user.username}` : user.username;
}

/**
 * Get the display name for a creator, respecting their privacy settings.
 * This is an alias for getDisplayName with prefixUsername=true for backwards compatibility.
 *
 * @param creator - The creator info object
 * @returns The appropriate display name based on privacy settings
 */
export function getCreatorDisplayName(creator: CreatorInfo): string {
  return getDisplayName(creator, { prefixUsername: true });
}
