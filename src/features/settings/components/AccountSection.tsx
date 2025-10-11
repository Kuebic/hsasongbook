/**
 * AccountSection Component
 *
 * Settings section for user account management.
 * Currently displays a placeholder for Phase 5 authentication.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Account Settings Section
 *
 * Placeholder for Phase 5 authentication features.
 * Displays informational text about future sync capabilities.
 *
 * Features:
 * - Placeholder UI for sign-in
 * - Disabled button (will be enabled in Phase 5)
 * - Informational text about sync benefits
 *
 * Usage:
 * ```tsx
 * // In SettingsPage:
 * <AccountSection />
 * ```
 *
 * @future Phase 5: Replace with real authentication UI (Supabase)
 */
export default function AccountSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Sign in to sync your data across devices and collaborate with your team.
        </p>
        <Button variant="outline" disabled>
          Sign In (Coming in Phase 5)
        </Button>
      </CardContent>
    </Card>
  );
}
