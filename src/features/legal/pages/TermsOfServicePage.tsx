/**
 * Terms of Service Page
 */

import { LegalPageLayout } from '../components/LegalPageLayout';
import {
  TermsOfServiceContent,
  TERMS_LAST_UPDATED,
} from '../content/termsOfServiceContent';

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout title="Terms of Use" lastUpdated={TERMS_LAST_UPDATED}>
      <TermsOfServiceContent />
    </LegalPageLayout>
  );
}
