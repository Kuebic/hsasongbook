/**
 * ArrangementOwnershipActions Component
 *
 * Allows the original arrangement creator to:
 * - Transfer their arrangement to Community (crowdsourced editing)
 * - Reclaim their arrangement from Community back to personal ownership
 */

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Globe, User, Loader2 } from 'lucide-react';
import type { Id } from '../../../../convex/_generated/dataModel';

interface ArrangementOwnershipActionsProps {
  arrangementId: string;
  isOwner: boolean;
  isCommunityOwned: boolean;
}

export function ArrangementOwnershipActions({
  arrangementId,
  isOwner,
  isCommunityOwned,
}: ArrangementOwnershipActionsProps) {
  const [isTransferring, setIsTransferring] = useState(false);
  const [isReclaiming, setIsReclaiming] = useState(false);

  const transferToCommunity = useMutation(api.arrangements.transferToCommunity);
  const reclaimFromCommunity = useMutation(api.arrangements.reclaimFromCommunity);

  // Only show for the original creator
  if (!isOwner) return null;

  const handleTransfer = async () => {
    setIsTransferring(true);
    try {
      await transferToCommunity({ id: arrangementId as Id<'arrangements'> });
    } catch (error) {
      console.error('Failed to transfer arrangement:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleReclaim = async () => {
    setIsReclaiming(true);
    try {
      await reclaimFromCommunity({ id: arrangementId as Id<'arrangements'> });
    } catch (error) {
      console.error('Failed to reclaim arrangement:', error);
    } finally {
      setIsReclaiming(false);
    }
  };

  if (isCommunityOwned) {
    // Show reclaim option
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={isReclaiming}>
            {isReclaiming ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <User className="h-4 w-4 mr-2" />
            )}
            Reclaim Arrangement
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reclaim this arrangement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the arrangement back to your personal ownership.
              Community group members will no longer be able to edit it. You can
              always transfer it back to Community later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReclaim}>
              Reclaim Arrangement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Show transfer option
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isTransferring}>
          {isTransferring ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Globe className="h-4 w-4 mr-2" />
          )}
          Move to Community
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Transfer to Community?</AlertDialogTitle>
          <AlertDialogDescription>
            This will allow anyone in the Community group to edit this arrangement.
            You'll retain edit rights as the original creator and can reclaim
            ownership anytime.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleTransfer}>
            Transfer to Community
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
