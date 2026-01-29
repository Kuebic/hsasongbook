/**
 * useOnboardingState Hook
 *
 * Manages welcome onboarding state for authenticated users.
 * Checks if user has completed onboarding and provides mutation to mark as complete.
 */

import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { api } from '../../../../convex/_generated/api';

export function useOnboardingState() {
  const { user } = useAuth();
  const completeOnboardingMutation = useMutation(api.users.completeOnboarding);

  // Only show onboarding for authenticated (non-anonymous) users who haven't completed it
  const isAuthenticated = user && !user.isAnonymous;
  const shouldShowWelcome = isAuthenticated && !user.onboardingCompleted;

  const completeOnboarding = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      await completeOnboardingMutation();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  }, [isAuthenticated, completeOnboardingMutation]);

  return {
    shouldShowWelcome,
    completeOnboarding,
    isAuthenticated,
  };
}
