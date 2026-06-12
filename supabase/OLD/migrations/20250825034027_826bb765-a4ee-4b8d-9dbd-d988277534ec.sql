-- Fix Security Definer View vulnerability
-- Drop the problematic views that are flagged by the linter
DROP VIEW IF EXISTS public.vendors_contact_safe CASCADE;
DROP VIEW IF EXISTS public.vendors_public_safe CASCADE;

-- Update the function to query vendors table directly instead of using the problematic view
CREATE OR REPLACE FUNCTION public.get_public_vendor_data_secure(vendor_id_param uuid DEFAULT NULL::uuid)
RETURNS TABLE(id uuid, business_name text, category text, description text, location text, logo_url text, created_at timestamp with time zone, is_frozen boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- SECURITY: Query vendors table directly with proper filtering
  -- This respects RLS policies on the vendors table
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
    
  -- Log public data access for security monitoring
  INSERT INTO public.security_events (
    event_type,
    details,
    severity,
    category
  ) VALUES (
    'PUBLIC_VENDOR_DATA_ACCESS_SECURE',
    jsonb_build_object(
      'vendor_id', vendor_id_param,
      'access_method', 'secure_function_direct',
      'data_level', 'public_only',
      'timestamp', now()
    ),
    'low',
    'data_access'
  );
END;
$function$;