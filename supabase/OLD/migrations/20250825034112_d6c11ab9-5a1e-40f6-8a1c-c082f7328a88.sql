-- Fix Function Search Path Mutable warnings by setting search_path on functions
-- This prevents potential security vulnerabilities from search_path manipulation

CREATE OR REPLACE FUNCTION public.assign_vendor_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'vendor')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_admin_setup_rate_limit(ip_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  attempt_count INTEGER;
  window_start TIMESTAMPTZ := now() - INTERVAL '1 hour';
BEGIN
  -- Count attempts from this IP in the last hour
  SELECT COUNT(*)
  INTO attempt_count
  FROM public.admin_setup_log
  WHERE ip_address = check_admin_setup_rate_limit.ip_address
    AND setup_completed_at > window_start;
  
  -- Allow maximum 3 admin setup attempts per hour per IP
  RETURN attempt_count < 3;
END;
$function$;