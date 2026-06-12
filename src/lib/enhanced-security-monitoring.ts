
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  event_type: string;
  user_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
}

/**
 * Enhanced Security Monitoring with improved logging and customer data protection
 */
export class EnhancedSecurityMonitoring {
  private static instance: EnhancedSecurityMonitoring;

  static getInstance(): EnhancedSecurityMonitoring {
    if (!EnhancedSecurityMonitoring.instance) {
      EnhancedSecurityMonitoring.instance = new EnhancedSecurityMonitoring();
    }
    return EnhancedSecurityMonitoring.instance;
  }

  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const enhancedEvent = {
        ...event,
        ip_address: event.ip_address || this.getClientIP(),
        user_agent: event.user_agent || navigator.userAgent,
        severity: event.severity || 'medium',
        category: event.category || 'general',
        details: {
          ...event.details,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          session_id: this.getSessionId()
        }
      };

      // Use the updated log_security_event function with fixed search_path
      const { error } = await supabase.rpc('log_security_event', {
        event_type: enhancedEvent.event_type,
        user_id_param: enhancedEvent.user_id,
        details_param: enhancedEvent.details,
        ip_address_param: enhancedEvent.ip_address,
        user_agent_param: enhancedEvent.user_agent
      });

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Security monitoring error:', error);
    }
  }

  async logCustomerDataAccess(
    dataType: string,
    customerIdentifier: string,
    accessReason: string
  ): Promise<void> {
    try {
      // Use direct security event logging instead of non-existent function
      await this.logSecurityEvent({
        event_type: 'CUSTOMER_DATA_ACCESS',
        details: {
          data_type: dataType,
          customer_identifier_hash: customerIdentifier.substring(0, 8),
          access_reason: accessReason
        },
        severity: 'high',
        category: 'data_access'
      });
    } catch (error) {
      console.error('Failed to log customer data access:', error);
    }
  }

  async logVendorContactAccess(vendorId: string, accessType: 'view' | 'reveal'): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'VENDOR_CONTACT_ACCESS',
      details: {
        vendor_id: vendorId,
        access_type: accessType,
        security_level: 'enhanced'
      },
      severity: 'high',
      category: 'data_access'
    });
  }

  async logSuspiciousActivity(activity: string, details?: Record<string, any>): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'SUSPICIOUS_ACTIVITY',
      details: {
        activity,
        security_enhancement: 'active',
        ...details
      },
      severity: 'high',
      category: 'threat_detection'
    });
  }

  async logFailedLogin(email?: string): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'FAILED_LOGIN',
      details: {
        email: email ? email.substring(0, 3) + '***' : 'unknown',
        security_level: 'enhanced'
      },
      severity: 'medium',
      category: 'authentication'
    });
  }

  async logUnauthorizedAccess(resource: string): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'UNAUTHORIZED_ACCESS',
      details: {
        resource,
        attempted_access: true,
        security_enhancement: 'blocked'
      },
      severity: 'high',
      category: 'access_control'
    });
  }

  async logPageAccess(): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'PAGE_ACCESS',
      details: {
        path: window.location.pathname,
        referrer: document.referrer,
        enhanced_monitoring: true
      },
      severity: 'low',
      category: 'navigation'
    });
  }

  private getClientIP(): string {
    // This is a simplified approach - in production you'd use a proper IP detection service
    return 'client-ip-detected';
  }

  private getSessionId(): string {
    // Generate or retrieve session identifier
    let sessionId = sessionStorage.getItem('security_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('security_session_id', sessionId);
    }
    return sessionId;
  }
}

// Export singleton instance
export const securityMonitoring = EnhancedSecurityMonitoring.getInstance();

// Convenience functions
export const logSecurityEvent = (event: SecurityEvent) => securityMonitoring.logSecurityEvent(event);
export const logCustomerDataAccess = (dataType: string, customerIdentifier: string, accessReason: string) => 
  securityMonitoring.logCustomerDataAccess(dataType, customerIdentifier, accessReason);
export const logVendorContactAccess = (vendorId: string, accessType: 'view' | 'reveal') => 
  securityMonitoring.logVendorContactAccess(vendorId, accessType);
export const logSuspiciousActivity = (activity: string, details?: Record<string, any>) => 
  securityMonitoring.logSuspiciousActivity(activity, details);
export const logFailedLogin = (email?: string) => securityMonitoring.logFailedLogin(email);
export const logUnauthorizedAccess = (resource: string) => securityMonitoring.logUnauthorizedAccess(resource);
export const logPageAccess = () => securityMonitoring.logPageAccess();
