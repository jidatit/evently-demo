-- SECURITY FIX: Restrict staging_bugs table access to admins only
-- This fixes a critical vulnerability where internal bug reports were publicly readable

-- Drop the dangerous public read policy
DROP POLICY IF EXISTS "Anyone can view staging bugs" ON public.staging_bugs;

-- Create secure admin-only read policy
CREATE POLICY "Admins only can view staging bugs" 
ON public.staging_bugs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update the management policy to be more specific (admins only for all operations)
DROP POLICY IF EXISTS "Authenticated users can manage bugs" ON public.staging_bugs;

CREATE POLICY "Admins can manage staging bugs" 
ON public.staging_bugs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Log this critical security fix
INSERT INTO public.security_events (
  event_type,
  details,
  severity,
  category
) VALUES (
  'SECURITY_POLICY_UPDATED',
  jsonb_build_object(
    'table', 'staging_bugs',
    'action', 'restricted_public_access',
    'reason', 'Critical security fix - bug reports no longer publicly readable',
    'timestamp', now()
  ),
  'critical',
  'security_fix'
);