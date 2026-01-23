/**
 * CoAuthorPicker Component
 * Phase 2: Groups - Select co-authors for group-owned arrangements
 *
 * Allows searching any user and adding them as co-authors.
 * Primary author can be designated with a star.
 */

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserAvatar from '@/components/UserAvatar';
import { Search, UserPlus, X, Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDisplayName } from '../utils/userDisplay';

export interface CoAuthor {
  userId: string;
  isPrimary: boolean;
  user?: {
    _id: string;
    username?: string;
    displayName?: string;
    showRealName?: boolean;
  };
}

interface CoAuthorPickerProps {
  selectedAuthors: CoAuthor[];
  onChange: (authors: CoAuthor[]) => void;
  currentUserId: string;
  disabled?: boolean;
  className?: string;
}

/**
 * CoAuthorPicker - Search and select co-authors for group arrangements
 *
 * Features:
 * - Search any user by username
 * - Display selected authors with avatars
 * - Designate primary author with star icon
 * - Current user auto-included if not specified
 */
export default function CoAuthorPicker({
  selectedAuthors,
  onChange,
  currentUserId,
  disabled = false,
  className,
}: CoAuthorPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Search users
  const searchResults = useQuery(
    api.users.searchByUsername,
    searchQuery.length >= 2 ? { query: searchQuery } : 'skip'
  );

  // Set of currently selected user IDs for filtering
  const selectedIds = new Set(selectedAuthors.map((a) => a.userId));

  // Filter out already selected users from search results
  const filteredSearchResults =
    searchResults?.filter((u) => !selectedIds.has(u._id)) ?? [];

  // Add a user as co-author
  const handleAddAuthor = (user: {
    _id: string;
    username?: string;
    displayName?: string;
    showRealName?: boolean;
  }) => {
    const newAuthor: CoAuthor = {
      userId: user._id,
      isPrimary: selectedAuthors.length === 0, // First author is primary by default
      user,
    };
    onChange([...selectedAuthors, newAuthor]);
    setSearchQuery('');
  };

  // Remove a co-author
  const handleRemoveAuthor = (userId: string) => {
    const remaining = selectedAuthors.filter((a) => a.userId !== userId);
    // If we removed the primary author, make the first remaining one primary
    if (remaining.length > 0 && !remaining.some((a) => a.isPrimary)) {
      remaining[0].isPrimary = true;
    }
    onChange(remaining);
  };

  // Toggle primary status
  const handleTogglePrimary = (userId: string) => {
    const updated = selectedAuthors.map((author) => ({
      ...author,
      isPrimary: author.userId === userId,
    }));
    onChange(updated);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <label className="text-sm font-medium">Co-authors (optional)</label>
      <p className="text-xs text-muted-foreground -mt-1">
        Add other users who contributed to this arrangement
      </p>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          disabled={disabled}
        />
      </div>

      {/* Search results */}
      {searchQuery.length >= 2 && (
        <div className="space-y-1">
          {filteredSearchResults.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              {searchResults === undefined ? 'Searching...' : 'No users found'}
            </p>
          ) : (
            <div className="max-h-[120px] overflow-y-auto border rounded-md">
              {filteredSearchResults.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-2 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      userId={user._id as Id<'users'>}
                      displayName={user.displayName}
                      size="sm"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {getDisplayName(user, { prefixUsername: false })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        @{user.username}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddAuthor(user)}
                    disabled={disabled}
                    type="button"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected co-authors */}
      {selectedAuthors.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Selected Co-authors ({selectedAuthors.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedAuthors.map((author) => (
              <div
                key={author.userId}
                className={cn(
                  'flex items-center gap-2 px-2 py-1 rounded-full',
                  'bg-muted/50 border',
                  author.isPrimary && 'border-primary/50 bg-primary/5'
                )}
              >
                <UserAvatar
                  userId={author.userId as Id<'users'>}
                  displayName={author.user?.displayName}
                  size="sm"
                />
                <span className="text-sm">
                  {author.user?.username ? `@${author.user.username}` : 'User'}
                </span>

                {/* Primary badge / toggle */}
                {author.isPrimary ? (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    <Star className="h-3 w-3 mr-0.5 fill-current" />
                    Primary
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleTogglePrimary(author.userId)}
                    disabled={disabled}
                    className="h-6 px-1"
                    title="Set as primary author"
                    type="button"
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                )}

                {/* Remove button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveAuthor(author.userId)}
                  disabled={disabled}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  type="button"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
