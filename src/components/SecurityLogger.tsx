
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  event_type: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

class SecurityLogger {
  private static instance: SecurityLogger;
  private events: SecurityEvent[] = [];

  static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  logEvent(event: SecurityEvent) {
    const enhancedEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      ip_address: this.getClientIP(),
      user_agent: navigator.userAgent
    };

    this.events.push(enhancedEvent);
    console.log('[SECURITY]', enhancedEvent);

    // In a production environment, you would send this to your logging service
    // For now, we'll just log to console
  }

  private getClientIP(): string {
    // This is a simplified approach - in production you'd use a proper IP detection service
    return 'client-ip-hidden';
  }

  logFailedLogin(email?: string) {
    this.logEvent({
      event_type: 'failed_login',
      metadata: { email: email ? email.substring(0, 3) + '***' : 'unknown' }
    });
  }

  logSuccessfulLogin(userId: string) {
    this.logEvent({
      event_type: 'successful_login',
      user_id: userId
    });
  }

  logUnauthorizedAccess(resource: string, userId?: string) {
    this.logEvent({
      event_type: 'unauthorized_access',
      user_id: userId,
      metadata: { resource }
    });
  }

  logSuspiciousActivity(activity: string, userId?: string) {
    this.logEvent({
      event_type: 'suspicious_activity',
      user_id: userId,
      metadata: { activity }
    });
  }
}

export const useSecurityLogger = () => {
  const logger = SecurityLogger.getInstance();

  useEffect(() => {
    // Log page access
    logger.logEvent({
      event_type: 'page_access',
      metadata: { 
        path: window.location.pathname,
        referrer: document.referrer
      }
    });
  }, [logger]);

  return logger;
};

export default SecurityLogger;
