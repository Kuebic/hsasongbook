/**
 * LegalPageLayout Component
 *
 * Shared layout for Privacy Policy and Terms of Service pages.
 * Provides consistent styling, back navigation, and mobile-friendly design.
 */

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SimplePageTransition } from '@/features/shared/components/PageTransition';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: LegalPageLayoutProps) {
  const navigate = useNavigate();

  return (
    <SimplePageTransition>
      <div className="min-h-screen bg-background">
        {/* Header with back button */}
        <header className="sticky top-0 z-10 bg-background border-b">
          <div className="container max-w-4xl mx-auto px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="container max-w-4xl mx-auto px-4 py-6 pb-20 md:pb-6">
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Last updated: {lastUpdated}
          </p>

          {/* Policy content */}
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </SimplePageTransition>
  );
}
