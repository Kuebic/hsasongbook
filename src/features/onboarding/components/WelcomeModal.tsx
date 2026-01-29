/**
 * WelcomeModal Component
 *
 * Welcome onboarding modal shown to authenticated users on first visit.
 * Explains the community nature of the app and guides users to join the Community group.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGroupMembershipActions } from '@/features/groups/hooks/useGroupMembership';
import { api } from '../../../../convex/_generated/api';
import { Users, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WelcomeModal({ open, onOpenChange }: WelcomeModalProps) {
  const navigate = useNavigate();
  const [joinedCommunity, setJoinedCommunity] = useState(false);

  // Fetch the Community group
  const communityGroup = useQuery(api.groups.getPublicGroupQuery);
  const { loading: joinLoading, requestJoin } = useGroupMembershipActions();

  const handleJoinCommunity = async () => {
    if (!communityGroup) return;
    try {
      await requestJoin(communityGroup._id);
      setJoinedCommunity(true);
      // Close modal after a brief moment to show success
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    } catch (error) {
      // Error is handled by the hook, but we might already be a member
      if (error instanceof Error && error.message.includes('Already a member')) {
        setJoinedCommunity(true);
        setTimeout(() => {
          onOpenChange(false);
        }, 1000);
      }
    }
  };

  const handleBrowseGroups = () => {
    onOpenChange(false);
    navigate('/groups');
  };

  const handleMaybeLater = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Welcome to HSA Songbook!
          </DialogTitle>
          <DialogDescription>
            A community-driven collection of worship songs and chord arrangements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Join the Community</strong> to access shared
            arrangements and contribute your own. The Community group is where all public
            content lives - anyone can view, but members can contribute.
          </p>

          <p className="text-sm text-muted-foreground">
            You can also browse and join other groups created by worship teams.
          </p>

          <div className="flex flex-col gap-2 pt-2">
            {/* Primary action: Join Community */}
            <Button
              onClick={handleJoinCommunity}
              disabled={joinLoading || joinedCommunity || !communityGroup}
              className="w-full"
            >
              {joinLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : joinedCommunity ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Joined Community!
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Join Community
                </>
              )}
            </Button>

            {/* Secondary action: Browse Groups */}
            <Button
              variant="outline"
              onClick={handleBrowseGroups}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Browse All Groups
            </Button>

            {/* Tertiary action: Maybe Later */}
            <Button
              variant="ghost"
              onClick={handleMaybeLater}
              className="w-full text-muted-foreground"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
