
import { useState, useCallback } from 'react';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { SessionTimeoutWarning } from './SessionTimeoutWarning';
import { SessionMonitoring } from './SessionMonitoring';
import { SessionManager } from '@/lib/enhanced-security';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';

export const SecureSessionManagerProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, session, logout } = useEnhancedAuth();
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [securityThreats, setSecurityThreats] = useState<string[]>([]);
  const { logSecurityEvent } = useSecurityMonitoring();

  const handleSecurityThreat = useCallback((threats: string[]) => {
    setSecurityThreats(threats);

    // Auto-logout for critical threats
    const criticalThreats = ['session_integrity_violation', 'device_fingerprint_mismatch'];
    if (threats.some(threat => criticalThreats.includes(threat))) {
      console.warn('Critical security threat detected, forcing logout');
      logout();
      return;
    }
  }, [logout]);

  const handleActivityDetected = useCallback(() => {
    SessionManager.updateActivity();
    setShowInactivityWarning(false);
  }, []);

  const handleExtendSession = useCallback(() => {
    SessionManager.updateActivity();
    setShowInactivityWarning(false);
    logSecurityEvent({
      event_type: 'SESSION_EXTENDED_BY_USER',
      details: { manual_extension: true }
    });
  }, [logSecurityEvent]);

  const handleLogoutNow = useCallback(() => {
    logSecurityEvent({
      event_type: 'USER_INITIATED_LOGOUT_FROM_WARNING',
      details: { from_timeout_warning: true }
    });
    logout();
  }, [logSecurityEvent, logout]);

  return (
    <>
      {children}
      
      {session && user && (
        <SessionMonitoring
          onSecurityThreat={handleSecurityThreat}
          onActivityDetected={handleActivityDetected}
        />
      )}
      
      {showInactivityWarning && (
        <SessionTimeoutWarning
          isOpen={showInactivityWarning}
          onExtend={handleExtendSession}
          onLogout={handleLogoutNow}
        />
      )}
    </>
  );
};
