
-- Priority 1: Fix Critical Financial Data Exposure - Vendor Payouts RLS
DROP POLICY IF EXISTS "System can manage payouts" ON public.vendor_payouts;
DROP POLICY IF EXISTS "Vendors can view their own payouts" ON public.vendor_payouts;

-- Create secure RLS policies for vendor payouts
CREATE POLICY "Vendor owners can view their own payouts"
  ON public.vendor_payouts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors 
      WHERE vendors.id = vendor_payouts.vendor_id 
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payouts"
  ON public.vendor_payouts  
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System service role can manage payouts"
  ON public.vendor_payouts
  FOR ALL
  USING (current_setting('role') = 'service_role');

-- Priority 2: Add RLS to vendors_public table
ALTER TABLE public.vendors_public ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public vendor data"
  ON public.vendors_public
  FOR SELECT
  USING (is_frozen = false OR is_frozen IS NULL);

-- Priority 3: Secure database functions with proper search_path
CREATE OR REPLACE FUNCTION public.get_public_vendor_data_secure(vendor_id_param uuid DEFAULT NULL::uuid)
RETURNS TABLE(id uuid, business_name text, category text, description text, location text, logo_url text, created_at timestamp with time zone, is_frozen boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
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
    
  -- Enhanced security logging
  INSERT INTO public.security_events (
    event_type,
    details,
    severity,
    category
  ) VALUES (
    'PUBLIC_VENDOR_DATA_ACCESS_SECURE',
    jsonb_build_object(
      'vendor_id', vendor_id_param,
      'access_method', 'secure_public_function_v2',
      'data_level', 'public_only',
      'timestamp', now()
    ),
    'low',
    'data_access'
  );
END;
$function$;

-- Priority 4: Enhanced vendor contact access with strict controls
CREATE OR REPLACE FUNCTION public.get_vendor_contact_ultra_secure(vendor_id_param uuid)
RETURNS TABLE(business_name text, contact_email text, contact_phone text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rate_check jsonb;
  current_user_id uuid := auth.uid();
BEGIN
  -- SECURITY: Only authenticated users
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to access vendor contact information';
  END IF;
  
  -- SECURITY: Ultra-strict rate limiting (3 requests per hour)
  SELECT public.enhanced_rate_limit_check(
    current_user_id::text || '_contact_access',
    'vendor_contact_ultra',
    3,  -- max 3 attempts  
    60, -- per hour
    true -- strict mode
  ) INTO rate_check;
  
  IF NOT (rate_check->>'allowed')::boolean THEN
    -- Log blocked attempt
    INSERT INTO public.security_events (
      event_type,
      user_id,
      details,
      severity,
      category
    ) VALUES (
      'VENDOR_CONTACT_ACCESS_BLOCKED',
      current_user_id,
      jsonb_build_object(
        'vendor_id', vendor_id_param,
        'reason', 'rate_limit_exceeded',
        'reset_time', rate_check->>'reset_time',
        'timestamp', now()
      ),
      'critical',
      'security_violation'
    );
    
    RAISE EXCEPTION 'Rate limit exceeded for contact access. Reset time: %', 
      (rate_check->>'reset_time');
  END IF;
  
  -- Log the access attempt
  INSERT INTO public.security_events (
    event_type,
    user_id,
    details,
    severity,
    category
  ) VALUES (
    'VENDOR_CONTACT_ACCESS_ATTEMPT_ULTRA',
    current_user_id,
    jsonb_build_object(
      'vendor_id', vendor_id_param,
      'timestamp', now(),
      'rate_limit_remaining', rate_check->>'remaining_attempts',
      'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for'
    ),
    'critical',
    'sensitive_data_access'
  );
  
  -- Return contact info only if vendor exists and is active
  RETURN QUERY
  SELECT 
    v.business_name,
    v.contact_email,
    v.contact_phone
  FROM public.vendors v
  WHERE v.id = vendor_id_param 
    AND v.is_frozen = false;
    
  -- Log successful access with audit trail
  INSERT INTO public.security_events (
    event_type,
    user_id,
    details,
    severity,
    category
  ) VALUES (
    'VENDOR_CONTACT_ACCESSED_ULTRA_SECURE',
    current_user_id,
    jsonb_build_object(
      'vendor_id', vendor_id_param,
      'access_method', 'ultra_secure_contact_function',
      'timestamp', now(),
      'audit_trail', true
    ),
    'critical',
    'sensitive_data_access'
  );
END;
$function$;

-- Priority 5: Create secure audit table for financial access
CREATE TABLE IF NOT EXISTS public.financial_data_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  accessed_table text NOT NULL,
  accessed_record_id uuid,
  access_type text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.financial_data_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view financial audit logs"
  ON public.financial_data_audit
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can log financial access"
  ON public.financial_data_audit
  FOR INSERT
  WITH CHECK (true);

-- Priority 6: Enhanced admin setup security
CREATE OR REPLACE FUNCTION public.ultra_secure_admin_setup_check(
  ip_address_param text, 
  user_agent_param text,
  setup_key_param text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  setup_allowed boolean;
  rate_limit_result jsonb;
  expected_key text;
BEGIN
  -- Get expected setup key from environment
  expected_key := current_setting('app.admin_setup_key', true);
  
  -- Verify setup key
  IF expected_key IS NULL OR setup_key_param != expected_key THEN
    -- Log unauthorized attempt
    INSERT INTO public.security_events (event_type, details, ip_address, user_agent, severity, category)
    VALUES (
      'UNAUTHORIZED_ADMIN_SETUP_KEY_ATTEMPT',
      jsonb_build_object(
        'reason', 'Invalid or missing setup key',
        'timestamp', now()
      ),
      ip_address_param,
      user_agent_param,
      'critical',
      'admin_security'
    );
    
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Invalid setup key'
    );
  END IF;
  
  -- Check if admin setup is allowed
  SELECT public.is_admin_setup_allowed() INTO setup_allowed;
  
  IF NOT setup_allowed THEN
    INSERT INTO public.security_events (event_type, details, ip_address, user_agent, severity, category)
    VALUES (
      'UNAUTHORIZED_ADMIN_SETUP_EXPIRED_ATTEMPT',
      jsonb_build_object(
        'reason', 'Admin setup not allowed or expired',
        'timestamp', now()
      ),
      ip_address_param,
      user_agent_param,
      'critical',
      'admin_security'
    );
    
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Admin setup is not currently allowed or has expired'
    );
  END IF;
  
  -- Ultra-strict rate limiting for admin setup
  SELECT public.enhanced_rate_limit_check(
    'admin_setup_ultra_' || COALESCE(ip_address_param, 'unknown'),
    'admin_setup_ultra',
    2, -- max 2 attempts
    60, -- per hour
    true -- strict mode
  ) INTO rate_limit_result;
  
  IF NOT (rate_limit_result->>'allowed')::boolean THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Rate limit exceeded for admin setup attempts',
      'reset_time', rate_limit_result->>'reset_time'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'remaining_attempts', rate_limit_result->>'remaining_attempts'
  );
END;
$function$;
