-- SECURITY FIX: Restrict environment_config table access to admins only
-- This fixes a critical vulnerability where system configuration was publicly readable

-- Drop the dangerous public read policy
DROP POLICY IF EXISTS "Anyone can read environment config" ON public.environment_config;

-- Create secure admin-only read policy
CREATE POLICY "Admins only can read environment config" 
ON public.environment_config 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin-only policies for other operations (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage environment config" 
ON public.environment_config 
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
    'table', 'environment_config',
    'action', 'restricted_public_access',
    'reason', 'Critical security fix - system configuration no longer publicly readable',
    'timestamp', now()
  ),
  'critical',
  'security_fix'
);