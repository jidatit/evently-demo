-- Fix the security definer view issue by recreating without SECURITY DEFINER
DROP VIEW IF EXISTS public.vendors_public;

-- Create a regular view (not security definer) for public vendor data
CREATE VIEW public.vendors_public AS
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

-- Grant appropriate access
GRANT SELECT ON public.vendors_public TO anon, authenticated;