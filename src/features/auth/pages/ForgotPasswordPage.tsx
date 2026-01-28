/**
 * ForgotPasswordPage Component
 * Full-page password reset view for mobile devices.
 */

import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import ForgotPasswordForm from '../components/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate to sign-in page after successful password reset
    navigate('/auth/signin', { replace: true });
  };

  const handleCancel = () => {
    navigate('/auth/signin');
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with back button */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container max-w-lg mx-auto px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container max-w-lg mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>We'll help you get back in.</CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />

            {/* Link to sign-in */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Remember your password?{' '}
              <Link
                to="/auth/signin"
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
