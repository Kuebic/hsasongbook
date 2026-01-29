/**
 * useChordProTutorial Hook
 *
 * Manages ChordPro tutorial state for authenticated users.
 * Tracks whether user has seen the tutorial and provides mutation to mark as seen.
 */

import { useCallback, useState } from 'react';
import { useMutation } from 'convex/react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { api } from '../../../../convex/_generated/api';

export function useChordProTutorial() {
  const { user } = useAuth();
  const markTutorialSeenMutation = useMutation(api.users.markChordProTutorialSeen);

  // Local state to control popover visibility
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Only show tutorial for authenticated users who haven't seen it
  const isAuthenticated = user && !user.isAnonymous;
  const shouldShowOnFirstEdit = isAuthenticated && !user.hasSeenChordProTutorial;

  const markTutorialSeen = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      await markTutorialSeenMutation();
    } catch (error) {
      console.error('Failed to mark ChordPro tutorial as seen:', error);
    }
  }, [isAuthenticated, markTutorialSeenMutation]);

  // Open the popover (for first-time auto-trigger or manual help button)
  const openTutorial = useCallback(() => {
    setIsPopoverOpen(true);
  }, []);

  // Close the popover and optionally mark as seen
  const closeTutorial = useCallback(
    async (markSeen: boolean = true) => {
      setIsPopoverOpen(false);
      if (markSeen && shouldShowOnFirstEdit) {
        await markTutorialSeen();
      }
    },
    [shouldShowOnFirstEdit, markTutorialSeen]
  );

  // Trigger tutorial on first edit (call this when user clicks "Edit Chords")
  const triggerOnFirstEdit = useCallback(() => {
    if (shouldShowOnFirstEdit) {
      openTutorial();
    }
  }, [shouldShowOnFirstEdit, openTutorial]);

  return {
    isPopoverOpen,
    setIsPopoverOpen,
    shouldShowOnFirstEdit,
    markTutorialSeen,
    openTutorial,
    closeTutorial,
    triggerOnFirstEdit,
  };
}
