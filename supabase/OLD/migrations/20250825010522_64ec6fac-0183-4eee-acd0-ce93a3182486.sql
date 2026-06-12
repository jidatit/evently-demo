-- CRITICAL SECURITY FIX: Simplify Payment Data Access Policies

-- 1. Drop the complex policy that uses nested EXISTS clauses
DROP POLICY IF EXISTS "Payments ultra strict vendor isolation" ON public.payments;

-- 2. Create a secure function to determine payment access authorization
CREATE OR REPLACE FUNCTION public.can_access_payment_data(payment_row public.payments)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid := auth.uid();
  user_email text;
  booking_vendor_id uuid;
BEGIN
  -- Return false if no user is authenticated
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if user is the direct customer (by ID)
  IF payment_row.customer_id IS NOT NULL AND payment_row.customer_id = current_user_id THEN
    RETURN true;
  END IF;

  -- Check if user is the customer (by email match with profile)
  IF payment_row.customer_id IS NULL AND payment_row.customer_email IS NOT NULL THEN
    SELECT email INTO user_email FROM public.profiles WHERE id = current_user_id;
    IF user_email IS NOT NULL AND user_email = payment_row.customer_email THEN
      RETURN true;
    END IF;
  END IF;

  -- Check if user is the vendor for this payment's booking
  IF payment_row.booking_id IS NOT NULL THEN
    SELECT vendor_id INTO booking_vendor_id 
    FROM public.bookings 
    WHERE id = payment_row.booking_id;
    
    IF booking_vendor_id IS NOT NULL THEN
      -- Check if current user owns this vendor
      IF EXISTS (
        SELECT 1 FROM public.vendors 
        WHERE id = booking_vendor_id AND user_id = current_user_id
      ) THEN
        RETURN true;
      END IF;
    END IF;
  END IF;

  -- Log unauthorized access attempt
  PERFORM log_security_event(
    'UNAUTHORIZED_PAYMENT_ACCESS_ATTEMPT',
    current_user_id,
    jsonb_build_object(
      'payment_id_hash', substr(md5(payment_row.id::text), 1, 8),
      'customer_id', payment_row.customer_id,
      'booking_id', payment_row.booking_id,
      'attempted_access', 'payment_data'
    )
  );

  RETURN false;
END;
$function$;

-- 3. Create simple, secure RLS policy using the security definer function
CREATE POLICY "Payments simple secure access" 
  ON public.payments 
  FOR SELECT 
  USING (can_access_payment_data(payments));

-- 4. Create additional policies for other operations with strict controls
CREATE POLICY "Payments insert customer only" 
  ON public.payments 
  FOR INSERT 
  WITH CHECK (
    -- Only authenticated users can create payments for themselves
    auth.uid() IS NOT NULL AND 
    (customer_id = auth.uid() OR customer_email = (
      SELECT email FROM public.profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Payments update vendor only" 
  ON public.payments 
  FOR UPDATE 
  USING (
    -- Only vendors can update payment status for their bookings
    EXISTS (
      SELECT 1 FROM public.bookings b
      INNER JOIN public.vendors v ON v.id = b.vendor_id
      WHERE b.id = payments.booking_id 
      AND v.user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Ensure the same condition for the updated row
    EXISTS (
      SELECT 1 FROM public.bookings b
      INNER JOIN public.vendors v ON v.id = b.vendor_id
      WHERE b.id = payments.booking_id 
      AND v.user_id = auth.uid()
    )
  );

-- 5. Enhance the secure payment query function with additional validation
CREATE OR REPLACE FUNCTION public.get_vendor_payments_secure(vendor_id_param uuid)
 RETURNS TABLE(
   id uuid,
   booking_id uuid,
   amount numeric,
   payment_status text,
   created_at timestamptz,
   customer_name text,
   customer_email text
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  -- Strict authentication check
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required for payment data access';
  END IF;

  -- Verify vendor ownership with enhanced validation
  IF NOT EXISTS (
    SELECT 1 FROM public.vendors 
    WHERE id = vendor_id_param 
    AND user_id = current_user_id
    AND is_frozen = false
  ) THEN
    -- Log unauthorized vendor access attempt
    PERFORM log_security_event(
      'UNAUTHORIZED_VENDOR_PAYMENT_ACCESS',
      current_user_id,
      jsonb_build_object(
        'attempted_vendor_id', vendor_id_param,
        'access_denied_reason', 'vendor_ownership_verification_failed'
      )
    );
    RAISE EXCEPTION 'Access denied: Vendor ownership verification failed';
  END IF;

  -- Log legitimate payment data access
  PERFORM log_security_event(
    'LEGITIMATE_VENDOR_PAYMENT_ACCESS',
    current_user_id,
    jsonb_build_object(
      'vendor_id', vendor_id_param,
      'access_method', 'secure_function_verified'
    )
  );

  -- Return payment data with explicit JOIN to ensure data integrity
  RETURN QUERY
  SELECT 
    p.id,
    p.booking_id,
    p.amount,
    p.payment_status,
    p.created_at,
    p.customer_name,
    p.customer_email
  FROM public.payments p
  INNER JOIN public.bookings b ON b.id = p.booking_id
  INNER JOIN public.vendors v ON v.id = b.vendor_id
  WHERE v.id = vendor_id_param
  AND v.user_id = current_user_id
  AND v.is_frozen = false
  ORDER BY p.created_at DESC;
END;
$function$;

-- 6. Add payment data integrity validation function
CREATE OR REPLACE FUNCTION public.validate_payment_data_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log all payment data access for audit trail
  PERFORM log_security_event(
    'PAYMENT_DATA_ACCESS_TRIGGER',
    auth.uid(),
    jsonb_build_object(
      'payment_id_hash', substr(md5(NEW.id::text), 1, 8),
      'operation', TG_OP,
      'customer_id', NEW.customer_id,
      'vendor_verified', EXISTS (
        SELECT 1 FROM public.bookings b
        INNER JOIN public.vendors v ON v.id = b.vendor_id
        WHERE b.id = NEW.booking_id AND v.user_id = auth.uid()
      )
    )
  );
  
  RETURN NEW;
END;
$function$;

-- 7. Create trigger for payment data access monitoring
DROP TRIGGER IF EXISTS payment_access_monitor ON public.payments;
CREATE TRIGGER payment_access_monitor
  AFTER SELECT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION validate_payment_data_access();

-- Log this critical security enhancement
INSERT INTO public.security_events (
  event_type,
  details,
  severity,
  category
) VALUES (
  'PAYMENT_SECURITY_POLICY_SIMPLIFIED',
  jsonb_build_object(
    'changes_applied', ARRAY[
      'removed_complex_nested_joins',
      'implemented_security_definer_function',
      'simplified_rls_policy_logic',
      'added_comprehensive_access_logging',
      'enhanced_vendor_ownership_validation',
      'added_payment_access_monitoring_trigger'
    ],
    'security_improvement', 'eliminated_potential_logic_flaws_in_complex_joins',
    'timestamp', now()
  ),
  'critical',
  'security_enhancement'
);