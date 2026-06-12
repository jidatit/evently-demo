
-- Priority 1: Critical Security Fixes

-- 1. Drop insecure views that bypass RLS
DROP VIEW IF EXISTS public.vendors_contact_safe;
DROP VIEW IF EXISTS public.vendors_public_safe;

-- 2. Fix search path issues in security functions
CREATE OR REPLACE FUNCTION public.log_security_event(event_type text, user_id_param uuid DEFAULT NULL::uuid, details_param jsonb DEFAULT NULL::jsonb, ip_address_param text DEFAULT NULL::text, user_agent_param text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.security_events (
    event_type,
    user_id,
    details,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    event_type,
    COALESCE(user_id_param, auth.uid()),
    details_param,
    ip_address_param,
    user_agent_param,
    now()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_session_security(session_data jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Basic session validation checks
  IF session_data IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if session has required fields
  IF NOT (session_data ? 'access_token' AND session_data ? 'user') THEN
    RETURN false;
  END IF;
  
  -- Additional integrity checks can be added here
  RETURN true;
END;
$function$;

-- 3. Strengthen RLS policies for customer data protection

-- Fix bookings table - ensure proper customer data isolation
DROP POLICY IF EXISTS "Customers can view their own bookings via profile" ON public.bookings;
CREATE POLICY "Customers can view their own bookings via profile" 
  ON public.bookings 
  FOR SELECT 
  USING (
    (customer_id IS NOT NULL AND customer_id = auth.uid()) OR
    (customer_id IS NULL AND customer_email IS NOT NULL AND customer_email = (
      SELECT email FROM public.profiles WHERE id = auth.uid()
    ))
  );

-- Fix invoices table - ensure vendors can't see other vendors' customer data
DROP POLICY IF EXISTS "Invoices strict customer access only" ON public.invoices;
CREATE POLICY "Invoices strict customer access only" 
  ON public.invoices 
  FOR SELECT 
  USING (
    -- Customer can see their own invoices
    (customer_id IS NOT NULL AND customer_id = auth.uid()) OR
    (customer_id IS NULL AND customer_email = (
      SELECT email FROM public.profiles WHERE id = auth.uid()
    )) OR
    -- Vendor can see ONLY their own invoices (not other vendors' customer data)
    (EXISTS (
      SELECT 1 FROM public.vendors 
      WHERE vendors.id = invoices.vendor_id 
      AND vendors.user_id = auth.uid()
    ))
  );

-- Fix payments table - strengthen customer data access control
DROP POLICY IF EXISTS "Payments strict access control" ON public.payments;
CREATE POLICY "Payments strict access control" 
  ON public.payments 
  FOR SELECT 
  USING (
    -- Customer can see their own payments
    (customer_id IS NOT NULL AND customer_id = auth.uid()) OR
    (customer_id IS NULL AND customer_email = (
      SELECT email FROM public.profiles WHERE id = auth.uid()
    )) OR
    -- Vendor can see ONLY payments for their services
    (EXISTS (
      SELECT 1 FROM public.vendors 
      WHERE vendors.id = payments.vendor_id 
      AND vendors.user_id = auth.uid()
    ))
  );

-- 4. Secure vendor payment methods with granular permissions
DROP POLICY IF EXISTS "Vendors can manage their own payment methods" ON public.vendor_payment_methods;

-- Split into separate read/write policies
CREATE POLICY "Vendors can view their own payment methods" 
  ON public.vendor_payment_methods 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors 
      WHERE vendors.id = vendor_payment_methods.vendor_id 
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can insert their own payment methods" 
  ON public.vendor_payment_methods 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendors 
      WHERE vendors.id = vendor_payment_methods.vendor_id 
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update their own payment methods" 
  ON public.vendor_payment_methods 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors 
      WHERE vendors.id = vendor_payment_methods.vendor_id 
      AND vendors.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendors 
      WHERE vendors.id = vendor_payment_methods.vendor_id 
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can delete their own payment methods" 
  ON public.vendor_payment_methods 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors 
      WHERE vendors.id = vendor_payment_methods.vendor_id 
      AND vendors.user_id = auth.uid()
    )
  );

-- 5. Create secure replacement functions for the dropped views
CREATE OR REPLACE FUNCTION public.get_safe_public_vendors(vendor_id_param uuid DEFAULT NULL)
 RETURNS TABLE(
   id uuid, 
   business_name text, 
   category text, 
   description text, 
   location text, 
   logo_url text, 
   created_at timestamptz, 
   is_frozen boolean
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log public vendor data access
  PERFORM log_security_event(
    'SAFE_PUBLIC_VENDOR_ACCESS',
    NULL,
    jsonb_build_object(
      'vendor_id_filter', vendor_id_param,
      'timestamp', now()
    )
  );

  RETURN QUERY
  SELECT 
    v.id,
    v.business_name,
    v.category,
    v.description,
    v.location,
    v.logo_url,
    v.created_at,
    v.is_frozen
  FROM public.vendors v
  WHERE v.is_frozen = false
    AND (vendor_id_param IS NULL OR v.id = vendor_id_param);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_safe_vendor_contact_info(vendor_id_param uuid)
 RETURNS TABLE(
   id uuid,
   business_name text,
   contact_email text,
   contact_phone text
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Require authentication for contact info
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required for vendor contact information';
  END IF;

  -- Rate limiting check
  IF NOT check_rate_limit(
    auth.uid()::text || '_contact_access',
    'vendor_contact',
    5,  -- max 5 requests
    60  -- per hour
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded for contact access requests';
  END IF;

  -- Log the secure contact access
  PERFORM log_security_event(
    'SECURE_VENDOR_CONTACT_ACCESS',
    auth.uid(),
    jsonb_build_object(
      'vendor_id', vendor_id_param,
      'access_method', 'secure_function',
      'timestamp', now()
    )
  );

  RETURN QUERY
  SELECT 
    v.id,
    v.business_name,
    v.contact_email,
    v.contact_phone
  FROM public.vendors v
  WHERE v.id = vendor_id_param 
    AND v.is_frozen = false;
END;
$function$;

-- 6. Add customer data audit logging
CREATE OR REPLACE FUNCTION public.log_customer_data_access(
  data_type text,
  customer_identifier text,
  access_reason text
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM log_security_event(
    'CUSTOMER_DATA_ACCESS',
    auth.uid(),
    jsonb_build_object(
      'data_type', data_type,
      'customer_identifier_hash', substr(md5(customer_identifier), 1, 8),
      'access_reason', access_reason,
      'timestamp', now()
    )
  );
END;
$function$;

-- Log this security fix implementation
INSERT INTO public.security_events (
  event_type,
  details,
  severity,
  category
) VALUES (
  'SECURITY_FIXES_IMPLEMENTED',
  jsonb_build_object(
    'fixes_applied', ARRAY[
      'dropped_insecure_views',
      'fixed_search_path_issues',
      'strengthened_customer_data_rls',
      'secured_payment_methods_access',
      'added_secure_vendor_functions',
      'added_customer_data_audit_logging'
    ],
    'timestamp', now()
  ),
  'high',
  'security_enhancement'
);
