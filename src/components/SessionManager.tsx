
import { useEffect, useState, useCallback } from 'react';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { SessionTimeoutWarning } from './SessionTimeoutWarning';
import { SessionManager, SecurityLogger } from '@/lib/enhanced-security';
import { CSRFProtection } from '@/lib/csrf-protection';

export const SessionManagerProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, session, logout } = useEnhancedAuth();
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [securityThreats, setSecurityThreats] = useState<string[]>([]);
  const [activityHistory, setActivityHistory] = useState<number[]>([]);

  // Enhanced security monitoring
  const detectSecurityThreats = useCallback(() => {
    const threats: string[] = [];

    // Check for suspicious session activity
    if (session && user) {
      const sessionAge = Date.now() - new Date(session.user.created_at).getTime();
      const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

      if (sessionAge > maxSessionAge) {
        threats.push('session_age_exceeded');
      }

      // Check for rapid request patterns (potential bot activity)
      if (activityHistory.length > 100) { // More than 100 activities in current session
        const recentActivity = activityHistory.slice(-10);
        const timeSpan = recentActivity[recentActivity.length - 1] - recentActivity[0];
        if (timeSpan < 1000) { // 10 activities in less than 1 second
          threats.push('rapid_requests');
        }
      }

      // Check for session integrity
      if (!SessionManager.validateSessionIntegrity(session)) {
        threats.push('session_integrity_violation');
      }
    }

    setSecurityThreats(threats);

    // Log and respond to threats
    if (threats.length > 0) {
      SecurityLogger.logSecurityEvent('SECURITY_THREATS_DETECTED', {
        userId: user?.id,
        threats,
        timestamp: Date.now()
      });

      // Auto-logout for critical threats
      if (threats.includes('session_integrity_violation')) {
        console.warn('Critical security threat detected, forcing logout');
        logout();
        return;
      }
    }
  }, [session, user, logout, activityHistory]);

  useEffect(() => {
    if (!session || !user) return;

    // Enhanced session monitoring with security checks
    const sessionCheck = setInterval(() => {
      detectSecurityThreats();

      if (SessionManager.isSessionExpired()) {
        console.log('Session expired, logging out...');
        SecurityLogger.logSecurityEvent('SESSION_EXPIRED', { userId: user.id });
        logout();
        return;
      }

      // Show warning if approaching timeout
      if (SessionManager.shouldShowTimeoutWarning() && !showInactivityWarning) {
        setShowInactivityWarning(true);
        SessionManager.markWarningShown();
      }
    }, 30000);

    // Enhanced activity tracking with security monitoring
    let activityTimeout: NodeJS.Timeout;
    let lastActivityTime = Date.now();
    
    const trackActivity = (event: Event) => {
      clearTimeout(activityTimeout);
      
      const currentTime = Date.now();
      const timeSinceLastActivity = currentTime - lastActivityTime;
      
      // Detect suspicious rapid activity
      if (timeSinceLastActivity < 50) { // Less than 50ms between activities
        SecurityLogger.logSecurityEvent('SUSPICIOUS_RAPID_ACTIVITY', {
          userId: user.id,
          eventType: event.type,
          timeDiff: timeSinceLastActivity
        });
      }
      
      lastActivityTime = currentTime;
      
      // Update activity history for threat detection
      setActivityHistory(prev => [...prev.slice(-99), currentTime]); // Keep last 100 activities
      
      activityTimeout = setTimeout(() => {
        SessionManager.updateActivity();
        setShowInactivityWarning(false);
        
        // Refresh CSRF token periodically on activity
        if (Math.random() < 0.1) { // 10% chance to refresh token
          CSRFProtection.initialize();
        }
      }, 1000); // Throttle to once per second
    };

    // Monitor various user activities
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    // Monitor for potential security events
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Session is paused when tab is hidden
        console.log('Tab hidden - session monitoring paused');
      } else {
        // Session is resumed when tab becomes visible
        console.log('Tab visible - session monitoring resumed');
        detectSecurityThreats(); // Check for threats when tab becomes visible
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Monitor for multiple tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'session_warning' && e.newValue) {
        SecurityLogger.logSecurityEvent('MULTIPLE_SESSIONS_DETECTED', {
          userId: user.id,
          timestamp: Date.now()
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(sessionCheck);
      clearTimeout(activityTimeout);
      events.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [session, user, logout, showInactivityWarning, detectSecurityThreats]);

  const handleExtendSession = () => {
    SessionManager.updateActivity();
    setShowInactivityWarning(false);
    SecurityLogger.logSecurityEvent('SESSION_EXTENDED_BY_USER', {
      userId: user?.id,
      timestamp: Date.now()
    });
  };

  const handleLogoutNow = () => {
    SecurityLogger.logSecurityEvent('USER_INITIATED_LOGOUT_FROM_WARNING', {
      userId: user?.id,
      timestamp: Date.now()
    });
    logout();
  };

  // Display security warnings if needed
  useEffect(() => {
    if (securityThreats.length > 0) {
      console.warn('Security threats detected:', securityThreats);
    }
  }, [securityThreats]);

  return (
    <>
      {children}
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
