/**
 * CollaboratorsList Component
 * Phase 1: Collaborators - Display list of arrangement collaborators
 *
 * Shows collaborators with avatars, used in arrangement details view.
 */

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import UserAvatar from '@/components/UserAvatar';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDisplayName } from '@/features/shared/utils/userDisplay';

interface CollaboratorsListProps {
  /** Arrangement ID to fetch collaborators for */
  arrangementId: string;
  /** Whether the current user is the owner (affects visibility) */
  isOwner?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show as compact inline list */
  compact?: boolean;
}

export default function CollaboratorsList({
  arrangementId,
  isOwner = false,
  className,
  compact = false,
}: CollaboratorsListProps) {
  // Only fetch collaborators if the user is the owner
  const collaborators = useQuery(
    api.arrangements.getCollaborators,
    isOwner ? { arrangementId: arrangementId as Id<'arrangements'> } : 'skip'
  );

  // Don't render anything if not owner or no collaborators
  if (!isOwner) return null;
  if (collaborators === undefined) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Loading collaborators...</span>
      </div>
    );
  }
  if (collaborators.length === 0) return null;

  // Compact inline display (avatars only with tooltip-style names)
  if (compact) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <span className="text-xs text-muted-foreground mr-1">Collaborators:</span>
        <div className="flex -space-x-2">
          {collaborators.slice(0, 5).map((collab) => (
            <UserAvatar
              key={collab._id}
              userId={collab.userId as Id<'users'>}
              displayName={collab.user?.displayName}
              size="sm"
              className="ring-2 ring-background"
            />
          ))}
        </div>
        {collaborators.length > 5 && (
          <span className="text-xs text-muted-foreground ml-1">
            +{collaborators.length - 5} more
          </span>
        )}
      </div>
    );
  }

  // Full list display
  return (
    <div className={cn('space-y-2', className)}>
      <h4 className="text-sm font-medium text-muted-foreground">Collaborators</h4>
      <div className="flex flex-wrap gap-2">
        {collaborators.map((collab) => (
          <div
            key={collab._id}
            className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1"
          >
            <UserAvatar
              userId={collab.userId as Id<'users'>}
              displayName={collab.user?.displayName}
              size="sm"
            />
            <span className="text-sm">
              {getDisplayName(collab.user, { prefixUsername: false })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
