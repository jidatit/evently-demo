// Enhanced API client with security features
import { supabase } from '@/integrations/supabase/client';
import { EnhancedInputSecurity } from './enhanced-input-security';
import { EnhancedRateLimiting } from './enhanced-rate-limiting';
import { triggerSecurityAlert } from '@/components/SecurityMonitoringAlert';
import { SecureSearchValidator } from './secure-search-validator';

export class SecureApiClient {
  private static readonly MAX_REQUEST_SIZE = 1024 * 1024; // 1MB
  private static readonly REQUEST_TIMEOUT = 30000; // 30 seconds

  static async makeSecureRequest<T>(
    endpoint: string,
    data: any,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      rateLimitKey?: string;
      rateLimitType?: 'login' | 'signup' | 'admin_setup' | 'role_assignment' | 'password_reset' | 'search';
      validateInput?: boolean;
      requireAuth?: boolean;
    } = {}
  ): Promise<{ data: T | null; error: any; rateLimited?: boolean }> {
    
    const {
      method = 'POST',
      rateLimitKey,
      rateLimitType = 'login',
      validateInput = true,
      requireAuth = true
    } = options;

    try {
      // Authentication check
      if (requireAuth) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          triggerSecurityAlert('error', 'Authentication Required', 'Please log in to continue');
          return { data: null, error: { message: 'Authentication required' } };
        }
      }

      // Rate limiting check with enhanced search rate limiting
      if (rateLimitKey && rateLimitType) {
        const rateLimit = await EnhancedRateLimiting.checkRateLimit(
          rateLimitKey,
          rateLimitType
        );

        if (!rateLimit.allowed) {
          const resetTime = rateLimit.reset_time ? new Date(rateLimit.reset_time).toLocaleTimeString() : 'later';
          triggerSecurityAlert(
            'warning',
            'Rate Limited',
            `Too many requests. Try again at ${resetTime}`
          );
          return { data: null, error: null, rateLimited: true };
        }
      }

      // Request size validation
      const requestSize = new Blob([JSON.stringify(data)]).size;
      if (requestSize > this.MAX_REQUEST_SIZE) {
        triggerSecurityAlert('error', 'Request Too Large', 'Request exceeds maximum allowed size');
        return { data: null, error: { message: 'Request too large' } };
      }

      // Enhanced input validation and sanitization
      if (validateInput && data) {
        const sanitizedData = this.sanitizeRequestData(data);
        if (sanitizedData.hasErrors) {
          triggerSecurityAlert(
            'warning',
            'Input Validation Applied',
            'Some input data was corrected for security'
          );
        }
        
        if (sanitizedData.hasCriticalIssues) {
          triggerSecurityAlert(
            'error',
            'Dangerous Input Detected',
            'Request blocked due to security concerns'
          );
          return { data: null, error: { message: 'Request blocked for security reasons' } };
        }
        
        data = sanitizedData.data;
      }

      // Add security headers and metadata
      const secureData = {
        ...data,
        _metadata: {
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          requestId: crypto.randomUUID()
        }
      };

      // Make the request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      let result;
      
      if (endpoint.startsWith('functions/')) {
        // Edge function call
        result = await supabase.functions.invoke(endpoint.replace('functions/', ''), {
          body: secureData,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': secureData._metadata.requestId
          }
        });
      } else {
        // Direct API call - this would need to be implemented based on your API structure
        throw new Error('Direct API calls not implemented - use edge functions');
      }

      clearTimeout(timeoutId);

      // Log successful request
      if (rateLimitKey && rateLimitType) {
        await EnhancedRateLimiting.recordAttempt(rateLimitKey, rateLimitType, !result.error);
      }

      // Log security event for sensitive operations
      if (rateLimitType === 'admin_setup' || rateLimitType === 'role_assignment') {
        await this.logSecurityEvent('API_REQUEST', {
          endpoint,
          method,
          success: !result.error,
          rateLimitType,
          requestId: secureData._metadata.requestId
        });
      }

      return { data: result.data, error: result.error };

    } catch (error: any) {
      // Log failed request
      if (rateLimitKey && rateLimitType) {
        await EnhancedRateLimiting.recordAttempt(rateLimitKey, rateLimitType, false);
      }

      console.error('Secure API request failed:', error);
      
      // Don't expose internal errors to client
      const safeError = {
        message: this.getSafeErrorMessage(error),
        code: error.code || 'UNKNOWN_ERROR'
      };

      return { data: null, error: safeError };
    }
  }

  private static sanitizeRequestData(data: any): { data: any; hasErrors: boolean; hasCriticalIssues: boolean } {
    let hasErrors = false;
    let hasCriticalIssues = false;
    const sanitizedData = { ...data };

    // Recursively sanitize object properties
    const sanitizeObject = (obj: any, path: string = ''): any => {
      if (typeof obj === 'string') {
        // Use secure search validator for search-related fields
        if (path.includes('search') || path.includes('query') || path.includes('term')) {
          const searchResult = SecureSearchValidator.validateSearchInput(obj, path);
          if (!searchResult.isValid) {
            hasErrors = true;
            if (searchResult.riskAssessment === 'dangerous') {
              hasCriticalIssues = true;
            }
            console.warn(`Search validation failed at ${path}:`, searchResult.errors);
          }
          return searchResult.sanitized;
        }

        // Use enhanced input security for other fields
        const result = EnhancedInputSecurity.sanitizeInput(obj);
        if (!result.isValid) {
          hasErrors = true;
          if (result.riskLevel === 'critical') {
            hasCriticalIssues = true;
          }
          console.warn(`Input sanitization applied at ${path}:`, result.errors);
        }
        return result.sanitized;
      }

      if (Array.isArray(obj)) {
        return obj.map((item, index) => sanitizeObject(item, `${path}[${index}]`));
      }

      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        Object.keys(obj).forEach(key => {
          sanitized[key] = sanitizeObject(obj[key], path ? `${path}.${key}` : key);
        });
        return sanitized;
      }

      return obj;
    };

    const result = sanitizeObject(sanitizedData);
    return { data: result, hasErrors, hasCriticalIssues };
  }

  private static getSafeErrorMessage(error: any): string {
    // Return generic error messages to prevent information disclosure
    const errorMap: { [key: string]: string } = {
      'auth': 'Authentication failed. Please try again.',
      'permission': 'You do not have permission to perform this action.',
      'validation': 'Invalid input provided. Please check your data.',
      'rate_limit': 'Too many requests. Please try again later.',
      'timeout': 'Request timed out. Please try again.',
      'network': 'Network error occurred. Please check your connection.',
      'search': 'Search request failed. Please try different terms.',
    };

    const errorType = error.message?.toLowerCase() || '';
    
    for (const [key, message] of Object.entries(errorMap)) {
      if (errorType.includes(key)) {
        return message;
      }
    }

    return 'An error occurred. Please try again.';
  }

  private static async logSecurityEvent(eventType: string, details: any): Promise<void> {
    try {
      await supabase.from('security_events').insert({
        event_type: eventType,
        details,
        ip_address: 'client-detected',
        user_agent: navigator.userAgent,
        severity: 'medium',
        category: 'api_security'
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Enhanced secure search method
  static async secureSearch(searchParams: {
    searchTerm?: string;
    category?: string;
    location?: string;
  }) {
    // Validate all search parameters
    const validatedParams: any = {};
    
    if (searchParams.searchTerm) {
      const searchValidation = SecureSearchValidator.validateSearchInput(searchParams.searchTerm, 'Search Term');
      if (!searchValidation.isValid) {
        return { data: null, error: { message: 'Invalid search term', details: searchValidation.errors } };
      }
      validatedParams.searchTerm = searchValidation.sanitized;
    }

    if (searchParams.location) {
      const locationValidation = SecureSearchValidator.validateSearchInput(searchParams.location, 'Location');
      if (!locationValidation.isValid) {
        return { data: null, error: { message: 'Invalid location', details: locationValidation.errors } };
      }
      validatedParams.location = locationValidation.sanitized;
    }

    if (searchParams.category) {
      const allowedCategories = ['Photography', 'Catering', 'Music', 'Decoration', 'Planning', 'Venue', 'Transportation', 'Other'];
      const categoryValidation = SecureSearchValidator.validateCategoryInput(searchParams.category, allowedCategories);
      if (!categoryValidation.isValid) {
        return { data: null, error: { message: 'Invalid category', details: categoryValidation.errors } };
      }
      validatedParams.category = categoryValidation.sanitized;
    }

    return this.makeSecureRequest('functions/secure-search', validatedParams, {
      rateLimitKey: 'search_' + (validatedParams.searchTerm || 'anonymous'),
      rateLimitType: 'search',
      requireAuth: false
    });
  }

  static async secureLogin(email: string, password: string) {
    const emailResult = EnhancedInputSecurity.validateEmail(email);
    
    return this.makeSecureRequest('auth/login', {
      email: emailResult.sanitized,
      password // Don't sanitize passwords
    }, {
      rateLimitKey: emailResult.sanitized,
      rateLimitType: 'login',
      requireAuth: false
    });
  }

  static async secureSignup(email: string, password: string, additionalData: any = {}) {
    const emailResult = EnhancedInputSecurity.validateEmail(email);
    
    return this.makeSecureRequest('auth/signup', {
      email: emailResult.sanitized,
      password,
      ...additionalData
    }, {
      rateLimitKey: emailResult.sanitized,
      rateLimitType: 'signup',
      requireAuth: false
    });
  }

  static async secureAdminSetup(email: string, adminKey: string) {
    const emailResult = EnhancedInputSecurity.validateEmail(email);
    
    return this.makeSecureRequest('functions/set-admin', {
      email: emailResult.sanitized,
      adminKey
    }, {
      rateLimitKey: `admin_setup_${emailResult.sanitized}`,
      rateLimitType: 'admin_setup',
      requireAuth: false
    });
  }
}
