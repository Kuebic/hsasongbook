/**
 * Privacy Policy Page
 */

import { LegalPageLayout } from '../components/LegalPageLayout';
import {
  PrivacyPolicyContent,
  PRIVACY_POLICY_LAST_UPDATED,
} from '../content/privacyPolicyContent';

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated={PRIVACY_POLICY_LAST_UPDATED}
    >
      <PrivacyPolicyContent />
    </LegalPageLayout>
  );
}
