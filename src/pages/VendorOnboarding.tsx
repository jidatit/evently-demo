
import React from 'react';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import VendorOnboardingWizard from '@/components/VendorOnboardingWizard';

const VendorOnboarding: React.FC = () => {
  return (
    <ProtectedRoute requiredRole="pending_vendor"
      requireEmailVerified={true}>
      <VendorOnboardingWizard />
    </ProtectedRoute>
  );
};

export default VendorOnboarding;
