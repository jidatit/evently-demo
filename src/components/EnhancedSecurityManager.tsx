
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SecurityLogger } from '@/lib/enhanced-security';

interface SecurityConfig {
  sessionTimeout: number;
  maxLoginAttempts: number;
  requireStrongPasswords: boolean;
  enableCSRFProtection: boolean;
  otpExpiryMinutes: number;
}

export const EnhancedSecurityManager: React.FC = () => {
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    sessionTimeout: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
    maxLoginAttempts: 5,
    requireStrongPasswords: true,
    enableCSRFProtection: true,
    otpExpiryMinutes: 3
  });
  const { toast } = useToast();

  useEffect(() => {
    initializeSecurityMonitoring();
    setupSessionTimeout();
  }, []);

  const initializeSecurityMonitoring = () => {
    // Monitor for suspicious activities
    const detectSuspiciousActivity = () => {
      const rapidClicks = sessionStorage.getItem('rapid_clicks') || '0';
      if (parseInt(rapidClicks) > 50) {
        SecurityLogger.logSecurityEvent('SUSPICIOUS_RAPID_CLICKS', {
          clickCount: rapidClicks,
          timestamp: Date.now()
        });
      }
    };

    // Monitor for multiple failed attempts
    const monitorFailedAttempts = () => {
      const failedAttempts = sessionStorage.getItem('failed_login_attempts') || '0';
      if (parseInt(failedAttempts) >= securityConfig.maxLoginAttempts) {
        SecurityLogger.logSecurityEvent('ACCOUNT_LOCKOUT_TRIGGERED', {
          attemptCount: failedAttempts,
          timestamp: Date.now()
        });
        
        toast({
          title: 'Account Temporarily Locked',
          description: `Too many failed login attempts. Please try again in 15 minutes.`,
          variant: 'destructive',
        });
      }
    };

    // Set up event listeners
    document.addEventListener('click', detectSuspiciousActivity);
    
    // Check failed attempts on load
    monitorFailedAttempts();

    return () => {
      document.removeEventListener('click', detectSuspiciousActivity);
    };
  };

  const setupSessionTimeout = () => {
    let sessionTimer: NodeJS.Timeout;
    let warningTimer: NodeJS.Timeout;

    const resetTimers = () => {
      clearTimeout(sessionTimer);
      clearTimeout(warningTimer);
      
      // Warning 5 minutes before timeout
      warningTimer = setTimeout(() => {
        toast({
          title: 'Session Expiring Soon',
          description: 'Your session will expire in 5 minutes. Please save your work.',
          variant: 'destructive',
        });
      }, securityConfig.sessionTimeout - 5 * 60 * 1000);

      // Auto logout
      sessionTimer = setTimeout(async () => {
        SecurityLogger.logSecurityEvent('SESSION_TIMEOUT', {
          timestamp: Date.now(),
          reason: 'Automatic timeout'
        });
        
        await supabase.auth.signOut();
        
        toast({
          title: 'Session Expired',
          description: 'You have been logged out due to inactivity.',
          variant: 'destructive',
        });
      }, securityConfig.sessionTimeout);
    };

    // Reset timers on user activity
    const activities = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activities.forEach(event => {
      document.addEventListener(event, resetTimers, true);
    });

    // Initial timer setup
    resetTimers();

    return () => {
      clearTimeout(sessionTimer);
      clearTimeout(warningTimer);
      activities.forEach(event => {
        document.removeEventListener(event, resetTimers, true);
      });
    };
  };

  return null; // This component works in the background
};
