
import { supabase } from '@/integrations/supabase/client';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset_time: string | null;
}

export class EnhancedRateLimiting {
  private static instance: EnhancedRateLimiting;
  private memoryStore = new Map<string, { count: number; resetTime: number }>();

  public static getInstance(): EnhancedRateLimiting {
    if (!EnhancedRateLimiting.instance) {
      EnhancedRateLimiting.instance = new EnhancedRateLimiting();
    }
    return EnhancedRateLimiting.instance;
  }

  async checkDatabaseRateLimit(
    identifier: string,
    actionType: string,
    maxAttempts: number = 5,
    windowMinutes: number = 60
  ): Promise<RateLimitResult> {
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        identifier_param: identifier,
        action_type_param: actionType,
        max_attempts: maxAttempts,
        window_minutes: windowMinutes
      });

      if (error) {
        console.error('Rate limit check error:', error);
        return this.fallbackRateLimit(identifier, maxAttempts, windowMinutes);
      }

      // Handle different response formats from the database
      if (data && typeof data === 'object' && data !== null) {
        return {
          allowed: (data as any).allowed ?? true,
          remaining: (data as any).remaining ?? maxAttempts,
          reset_time: (data as any).reset_time ?? null
        };
      }

      // Fallback for boolean response
      return {
        allowed: Boolean(data),
        remaining: Boolean(data) ? maxAttempts - 1 : 0,
        reset_time: null
      };
    } catch (error) {
      console.error('Rate limiting error:', error);
      return this.fallbackRateLimit(identifier, maxAttempts, windowMinutes);
    }
  }

  private fallbackRateLimit(identifier: string, maxAttempts: number, windowMinutes: number): RateLimitResult {
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    const key = identifier;
    
    const current = this.memoryStore.get(key);
    
    if (!current || now - current.resetTime > windowMs) {
      this.memoryStore.set(key, { count: 1, resetTime: now });
      return {
        allowed: true,
        remaining: maxAttempts - 1,
        reset_time: new Date(now + windowMs).toISOString()
      };
    }
    
    if (current.count >= maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        reset_time: new Date(current.resetTime + windowMs).toISOString()
      };
    }
    
    current.count++;
    return {
      allowed: true,
      remaining: maxAttempts - current.count,
      reset_time: new Date(current.resetTime + windowMs).toISOString()
    };
  }

  async recordAttempt(identifier: string, actionType: string, success: boolean = false): Promise<void> {
    try {
      // Try to record in database using security_events table instead
      await supabase.from('security_events').insert({
        event_type: 'RATE_LIMIT_ATTEMPT',
        details: {
          identifier,
          action_type: actionType,
          success
        },
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.log('Rate limit recording failed (non-critical):', error);
    }
  }

  async checkLoginRateLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkDatabaseRateLimit(identifier, 'login', 5, 15);
  }

  async checkSignupRateLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkDatabaseRateLimit(identifier, 'signup', 3, 60);
  }

  async checkAdminSetupRateLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkDatabaseRateLimit(identifier, 'admin_setup', 3, 60);
  }

  async checkSearchRateLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkDatabaseRateLimit(identifier, 'search', 20, 10); // 20 searches per 10 minutes
  }

  // Public methods for compatibility
  static async checkRateLimit(
    identifier: string,
    actionType: 'login' | 'signup' | 'admin_setup' | 'role_assignment' | 'password_reset' | 'search'
  ): Promise<RateLimitResult> {
    const instance = EnhancedRateLimiting.getInstance();
    switch (actionType) {
      case 'login':
        return instance.checkLoginRateLimit(identifier);
      case 'signup':
        return instance.checkSignupRateLimit(identifier);
      case 'admin_setup':
        return instance.checkAdminSetupRateLimit(identifier);
      case 'search':
        return instance.checkSearchRateLimit(identifier);
      default:
        return instance.checkDatabaseRateLimit(identifier, actionType, 5, 60);
    }
  }

  static async recordAttempt(identifier: string, actionType: string, success: boolean = false): Promise<void> {
    const instance = EnhancedRateLimiting.getInstance();
    return instance.recordAttempt(identifier, actionType, success);
  }
}

export const rateLimiter = EnhancedRateLimiting.getInstance();
