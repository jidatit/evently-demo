
import React, { ReactNode } from 'react';
import { CSRFProvider } from './EnhancedCSRFProtection';
import { EnhancedSecurityManager } from './EnhancedSecurityManager';

interface SecurityProviderWrapperProps {
  children: ReactNode;
}

export const SecurityProviderWrapper: React.FC<SecurityProviderWrapperProps> = ({ children }) => {
  return (
    <CSRFProvider>
      <EnhancedSecurityManager />
      {children}
    </CSRFProvider>
  );
};
