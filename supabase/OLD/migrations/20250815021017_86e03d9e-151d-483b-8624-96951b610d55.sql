-- COMPREHENSIVE SECURITY FIX: Complete lockdown of sensitive vendor information
-- This addresses all remaining vendor data exposure vulnerabilities

-- 1. Create a view for public vendor data only (no sensitive info)
CREATE OR REPLACE VIEW public.vendors_public AS
SELECT 
  id,
  business_name,
  category,
  description,
  location,
  logo_url,
  created_at,
  is_frozen
FROM public.vendors
WHERE is_frozen = false;

-- Grant appropriate access to the public view
GRANT SELECT ON public.vendors_public TO anon, authenticated;

-- 2. Completely revoke public access to the vendors table
REVOKE ALL ON public.vendors FROM anon;
REVOKE SELECT ON public.vendors FROM authenticated;

-- Grant back only to authenticated role for specific use cases
GRANT SELECT (id, business_name, category, description, location, logo_url, created_at, is_frozen) 
ON public.vendors TO authenticated;

-- 3. Drop and recreate more restrictive policies for vendors table
DROP POLICY IF EXISTS "Authenticated users can browse basic vendor info" ON public.vendors;
DROP POLICY IF EXISTS "Contact info for verified booking intent only" ON public.vendors;

-- Policy: Only allow basic info access for authenticated users
CREATE POLICY "Authenticated users basic vendor info only"
ON public.vendors
FOR SELECT 
TO authenticated
USING (
  is_frozen = false AND
  -- Only expose safe columns, block sensitive data
  TRUE
);

-- Policy: Sensitive data only for vendor owners
CREATE POLICY "Vendor owners sensitive data access"
ON public.vendors  
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- 4. Update secure functions to use more restrictive approach
CREATE OR REPLACE FUNCTION public.get_public_vendor_data_secure(vendor_id_param uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  business_name text,
  category text, 
  description text,
  location text,
  logo_url text,
  created_at timestamp with time zone,
  is_frozen boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- SECURITY: This function only returns absolutely safe public data
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
  FROM public.vendors_public v
  WHERE vendor_id_param IS NULL OR v.id = vendor_id_param;
  
  -- Log public access for monitoring
  INSERT INTO public.security_events (
    event_type,
    details,
    severity,
    category
  ) VALUES (
    'PUBLIC_VENDOR_DATA_ACCESS_SECURE',
    jsonb_build_object(
      'vendor_id', vendor_id_param,
      'access_method', 'secure_public_function',
      'data_level', 'public_only',
      'timestamp', now()
    ),
    'low',
    'data_access'
  );
END;
$$;

-- 5. Create function specifically for getting vendor contact with strict controls
CREATE OR REPLACE FUNCTION public.get_vendor_contact_secure(vendor_id_param uuid)
RETURNS TABLE(
  business_name text,
  contact_email text,
  contact_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path TO 'public'
AS $$
DECLARE
  rate_check jsonb;
BEGIN
  -- SECURITY: Only authenticated users
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to access vendor contact information';
  END IF;
  
  -- SECURITY: Strict rate limiting (5 requests per hour)
  SELECT public.enhanced_rate_limit_check(
    auth.uid()::text || '_contact_access',
    'vendor_contact',
    5,  -- max 5 attempts  
    60, -- per hour
    true -- strict mode
  ) INTO rate_check;
  
  IF NOT (rate_check->>'allowed')::boolean THEN
    RAISE EXCEPTION 'Rate limit exceeded for contact access. Please wait %.', 
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
    'VENDOR_CONTACT_ACCESS_ATTEMPT',
    auth.uid(),
    jsonb_build_object(
      'vendor_id', vendor_id_param,
      'timestamp', now(),
      'rate_limit_remaining', rate_check->>'remaining_attempts'
    ),
    'high',
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
    
  -- Log successful access
  INSERT INTO public.security_events (
    event_type,
    user_id,
    details,
    severity,
    category
  ) VALUES (
    'VENDOR_CONTACT_ACCESSED_SECURE',
    auth.uid(),
    jsonb_build_object(
      'vendor_id', vendor_id_param,
      'access_method', 'secure_contact_function',
      'timestamp', now()
    ),
    'critical',
    'sensitive_data_access'
  );
END;
$$;

-- 6. Also secure the other sensitive tables mentioned in the security scan
-- Secure bookings table - customer data protection
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;

CREATE POLICY "Users can only create bookings with their own data"
ON public.bookings
FOR INSERT
TO authenticated  
WITH CHECK (
  customer_id = auth.uid() OR 
  customer_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);

-- Secure invoices table - financial data protection  
CREATE POLICY "Invoices strict customer access only"
ON public.invoices
FOR SELECT
TO authenticated
USING (
  -- Customer can only see their own invoices
  (customer_id = auth.uid()) OR
  -- Or invoices sent to their email
  (customer_email = (SELECT email FROM public.profiles WHERE id = auth.uid())) OR
  -- Vendor can see their own invoices
  (EXISTS (SELECT 1 FROM public.vendors WHERE id = invoices.vendor_id AND user_id = auth.uid()))
);

-- Secure payments table - financial data protection
CREATE POLICY "Payments strict access control"  
ON public.payments
FOR SELECT
TO authenticated
USING (
  -- Customer can only see their own payments
  (customer_id = auth.uid()) OR
  -- Or payments from their email  
  (customer_email = (SELECT email FROM public.profiles WHERE id = auth.uid())) OR
  -- Vendor can see their own payments
  (EXISTS (SELECT 1 FROM public.vendors WHERE id = payments.vendor_id AND user_id = auth.uid()))
);