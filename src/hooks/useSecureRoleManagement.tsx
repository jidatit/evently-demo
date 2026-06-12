
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useSecurityMonitoring } from './useSecurityMonitoring';

interface RoleAssignmentResult {
  success: boolean;
  error?: string;
  message: string;
}

export const useSecureRoleManagement = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { logSecurityEvent } = useSecurityMonitoring();

  const assignRole = useCallback(async (targetUserId: string, role: 'admin' | 'vendor' | 'user'): Promise<RoleAssignmentResult> => {
    setLoading(true);
    
    try {
      // Log the attempt
      logSecurityEvent({
        event_type: 'ROLE_ASSIGNMENT_ATTEMPT',
        details: {
          target_user_id: targetUserId,
          role_requested: role
        }
      });

      const { data, error } = await supabase.rpc('secure_assign_role', {
        _target_user_id: targetUserId,
        _role: role
      });

      if (error) {
        console.error('Role assignment error:', error);
        return {
          success: false,
          error: 'DATABASE_ERROR',
          message: 'Failed to assign role due to database error'
        };
      }

      // Safely convert the Json response to our expected type
      const result = data as unknown as RoleAssignmentResult;
      
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }

      return result;
    } catch (error) {
      console.error('Role assignment exception:', error);
      return {
        success: false,
        error: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred'
      };
    } finally {
      setLoading(false);
    }
  }, [toast, logSecurityEvent]);

  const revokeRole = useCallback(async (targetUserId: string, role: 'admin' | 'vendor' | 'user'): Promise<RoleAssignmentResult> => {
    setLoading(true);
    
    try {
      // Log the attempt
      logSecurityEvent({
        event_type: 'ROLE_REVOCATION_ATTEMPT',
        details: {
          target_user_id: targetUserId,
          role_to_revoke: role
        }
      });

      const { data, error } = await supabase.rpc('secure_revoke_role', {
        _target_user_id: targetUserId,
        _role: role
      });

      if (error) {
        console.error('Role revocation error:', error);
        return {
          success: false,
          error: 'DATABASE_ERROR',
          message: 'Failed to revoke role due to database error'
        };
      }

      // Safely convert the Json response to our expected type
      const result = data as unknown as RoleAssignmentResult;
      
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }

      return result;
    } catch (error) {
      console.error('Role revocation exception:', error);
      return {
        success: false,
        error: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred'
      };
    } finally {
      setLoading(false);
    }
  }, [toast, logSecurityEvent]);

  return {
    assignRole,
    revokeRole,
    loading
  };
};
