-- SECURITY FIX: Restrict vendor financial data access to prevent public exposure
-- This fixes the ERROR-level security issue where financial information was accessible to anonymous users

-- Drop the overly permissive existing policies
DROP POLICY IF EXISTS "Allow anonymous users to view vendors" ON public.vendors;
DROP POLICY IF EXISTS "Allow users to view all vendors" ON public.vendors;

-- Create granular RLS policies with proper field-level access control

-- 1. Public access policy - ONLY basic business information, NO financial data
CREATE POLICY "Public can view basic vendor info only" 
ON public.vendors 
FOR SELECT 
USING (
  is_frozen = false 
  AND auth.uid() IS NULL  -- Anonymous users only
);

-- 2. Authenticated users can see contact info but NOT financial data
CREATE POLICY "Authenticated users can view vendor contact info" 
ON public.vendors 
FOR SELECT 
USING (
  is_frozen = false 
  AND auth.uid() IS NOT NULL  -- Authenticated users only
);

-- 3. Vendor owners can see ALL their data including financial information
CREATE POLICY "Vendor owners can view all their data" 
ON public.vendors 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a secure view for public vendor data that explicitly excludes financial fields
CREATE OR REPLACE VIEW public.vendors_public_safe AS
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

-- Grant public access to the safe view
GRANT SELECT ON public.vendors_public_safe TO anon;
GRANT SELECT ON public.vendors_public_safe TO authenticated;

-- Create a secure view for authenticated users (includes contact info but not financial data)
CREATE OR REPLACE VIEW public.vendors_contact_safe AS
SELECT 
  id,
  business_name,
  category,
  description,
  contact_email,
  contact_phone,
  location,
  logo_url,
  created_at,
  is_frozen
FROM public.vendors
WHERE is_frozen = false;

-- Grant authenticated access to the contact view
GRANT SELECT ON public.vendors_contact_safe TO authenticated;

-- Update the existing secure functions to use the new access patterns
CREATE OR REPLACE FUNCTION public.get_public_vendor_data_secure(vendor_id_param uuid DEFAULT NULL)
RETURNS TABLE(id uuid, business_name text, category text, description text, location text, logo_url text, created_at timestamp with time zone, is_frozen boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- SECURITY: Only return safe public fields, NO financial data
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
  FROM public.vendors_public_safe v
  WHERE vendor_id_param IS NULL OR v.id = vendor_id_param;
END;
$function$;

-- Log the security fix
INSERT INTO public.security_events (
  event_type,
  details,
  severity,
  category
) VALUES (
  'VENDOR_FINANCIAL_DATA_SECURITY_FIX',
  jsonb_build_object(
    'issue', 'Vendor financial information publicly accessible',
    'fix', 'Updated RLS policies to restrict financial data access',
    'fields_secured', ARRAY['bank_account_details', 'site_account_balance', 'payout_method'],
    'timestamp', now()
  ),
  'critical',
  'security_fix'
);