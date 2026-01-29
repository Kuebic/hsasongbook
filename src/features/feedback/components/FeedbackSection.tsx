/**
 * FeedbackSection Component
 *
 * Settings section for user feedback submission.
 * Shows sign-in prompt for anonymous users.
 * For authenticated users: displays the feedback form.
 *
 * Exports:
 * - FeedbackSection: Full component with Card wrapper (for standalone use)
 * - FeedbackSectionContent: Content only (for use in accordion)
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthState } from '@/features/auth/hooks/useAuth';
import SignInModal from '@/features/auth/components/SignInModal';
import FeedbackForm from './FeedbackForm';

/**
 * FeedbackSectionContent - Content without Card wrapper
 * For use in accordion or other container layouts
 */
export function FeedbackSectionContent() {
  const { user } = useAuthState();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isAnonymous = user?.isAnonymous ?? true;

  return (
    <>
      <div className="space-y-4">
        {isAnonymous ? (
          // Anonymous user view
          <>
            <p className="text-sm text-muted-foreground">
              Sign in to submit feedback, report bugs, or request new features.
            </p>
            <Button variant="outline" onClick={() => setShowAuthModal(true)}>
              Sign In
            </Button>
          </>
        ) : (
          // Authenticated user view
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Have a bug to report, feature to request, or question to ask? Let us know!
            </p>
            <FeedbackForm userEmail={user.email ?? ''} />
          </>
        )}
      </div>

      {/* Sign-in modal */}
      <SignInModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        defaultView="signin"
      />
    </>
  );
}

/**
 * FeedbackSection - Full component with Card wrapper
 * For standalone use
 */
export default function FeedbackSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback & Support</CardTitle>
      </CardHeader>
      <CardContent>
        <FeedbackSectionContent />
      </CardContent>
    </Card>
  );
}
