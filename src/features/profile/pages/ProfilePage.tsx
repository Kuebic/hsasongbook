/**
 * ProfilePage component
 *
 * Placeholder page for Phase 5 authentication.
 * Shows "Coming Soon" message and link to settings.
 */

import { Link } from 'react-router-dom';
import { Card, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimplePageTransition } from '../../shared/components/PageTransition';
import Breadcrumbs from '../../shared/components/Breadcrumbs';
import { User, Settings } from 'lucide-react';

export function ProfilePage() {
  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Profile', path: '/profile' }
  ];

  return (
    <SimplePageTransition>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumbs items={breadcrumbs} />
          </div>

          {/* Page Header */}
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account and preferences
            </p>
          </header>

          {/* Profile Placeholder Card */}
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <div className="rounded-full bg-muted p-6 mb-6">
                <User className="h-16 w-16 text-muted-foreground" />
              </div>

              <CardTitle className="text-2xl mb-2">
                Welcome to HSA Songbook
              </CardTitle>

              <CardDescription className="text-base mb-6 max-w-md">
                Sign in to sync your data across devices and collaborate with your team.
                Authentication will be available in Phase 5.
              </CardDescription>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <Button
                  className="flex-1"
                  disabled
                >
                  Sign In
                  <span className="ml-2 text-xs">(Coming in Phase 5)</span>
                </Button>

                <Link to="/settings" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </Link>
              </div>

              {/* Feature List */}
              <div className="mt-8 text-left w-full max-w-md">
                <p className="text-sm font-semibold mb-3 text-muted-foreground">
                  Coming Soon:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Sync songs and setlists across devices
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Share arrangements with your team
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Collaborate on setlists
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Cloud backup of your data
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SimplePageTransition>
  );
}
