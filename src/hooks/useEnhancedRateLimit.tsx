
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitResult {
  allowed: boolean;
  remaining_attempts: number;
  reset_time: string | null;
  blocked?: boolean;
  strict_mode?: boolean;
}

export const useEnhancedRateLimit = () => {
  const [isChecking, setIsChecking] = useState(false);

  const checkRateLimit = async (
    identifier: string,
    actionType: string,
    maxAttempts: number = 5,
    windowMinutes: number = 15,
    strictMode: boolean = false
  ): Promise<RateLimitResult> => {
    setIsChecking(true);
    
    try {
      const { data, error } = await supabase.rpc('enhanced_rate_limit_check', {
        identifier_param: identifier,
        action_type_param: actionType,
        max_attempts: maxAttempts,
        window_minutes: windowMinutes,
        strict_mode: strictMode
      });

      if (error) {
        console.error('Rate limit check error:', error);
        return {
          allowed: false,
          remaining_attempts: 0,
          reset_time: null
        };
      }

      // Type assertion with proper checking
      const result = data as unknown;
      if (typeof result === 'object' && result !== null && 
          'allowed' in result && 'remaining_attempts' in result) {
        return result as RateLimitResult;
      }

      // Fallback if data doesn't match expected structure
      return {
        allowed: false,
        remaining_attempts: 0,
        reset_time: null
      };
    } catch (error) {
      console.error('Rate limit error:', error);
      return {
        allowed: false,
        remaining_attempts: 0,
        reset_time: null
      };
    } finally {
      setIsChecking(false);
    }
  };

  const recordAttempt = async (
    identifier: string,
    actionType: string,
    success: boolean = false
  ): Promise<void> => {
    try {
      await supabase.from('security_events').insert({
        event_type: 'RATE_LIMIT_ATTEMPT',
        details: {
          identifier_hash: identifier.substring(0, 8),
          action_type: actionType,
          success
        }
      });
    } catch (error) {
      console.log('Rate limit recording failed (non-critical):', error);
    }
  };

  return {
    checkRateLimit,
    recordAttempt,
    isChecking
  };
};
