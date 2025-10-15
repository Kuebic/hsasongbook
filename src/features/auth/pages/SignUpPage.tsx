/**
 * SignUpPage Component
 * Phase 5: Authentication Flow
 *
 * Full-page sign-up view for mobile devices.
 * Features:
 * - Full-screen account creation for mobile
 * - Back button to return to previous page
 * - Link to sign-in page
 * - Responsive design (mobile-first)
 *
 * Pattern from: PRPs/phase5-authentication-flow-prd.md
 */

import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import SignUpForm from '../components/SignUpForm';

/**
 * SignUpPage - Mobile full-page account creation
 *
 * Usage:
 * ```tsx
 * // In App.tsx routes:
 * <Route path="/auth/signup" element={<SignUpPage />} />
 * ```
 */
export default function SignUpPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate back to previous page or home
    navigate(-1);
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
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Sign up to back up and sync your data across devices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpForm onSuccess={handleSuccess} />

            {/* Link to sign-in */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
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
