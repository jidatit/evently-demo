-- CRITICAL SECURITY FIX: Customer Payment Data Access Isolation

-- 1. Create stricter RLS policy for payments table to prevent cross-vendor data access
DROP POLICY IF EXISTS "Payments strict access control" ON public.payments;

-- New ultra-strict payment data policy - vendors can ONLY see payments for their own bookings
CREATE POLICY "Payments ultra strict vendor isolation" 
  ON public.payments 
  FOR SELECT 
  USING (
    -- Customer can see their own payments
    (customer_id IS NOT NULL AND customer_id = auth.uid()) OR
    (customer_id IS NULL AND customer_email = (
      SELECT email FROM public.profiles WHERE id = auth.uid()
    )) OR
    -- Vendor can ONLY see payments where they are the vendor for that specific booking
    (EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = payments.booking_id 
      AND EXISTS (
        SELECT 1 FROM public.vendors 
        WHERE vendors.id = bookings.vendor_id 
        AND vendors.user_id = auth.uid()
      )
    ))
  );

-- 2. Add payment data access logging function
CREATE OR REPLACE FUNCTION public.log_payment_data_access(
  payment_id_param uuid,
  access_reason text
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log any access to payment data with enhanced security monitoring
  PERFORM log_security_event(
    'CUSTOMER_PAYMENT_DATA_ACCESS',
    auth.uid(),
    jsonb_build_object(
      'payment_id_hash', substr(md5(payment_id_param::text), 1, 8),
      'access_reason', access_reason,
      'timestamp', now(),
      'security_level', 'critical'
    )
  );
END;
$function$;

-- 3. Create secure payment query function with enhanced isolation
CREATE OR REPLACE FUNCTION public.get_vendor_payments_secure(vendor_id_param uuid)
 RETURNS TABLE(
   id uuid,
   booking_id uuid,
   amount numeric,
   payment_status text,
   created_at timestamptz,
   customer_name text
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify vendor ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.vendors 
    WHERE id = vendor_id_param AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Not authorized to view payment data for this vendor';
  END IF;

  -- Log the payment data access
  PERFORM log_security_event(
    'VENDOR_PAYMENT_DATA_ACCESS_SECURE',
    auth.uid(),
    jsonb_build_object(
      'vendor_id', vendor_id_param,
      'access_method', 'secure_function',
      'timestamp', now()
    )
  );

  -- Return ONLY payments for bookings owned by this vendor
  RETURN QUERY
  SELECT 
    p.id,
    p.booking_id,
    p.amount,
    p.payment_status,
    p.created_at,
    p.customer_name
  FROM public.payments p
  INNER JOIN public.bookings b ON b.id = p.booking_id
  WHERE b.vendor_id = vendor_id_param;
END;
$function$;

-- Log this critical security fix
INSERT INTO public.security_events (
  event_type,
  details,
  severity,
  category
) VALUES (
  'CUSTOMER_PAYMENT_DATA_SECURITY_FIX',
  jsonb_build_object(
    'fixes_applied', ARRAY[
      'ultra_strict_payment_rls_policy',
      'payment_data_access_logging',
      'secure_vendor_payment_function',
      'cross_vendor_data_access_prevention'
    ],
    'timestamp', now()
  ),
  'critical',
  'security_enhancement'
);