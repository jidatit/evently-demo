
import React, { useEffect, ReactNode } from 'react';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { SessionSecurityManager } from '@/lib/session-security-manager';
import { SecurityMonitoringAlert } from './SecurityMonitoringAlert';
import { triggerSecurityAlert } from './SecurityMonitoringAlert';

interface EnhancedSecurityProviderProps {
  children: ReactNode;
}

export const EnhancedSecurityProvider: React.FC<EnhancedSecurityProviderProps> = ({ 
  children 
}) => {
  const { user, session } = useConsolidatedAuth();

  useEffect(() => {
    if (user && session) {
      // Initialize session security
      SessionSecurityManager.initializeSession(user.id);

      // Set up security event listeners
      const handleBeforeUnload = () => {
        SessionSecurityManager.endSession(user.id);
      };

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          // User switched away from tab
          triggerSecurityAlert(
            'info',
            'Session Monitoring',
            'Session monitoring paused while tab is inactive',
            true
          );
        }
      };

      const handleSecurityViolation = (event: CustomEvent) => {
        const { violationType, details } = event.detail;
        
        switch (violationType) {
          case 'session_timeout':
            triggerSecurityAlert(
              'error',
              'Session Expired',
              'Your session has expired. Please log in again.',
              false
            );
            break;
          case 'device_change':
            triggerSecurityAlert(
              'warning',
              'Device Change Detected',
              'Your device fingerprint has changed. This could indicate a security issue.',
              false
            );
            break;
          case 'concurrent_session':
            triggerSecurityAlert(
              'warning',
              'Multiple Sessions',
              'Multiple active sessions detected. Older sessions have been terminated.',
              true
            );
            break;
          case 'suspicious_activity':
            triggerSecurityAlert(
              'warning',
              'Suspicious Activity',
              'Unusual activity patterns detected. Your session is being monitored.',
              false
            );
            break;
        }
      };

      // Add event listeners
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('security-violation' as any, handleSecurityViolation);

      // Cleanup on unmount or user change
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('security-violation' as any, handleSecurityViolation);
        
        if (user) {
          SessionSecurityManager.endSession(user.id);
        }
      };
    }
  }, [user, session]);

  // Enhanced CSP violation reporting
  useEffect(() => {
    const handleCSPViolation = (event: SecurityPolicyViolationEvent) => {
      console.error('CSP Violation:', event);
      
      triggerSecurityAlert(
        'warning',
        'Security Policy Violation',
        `Blocked ${event.violatedDirective}: ${event.blockedURI}`,
        true
      );

      // Log to security events
      import('@/integrations/supabase/client').then(({ supabase }) => {
        supabase.from('security_events').insert({
          event_type: 'CSP_VIOLATION',
          details: {
            violatedDirective: event.violatedDirective,
            blockedURI: event.blockedURI,
            sourceFile: event.sourceFile,
            lineNumber: event.lineNumber
          },
          severity: 'medium',
          category: 'content_security'
        });
      });
    };

    document.addEventListener('securitypolicyviolation', handleCSPViolation);
    
    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation);
    };
  }, []);

  // Network security monitoring
  useEffect(() => {
    const monitorNetworkRequests = () => {
      // Monitor for potential data exfiltration attempts
      const originalFetch = window.fetch;
      
      window.fetch = async (...args) => {
        const [resource, config] = args;
        let url: string;
        
        if (typeof resource === 'string') {
          url = resource;
        } else if (resource instanceof Request) {
          url = resource.url;
        } else {
          url = String(resource);
        }
        
        // Check for suspicious external requests
        const allowedDomains = [
          'supabase.co',
          'localhost',
          '127.0.0.1',
          window.location.hostname
        ];

        try {
          const urlObj = new URL(url, window.location.origin);
          const isExternalRequest = !allowedDomains.some(domain => 
            urlObj.hostname.includes(domain)
          );

          if (isExternalRequest) {
            console.warn('External request detected:', url);
            
            triggerSecurityAlert(
              'warning',
              'External Request Detected',
              `Request to external domain: ${urlObj.hostname}`,
              true
            );

            // Log security event
            import('@/integrations/supabase/client').then(({ supabase }) => {
              supabase.from('security_events').insert({
                event_type: 'EXTERNAL_REQUEST',
                details: {
                  url: url,
                  hostname: urlObj.hostname,
                  method: config?.method || 'GET'
                },
                severity: 'medium',
                category: 'network_security'
              });
            });
          }
        } catch (error) {
          console.warn('URL parsing failed for security check:', error);
        }

        return originalFetch(...args);
      };

      // Restore original fetch on cleanup
      return () => {
        window.fetch = originalFetch;
      };
    };

    const cleanup = monitorNetworkRequests();
    return cleanup;
  }, []);

  return (
    <>
      {children}
      <SecurityMonitoringAlert />
    </>
  );
};
