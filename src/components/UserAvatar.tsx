/**
 * UserAvatar Component
 *
 * Reusable avatar display component that shows:
 * - User's profile picture if available
 * - Initials fallback if no picture
 * - Loading skeleton while fetching
 *
 * Uses R2 signed URLs for secure image access.
 */

import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
  xl: 'h-16 w-16 text-xl',
};

const iconSizes: Record<AvatarSize, string> = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
  xl: 'h-8 w-8',
};

interface UserAvatarProps {
  /** User ID to fetch avatar for */
  userId?: Id<'users'>;
  /** Pre-fetched avatar URL (skip query if provided) */
  avatarUrl?: string | null;
  /** Display name for initials fallback */
  displayName?: string | null;
  /** Email for initials fallback (used if no displayName) */
  email?: string | null;
  /** Size variant */
  size?: AvatarSize;
  /** Additional CSS classes */
  className?: string;
  /** Show loading skeleton */
  loading?: boolean;
}

/**
 * Extract initials from a name or email
 */
function getInitials(displayName?: string | null, email?: string | null): string {
  if (displayName) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }
  if (email) {
    const localPart = email.split('@')[0];
    return localPart.slice(0, 2).toUpperCase();
  }
  return '?';
}

/**
 * Generate a consistent color based on a string (for avatar background)
 */
function getAvatarColor(str: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function UserAvatar({
  userId,
  avatarUrl: providedAvatarUrl,
  displayName,
  email,
  size = 'md',
  className,
  loading = false,
}: UserAvatarProps) {
  // Fetch avatar URL if userId provided and no URL given
  const fetchedAvatarUrl = useQuery(
    api.files.getAvatarUrl,
    userId && providedAvatarUrl === undefined ? { userId } : 'skip'
  );

  const avatarUrl = providedAvatarUrl ?? fetchedAvatarUrl;
  const isLoading = loading || (userId && providedAvatarUrl === undefined && fetchedAvatarUrl === undefined);

  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];
  const initials = getInitials(displayName, email);
  const bgColor = getAvatarColor(displayName || email || 'unknown');

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          'rounded-full bg-muted animate-pulse',
          sizeClass,
          className
        )}
      />
    );
  }

  // Avatar image
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName || email || 'User avatar'}
        className={cn(
          'rounded-full object-cover',
          sizeClass,
          className
        )}
      />
    );
  }

  // Initials fallback
  if (displayName || email) {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center text-white font-medium',
          sizeClass,
          bgColor,
          className
        )}
        title={displayName || email || undefined}
      >
        {initials}
      </div>
    );
  }

  // Default placeholder
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center bg-muted text-muted-foreground',
        sizeClass,
        className
      )}
    >
      <User className={iconSize} />
    </div>
  );
}
