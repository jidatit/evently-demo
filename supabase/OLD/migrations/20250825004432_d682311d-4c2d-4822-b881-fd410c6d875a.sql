
-- CRITICAL SECURITY OPERATION: Delete all users and associated data
-- This is a one-time admin operation that will permanently remove ALL users

-- Create a secure function to delete all users (admin only)
CREATE OR REPLACE FUNCTION public.delete_all_users_admin()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_count integer;
  deleted_count integer := 0;
  current_user_record record;
BEGIN
  -- SECURITY: Verify admin permissions
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Only administrators can delete all users';
  END IF;
  
  -- Log the critical security event
  INSERT INTO public.security_events (
    event_type,
    user_id,
    details,
    severity,
    category
  ) VALUES (
    'MASS_USER_DELETION_INITIATED',
    auth.uid(),
    jsonb_build_object(
      'timestamp', now(),
      'admin_id', auth.uid(),
      'operation', 'delete_all_users'
    ),
    'critical',
    'admin_security'
  );
  
  -- Get count of users before deletion
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- Delete all user data in proper order to handle foreign key constraints
  
  -- 1. Delete contract signatures first
  DELETE FROM public.contract_signatures;
  
  -- 2. Delete contracts
  DELETE FROM public.contracts;
  
  -- 3. Delete commission transactions
  DELETE FROM public.commission_transactions;
  
  -- 4. Delete vendor payouts
  DELETE FROM public.vendor_payouts;
  
  -- 5. Delete payments
  DELETE FROM public.payments;
  
  -- 6. Delete invoices
  DELETE FROM public.invoices;
  
  -- 7. Delete bookings
  DELETE FROM public.bookings;
  
  -- 8. Delete services
  DELETE FROM public.services;
  
  -- 9. Delete vendor media
  DELETE FROM public.vendor_media;
  
  -- 10. Delete vendor payment methods
  DELETE FROM public.vendor_payment_methods;
  
  -- 11. Delete vendors
  DELETE FROM public.vendors;
  
  -- 12. Delete user roles
  DELETE FROM public.user_roles;
  
  -- 13. Delete profiles
  DELETE FROM public.profiles;
  
  -- 14. Delete auth users (this is the critical part)
  -- We need to use the admin API for this
  FOR current_user_record IN 
    SELECT id FROM auth.users
  LOOP
    -- This will cascade delete the user
    PERFORM auth.admin_delete_user(current_user_record.id);
    deleted_count := deleted_count + 1;
  END LOOP;
  
  -- Final security log
  INSERT INTO public.security_events (
    event_type,
    details,
    severity,
    category
  ) VALUES (
    'MASS_USER_DELETION_COMPLETED',
    jsonb_build_object(
      'timestamp', now(),
      'users_before', user_count,
      'users_deleted', deleted_count,
      'operation_status', 'completed'
    ),
    'critical',
    'admin_security'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'All users deleted successfully',
    'users_deleted', deleted_count,
    'timestamp', now()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    INSERT INTO public.security_events (
      event_type,
      details,
      severity,
      category
    ) VALUES (
      'MASS_USER_DELETION_FAILED',
      jsonb_build_object(
        'error', SQLERRM,
        'timestamp', now()
      ),
      'critical',
      'admin_security'
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to delete all users'
    );
END;
$function$;
