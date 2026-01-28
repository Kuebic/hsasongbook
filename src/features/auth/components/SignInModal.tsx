/**
 * SignInModal Component
 * Phase 5: Authentication Flow
 *
 * Desktop modal for authentication (sign-in and sign-up).
 * Features:
 * - Dialog modal using shadcn/ui
 * - Toggleable between sign-in and sign-up forms
 * - Responsive design (desktop only - mobile uses dedicated pages)
 * - Auto-close on successful authentication
 *
 * Pattern from: PRPs/phase5-authentication-flow-prd.md
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: 'signin' | 'signup';
}

/**
 * SignInModal - Desktop authentication modal
 *
 * Usage:
 * ```tsx
 * const [showAuthModal, setShowAuthModal] = useState(false);
 *
 * <SignInModal
 *   open={showAuthModal}
 *   onOpenChange={setShowAuthModal}
 *   defaultView="signin"
 * />
 * ```
 */
export default function SignInModal({
  open,
  onOpenChange,
  defaultView = 'signin',
}: SignInModalProps) {
  const [currentView, setCurrentView] = useState<'signin' | 'signup'>(defaultView);

  // Handle successful authentication
  const handleSuccess = () => {
    onOpenChange(false); // Close modal
  };

  // Handle forgot password click - close modal and navigate
  const handleForgotPassword = () => {
    onOpenChange(false); // Close modal
  };

  // Switch between sign-in and sign-up
  const handleSwitchView = () => {
    setCurrentView((prev) => (prev === 'signin' ? 'signup' : 'signin'));
  };

  // Reset view when modal is closed
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      // Reset to default view when closed
      setTimeout(() => setCurrentView(defaultView), 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentView === 'signin' ? 'Sign In' : 'Create Account'}
          </DialogTitle>
          <DialogDescription>
            {currentView === 'signin'
              ? 'Sign in to sync your data across devices.'
              : 'Create an account to back up and sync your data.'}
          </DialogDescription>
        </DialogHeader>

        {/* Form content */}
        <div className="mt-4">
          {currentView === 'signin' ? (
            <SignInForm
              onSuccess={handleSuccess}
              onSwitchToSignUp={handleSwitchView}
              onForgotPassword={handleForgotPassword}
            />
          ) : (
            <SignUpForm
              onSuccess={handleSuccess}
              onSwitchToSignIn={handleSwitchView}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
