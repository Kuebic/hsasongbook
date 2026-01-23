/**
 * CoAuthorsList Component
 * Phase 2: Groups - Display co-authors for group-owned arrangements
 *
 * Expandable section showing co-authors with avatars.
 * Primary author is highlighted with a star badge.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/UserAvatar';
import { ChevronDown, ChevronUp, Star, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDisplayName } from '@/features/shared/utils/userDisplay';
import type { Id } from '../../../../convex/_generated/dataModel';

export interface CoAuthorDisplay {
  userId: string;
  isPrimary: boolean;
  user: {
    _id: string;
    username?: string;
    displayName?: string;
    showRealName?: boolean;
    avatarKey?: string;
  } | null;
}

interface CoAuthorsListProps {
  coAuthors: CoAuthorDisplay[];
  className?: string;
}

/**
 * CoAuthorsList - Expandable section displaying co-authors
 *
 * Shows primary author prominently with star badge.
 * Other co-authors shown in expandable list.
 */
export default function CoAuthorsList({
  coAuthors,
  className,
}: CoAuthorsListProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Don't render if no co-authors
  if (coAuthors.length === 0) {
    return null;
  }

  // Sort so primary author is first
  const sortedAuthors = [...coAuthors].sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return 0;
  });

  const primaryAuthor = sortedAuthors.find((a) => a.isPrimary);
  const otherAuthors = sortedAuthors.filter((a) => !a.isPrimary);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn('border rounded-lg', className)}
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-4 py-3 h-auto"
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Co-authors</span>
            <Badge variant="secondary" className="text-xs">
              {coAuthors.length}
            </Badge>
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-4 pb-4 space-y-3">
          {/* Primary author (always visible in expanded state) */}
          {primaryAuthor && (
            <div className="flex items-center gap-3 p-2 rounded-md bg-primary/5 border border-primary/20">
              <UserAvatar
                userId={primaryAuthor.userId as Id<'users'>}
                displayName={primaryAuthor.user?.displayName}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/user/${primaryAuthor.user?.username}`}
                    className="font-medium hover:underline truncate"
                  >
                    {getDisplayName(primaryAuthor.user, { prefixUsername: false })}
                  </Link>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    <Star className="h-3 w-3 mr-0.5 fill-current" />
                    Primary
                  </Badge>
                </div>
                {primaryAuthor.user?.username && (
                  <p className="text-sm text-muted-foreground">
                    @{primaryAuthor.user.username}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Other co-authors */}
          {otherAuthors.length > 0 && (
            <div className="space-y-2">
              {otherAuthors.map((author) => (
                <div
                  key={author.userId}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                >
                  <UserAvatar
                    userId={author.userId as Id<'users'>}
                    displayName={author.user?.displayName}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/user/${author.user?.username}`}
                      className="font-medium hover:underline truncate block"
                    >
                      {getDisplayName(author.user, { prefixUsername: false })}
                    </Link>
                    {author.user?.username && (
                      <p className="text-sm text-muted-foreground">
                        @{author.user.username}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
