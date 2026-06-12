
import { useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';

interface SessionMonitoringProps {
  onSecurityThreat: (threats: string[]) => void;
  onActivityDetected: () => void;
}

export const SessionMonitoring = ({ onSecurityThreat, onActivityDetected }: SessionMonitoringProps) => {
  const { user, session } = useAuth();
  const { logSecurityEvent, logSuspiciousActivity } = useSecurityMonitoring();

  const detectSecurityThreats = useCallback(() => {
    const threats: string[] = [];

    if (session && user) {
      const sessionAge = Date.now() - new Date(session.user.created_at).getTime();
      const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

      if (sessionAge > maxSessionAge) {
        threats.push('session_age_exceeded');
      }

      // Additional threat detection logic can be added here
    }

    if (threats.length > 0) {
      logSecurityEvent({
        event_type: 'SECURITY_THREATS_DETECTED',
        details: {
          threats,
          session_id: session?.access_token ? 'present' : 'missing'
        }
      });
      onSecurityThreat(threats);
    }
  }, [session, user, logSecurityEvent, onSecurityThreat]);

  const trackActivity = useCallback((event: Event) => {
    onActivityDetected();
    
    // Detect suspicious rapid activity
    const now = Date.now();
    const lastActivity = parseInt(sessionStorage.getItem('lastActivity') || '0');
    const timeDiff = now - lastActivity;
    
    if (timeDiff < 50 && lastActivity > 0) { // Less than 50ms between activities
      logSuspiciousActivity('RAPID_ACTIVITY', {
        event_type: event.type,
        time_diff: timeDiff
      });
    }
    
    sessionStorage.setItem('lastActivity', now.toString());
  }, [onActivityDetected, logSuspiciousActivity]);

  useEffect(() => {
    if (!session || !user) return;

    // Security threat detection interval
    const threatInterval = setInterval(detectSecurityThreats, 30000);

    // Activity tracking
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    // Visibility change monitoring
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logSecurityEvent({
          event_type: 'TAB_HIDDEN',
          details: { session_paused: true }
        });
      } else {
        logSecurityEvent({
          event_type: 'TAB_VISIBLE',
          details: { session_resumed: true }
        });
        detectSecurityThreats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(threatInterval);
      events.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, user, detectSecurityThreats, trackActivity, logSecurityEvent]);

  return null; // This is a headless component
};
