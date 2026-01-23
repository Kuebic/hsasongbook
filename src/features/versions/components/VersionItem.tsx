/**
 * VersionItem Component
 * Displays a single version entry with user info, timestamp, and rollback button.
 */

import { formatDistanceToNow } from 'date-fns';
import UserAvatar from '@/components/UserAvatar';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import type { Id } from '../../../../convex/_generated/dataModel';

interface VersionItemProps {
  version: {
    _id: string;
    version: number;
    changedAt: number;
    changeDescription?: string;
    changedByUser: {
      _id: string;
      username?: string;
      displayName?: string;
      avatarKey?: string;
    } | null;
  };
  isLatest: boolean;
  onRollback: (version: number) => void;
}

export default function VersionItem({
  version,
  isLatest,
  onRollback,
}: VersionItemProps) {
  const timeAgo = formatDistanceToNow(new Date(version.changedAt), {
    addSuffix: true,
  });

  const displayName =
    version.changedByUser?.displayName ||
    version.changedByUser?.username ||
    'Unknown';

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        {/* Version badge */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-medium">
          v{version.version}
        </div>

        {/* User avatar */}
        {version.changedByUser && (
          <UserAvatar
            userId={version.changedByUser._id as Id<'users'>}
            displayName={version.changedByUser.displayName}
            size="sm"
          />
        )}

        {/* Version info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{displayName}</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          {version.changeDescription && (
            <span className="text-xs text-muted-foreground">
              {version.changeDescription}
            </span>
          )}
          {isLatest && (
            <span className="text-xs text-green-600 dark:text-green-400">
              Current version
            </span>
          )}
        </div>
      </div>

      {/* Rollback button (not shown for current version) */}
      {!isLatest && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRollback(version.version)}
          className="text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Restore
        </Button>
      )}
    </div>
  );
}
