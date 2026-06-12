
// Security fixes implementation for Book'D project
// This file contains the logic for enhanced security measures

import { supabase } from '@/integrations/supabase/client';
import { securityMonitoring } from './enhanced-security-monitoring';

/**
 * Enhanced security validation for payment method access
 */
export const validatePaymentMethodAccess = async (
  vendorId: string, 
  userId: string,
  operation: 'select' | 'insert' | 'update' | 'delete'
) => {
  // Verify vendor ownership
  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('user_id')
    .eq('id', vendorId)
    .eq('user_id', userId)
    .single();

  if (error || !vendor) {
    await securityMonitoring.logSecurityEvent({
      event_type: 'UNAUTHORIZED_PAYMENT_METHOD_ACCESS',
      user_id: userId,
      details: {
        vendor_id: vendorId,
        operation,
        blocked: true
      },
      severity: 'high',
      category: 'access_control'
    });
    return false;
  }

  // Log legitimate access
  await securityMonitoring.logSecurityEvent({
    event_type: 'PAYMENT_METHOD_ACCESS_AUTHORIZED',
    user_id: userId,
    details: {
      vendor_id: vendorId,
      operation
    },
    severity: 'medium',
    category: 'data_access'
  });

  return true;
};

/**
 * Enhanced vendor contact access validation
 */
export const validateVendorContactAccess = async (
  vendorId: string,
  userId?: string
) => {
  // Anonymous users cannot access contact info
  if (!userId) {
    await securityMonitoring.logSecurityEvent({
      event_type: 'ANONYMOUS_CONTACT_ACCESS_BLOCKED',
      details: {
        vendor_id: vendorId,
        blocked: true
      },
      severity: 'medium',
      category: 'access_control'
    });
    return false;
  }

  // Rate limit contact access
  const rateLimitKey = `contact_access_${userId}`;
  const { data: rateCheck } = await supabase.rpc('enhanced_rate_limit_check', {
    identifier_param: rateLimitKey,
    action_type_param: 'vendor_contact_access',
    max_attempts: 5,
    window_minutes: 60,
    strict_mode: true
  });

  if (!rateCheck || !(rateCheck as any).allowed) {
    await securityMonitoring.logSecurityEvent({
      event_type: 'CONTACT_ACCESS_RATE_LIMITED',
      user_id: userId,
      details: {
        vendor_id: vendorId,
        blocked: true
      },
      severity: 'high',
      category: 'rate_limiting'
    });
    return false;
  }

  return true;
};

/**
 * System table access monitoring
 */
export const monitorSystemTableAccess = async (
  tableName: string,
  operation: string,
  userId?: string
) => {
  const systemTables = ['rate_limits', 'admin_setup_status', 'account_lockouts'];
  
  if (systemTables.includes(tableName)) {
    await securityMonitoring.logSecurityEvent({
      event_type: 'SYSTEM_TABLE_ACCESS_ATTEMPT',
      user_id: userId,
      details: {
        table_name: tableName,
        operation,
        blocked: true
      },
      severity: 'critical',
      category: 'system_security'
    });
  }
};

/**
 * Enhanced OTP security validation
 */
export const validateOTPSecurity = (otpConfig: { expiry: number; length: number }) => {
  const recommendations = [];
  
  if (otpConfig.expiry > 300) { // 5 minutes
    recommendations.push('Consider reducing OTP expiry to 5 minutes or less for better security');
  }
  
  if (otpConfig.length < 6) {
    recommendations.push('OTP length should be at least 6 digits');
  }
  
  return recommendations;
};

/**
 * Security monitoring for sensitive data access
 */
export const logSensitiveDataAccess = async (
  dataType: string,
  resourceId: string,
  userId?: string,
  accessGranted: boolean = true
) => {
  await securityMonitoring.logSecurityEvent({
    event_type: 'SENSITIVE_DATA_ACCESS',
    user_id: userId,
    details: {
      data_type: dataType,
      resource_id_hash: resourceId.substring(0, 8),
      access_granted: accessGranted,
      timestamp: new Date().toISOString()
    },
    severity: accessGranted ? 'medium' : 'high',
    category: 'data_access'
  });
};
