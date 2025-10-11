/**
 * SettingsPage Component
 *
 * Main settings page for HSA Songbook.
 * Provides UI for managing app preferences, viewing app info, and account settings.
 */

import { useNavigation } from '@/features/shared/hooks/useNavigation';
import Breadcrumbs from '@/features/shared/components/Breadcrumbs';
import AppearanceSection from '../components/AppearanceSection';
import AboutSection from '../components/AboutSection';
import AccountSection from '../components/AccountSection';

/**
 * Settings Page Component
 *
 * Displays settings interface with multiple sections:
 * - Appearance: Theme customization
 * - About: App version and database statistics
 * - Account: Authentication placeholder (Phase 5)
 *
 * Features:
 * - Breadcrumb navigation (Home → Settings)
 * - Responsive layout with max-width container
 * - Sectioned content with consistent spacing
 * - Accessible page structure
 *
 * Route: /settings
 *
 * Usage:
 * ```tsx
 * // In App.tsx routes:
 * <Route path="/settings" element={<SettingsPage />} />
 * ```
 */
export default function SettingsPage() {
  const { breadcrumbs } = useNavigation();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your app preferences and account settings
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        <AppearanceSection />
        <AboutSection />
        <AccountSection />
      </div>
    </div>
  );
}
