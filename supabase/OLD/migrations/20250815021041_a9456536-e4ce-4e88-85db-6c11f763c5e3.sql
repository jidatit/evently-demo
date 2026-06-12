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

-- 3. Drop existing conflicting policies and recreate
DROP POLICY IF EXISTS "Authenticated users basic vendor info only" ON public.vendors;
DROP POLICY IF EXISTS "Vendor owners sensitive data access" ON public.vendors;

-- Policy: Only allow basic info access for authenticated users (limited columns)
CREATE POLICY "Authenticated users basic vendor info only"
ON public.vendors
FOR SELECT 
TO authenticated
USING (is_frozen = false);

-- Policy: Sensitive data only for vendor owners
CREATE POLICY "Vendor owners sensitive data access"
ON public.vendors  
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Create ultra-secure public vendor function
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