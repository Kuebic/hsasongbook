/**
 * OwnerSelector Component
 * Phase 2: Groups - Select who owns the content (user vs group)
 *
 * Shows "Post as myself" vs "Post as [group]" options.
 * Only renders if user belongs to groups where they're owner/admin.
 * Excludes Community system group (transfer only).
 */

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Users, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserGroups } from '@/features/groups/hooks/useGroupData';
import { useAuth } from '@/features/auth';
import { getDisplayName } from '../utils/userDisplay';

export interface OwnerSelection {
  ownerType: 'user' | 'group';
  ownerId?: string;
  ownerName?: string;
}

interface OwnerSelectorProps {
  value: OwnerSelection;
  onChange: (value: OwnerSelection) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * OwnerSelector - Select between posting as yourself or as a group
 *
 * Only renders if user belongs to postable groups (owner/admin, non-Community).
 * Returns null if user has no groups they can post as.
 */
export default function OwnerSelector({
  value,
  onChange,
  disabled = false,
  className,
}: OwnerSelectorProps) {
  const { user } = useAuth();
  const { groups, loading } = useUserGroups();

  // Filter to groups where user is owner or admin, excluding Community system group
  const postableGroups = groups.filter(
    (group) =>
      (group.role === 'owner' || group.role === 'admin') && !group.isSystemGroup
  );

  // Don't render if loading or no postable groups
  if (loading || postableGroups.length === 0) {
    return null;
  }

  // Get display name for "myself" option
  const myselfName = user ? getDisplayName(user, { prefixUsername: true }) : 'Myself';

  // Current selection display
  const getSelectionLabel = () => {
    if (value.ownerType === 'user') {
      return myselfName;
    }
    return value.ownerName || 'Unknown Group';
  };

  // Handle selection change
  const handleChange = (selectedValue: string) => {
    if (selectedValue === 'user') {
      onChange({ ownerType: 'user' });
    } else {
      // Find the selected group
      const group = postableGroups.find((g) => g._id === selectedValue);
      if (group) {
        onChange({
          ownerType: 'group',
          ownerId: group._id,
          ownerName: group.name,
        });
      }
    }
  };

  const buttonClasses = cn(
    'min-h-[44px]',
    'px-4',
    'justify-between',
    'w-full',
    className
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Post as</label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={buttonClasses}
            aria-label="Select who to post as"
          >
            <span className="flex items-center gap-2">
              {value.ownerType === 'user' ? (
                <User className="h-4 w-4" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              <span className="truncate">{getSelectionLabel()}</span>
            </span>
            <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Post as</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuRadioGroup
            value={value.ownerType === 'user' ? 'user' : value.ownerId || ''}
            onValueChange={handleChange}
          >
            {/* Myself option */}
            <DropdownMenuRadioItem
              value="user"
              className="min-h-[44px] flex items-center"
            >
              <span className="flex items-center gap-3">
                <User className="h-4 w-4" />
                <span className="font-medium">{myselfName}</span>
              </span>
            </DropdownMenuRadioItem>

            {/* Group options */}
            {postableGroups.map((group) => (
              <DropdownMenuRadioItem
                key={group._id}
                value={group._id}
                className="min-h-[44px] flex items-center"
              >
                <span className="flex items-center gap-3">
                  <Users className="h-4 w-4" />
                  <span className="font-medium truncate">{group.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    ({group.role})
                  </span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
