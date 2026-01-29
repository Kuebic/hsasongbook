/**
 * VerifyEmailPage
 * Page for verifying email after signup.
 *
 * Reads the pending verification email from localStorage
 * and displays the verification form.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmailVerificationForm from '../components/EmailVerificationForm';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const pendingEmail = localStorage.getItem('pendingVerificationEmail');
    if (!pendingEmail) {
      // No pending verification, redirect to signup
      navigate('/auth/signup', { replace: true });
      return;
    }
    setEmail(pendingEmail);
  }, [navigate]);

  const handleSuccess = () => {
    // Clear the pending verification email
    localStorage.removeItem('pendingVerificationEmail');
    // Navigate to home - AuthProvider will handle setting username
    window.location.href = '/';
  };

  const handleCancel = () => {
    // Clear pending data and go back to signup
    localStorage.removeItem('pendingVerificationEmail');
    localStorage.removeItem('pendingUsername');
    navigate('/auth/signup');
  };

  if (!email) {
    return null; // Loading or redirecting
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Verify Your Email</h1>
          <p className="text-muted-foreground">
            One more step to complete your registration
          </p>
        </div>
        <EmailVerificationForm
          email={email}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
