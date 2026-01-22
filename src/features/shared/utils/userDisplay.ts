/**
 * User display utilities
 *
 * Shared functions for displaying user information while respecting privacy settings.
 */

import type { CreatorInfo } from '@/types';

/**
 * Get the display name for a creator, respecting their privacy settings.
 *
 * @param creator - The creator info object
 * @returns The appropriate display name based on privacy settings
 */
export function getCreatorDisplayName(creator: CreatorInfo): string {
  if (creator.showRealName && creator.displayName) {
    return creator.displayName;
  }
  return creator.username ? `@${creator.username}` : 'Unknown';
}
