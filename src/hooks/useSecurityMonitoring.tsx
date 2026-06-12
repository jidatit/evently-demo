
import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  event_type: string;
  user_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export const useSecurityMonitoring = () => {
  const { user } = useAuth();

  const logSecurityEvent = useCallback(async (event: SecurityEvent) => {
    try {
      const enhancedEvent = {
        ...event,
        user_id: event.user_id || user?.id,
        ip_address: event.ip_address || 'client-detected',
        user_agent: event.user_agent || navigator.userAgent,
        details: {
          ...event.details,
          timestamp: new Date().toISOString(),
          url: window.location.href
        }
      };

      // Insert into security_events table
      const { error } = await supabase
        .from('security_events')
        .insert([enhancedEvent]);

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Security monitoring error:', error);
    }
  }, [user?.id]);

  const logPageAccess = useCallback(() => {
    logSecurityEvent({
      event_type: 'PAGE_ACCESS',
      details: {
        path: window.location.pathname,
        referrer: document.referrer
      }
    });
  }, [logSecurityEvent]);

  const logSuspiciousActivity = useCallback((activity: string, details?: Record<string, any>) => {
    logSecurityEvent({
      event_type: 'SUSPICIOUS_ACTIVITY',
      details: {
        activity,
        ...details
      }
    });
  }, [logSecurityEvent]);

  const logFailedLogin = useCallback((email?: string) => {
    logSecurityEvent({
      event_type: 'FAILED_LOGIN',
      details: {
        email: email ? email.substring(0, 3) + '***' : 'unknown'
      }
    });
  }, [logSecurityEvent]);

  const logUnauthorizedAccess = useCallback((resource: string) => {
    logSecurityEvent({
      event_type: 'UNAUTHORIZED_ACCESS',
      details: {
        resource,
        attempted_access: true
      }
    });
  }, [logSecurityEvent]);

  useEffect(() => {
    // Log page access when component mounts
    logPageAccess();
  }, [logPageAccess]);

  return {
    logSecurityEvent,
    logPageAccess,
    logSuspiciousActivity,
    logFailedLogin,
    logUnauthorizedAccess
  };
};
