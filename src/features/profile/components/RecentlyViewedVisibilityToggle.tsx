/**
 * RecentlyViewedVisibilityToggle component
 *
 * Displays a privacy notice and toggle for the Recently Viewed section.
 * Allows users to make their recently viewed list public or keep it private.
 */

import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import { useAuthState } from '@/features/auth/hooks/useAuth';

export function RecentlyViewedVisibilityToggle() {
  const { user } = useAuthState();
  const updateVisibility = useMutation(api.users.updateRecentlyViewedVisibility);

  const isPublic = user?.showRecentlyViewed ?? false;

  const handleToggle = async (checked: boolean) => {
    try {
      await updateVisibility({ showRecentlyViewed: checked });
    } catch (error) {
      console.error('Failed to update visibility:', error);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50 border border-muted mb-4">
      <div className="flex items-start gap-2 flex-1">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">
            {isPublic
              ? 'Your recently viewed arrangements are public.'
              : 'This section is only visible to you.'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Label
          htmlFor="recently-viewed-visibility"
          className="text-sm cursor-pointer whitespace-nowrap"
        >
          Make public
        </Label>
        <Switch
          id="recently-viewed-visibility"
          checked={isPublic}
          onCheckedChange={handleToggle}
        />
      </div>
    </div>
  );
}

export default RecentlyViewedVisibilityToggle;
