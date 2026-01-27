/**
 * SettingsPage Component
 *
 * Main settings page for HSA Songbook.
 * Provides UI for managing app preferences, viewing app info, and account settings.
 */

import { useNavigation } from '@/features/shared/hooks/useNavigation';
import Breadcrumbs from '@/features/shared/components/Breadcrumbs';
import { useAuth } from '@/features/auth';
import { SettingsAccordion } from '../components/SettingsAccordion';

/**
 * Settings Page Component
 *
 * Displays settings interface with accordion-based sections:
 * - Appearance: Theme and color customization
 * - Chord Display: Chord styling options (authenticated only)
 * - Account: User profile and authentication
 * - About: App version and statistics
 *
 * Features:
 * - Breadcrumb navigation (Home → Settings)
 * - Accordion layout for space efficiency
 * - Responsive design with max-width container
 * - Sticky live preview at bottom
 *
 * Route: /settings
 */
export default function SettingsPage() {
  const { breadcrumbs } = useNavigation();
  const { user } = useAuth();
  const isAuthenticated = user && !user.isAnonymous;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Breadcrumbs */}
      <div className="mb-4">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your preferences and account
        </p>
      </div>

      {/* Settings Accordion */}
      <SettingsAccordion isAuthenticated={!!isAuthenticated} />
    </div>
  );
}
