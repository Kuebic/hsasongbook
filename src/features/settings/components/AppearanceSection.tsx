/**
 * AppearanceSection Component
 *
 * Settings section for customizing app appearance (theme).
 * Displays theme toggle control with description.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/lib/theme/ThemeToggle';

/**
 * Appearance Settings Section
 *
 * Provides UI for theme customization (light/dark/system).
 * Uses ThemeToggle component for theme switching.
 *
 * Features:
 * - Theme selection dropdown (Light, Dark, System)
 * - Descriptive help text
 * - Accessible labels
 *
 * Usage:
 * ```tsx
 * // In SettingsPage:
 * <AppearanceSection />
 * ```
 */
export default function AppearanceSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize how the app looks and feels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="theme-toggle">Theme</Label>
            <p className="text-sm text-muted-foreground">
              Select your preferred theme or sync with your system
            </p>
          </div>
          <ThemeToggle />
        </div>
      </CardContent>
    </Card>
  );
}
