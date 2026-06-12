
-- Phase 1: Critical Database Security Fixes

-- Fix overly permissive RLS policies for bookings
DROP POLICY IF EXISTS "Allow public booking creation" ON public.bookings;

CREATE POLICY "Authenticated users can create bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix overly permissive RLS policies for payments  
DROP POLICY IF EXISTS "Anyone can create payments" ON public.payments;

CREATE POLICY "Authenticated users can create payments"
ON public.payments
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Add protection against role self-escalation
CREATE POLICY "Users cannot update their own roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false);

-- Add stricter system access policy for commission transactions
DROP POLICY IF EXISTS "System can manage commission transactions" ON public.commission_transactions;

CREATE POLICY "Service role can manage commission transactions"
ON public.commission_transactions
FOR ALL
USING (current_setting('role') = 'service_role');

-- Add account lockout tracking table
CREATE TABLE IF NOT EXISTS public.account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  failed_attempts INTEGER DEFAULT 1,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;

-- Only system can manage lockouts
CREATE POLICY "System can manage lockouts"
ON public.account_lockouts
FOR ALL
USING (current_setting('role') = 'service_role');

-- Add password complexity validation function
CREATE OR REPLACE FUNCTION public.validate_password_complexity(password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check minimum length (8 characters)
  IF LENGTH(password) < 8 THEN
    errors := array_append(errors, 'Password must be at least 8 characters long');
  END IF;
  
  -- Check maximum length (128 characters)
  IF LENGTH(password) > 128 THEN
    errors := array_append(errors, 'Password must be no more than 128 characters long');
  END IF;
  
  -- Check for uppercase letter
  IF password !~ '[A-Z]' THEN
    errors := array_append(errors, 'Password must contain at least one uppercase letter');
  END IF;
  
  -- Check for lowercase letter
  IF password !~ '[a-z]' THEN
    errors := array_append(errors, 'Password must contain at least one lowercase letter');
  END IF;
  
  -- Check for digit
  IF password !~ '[0-9]' THEN
    errors := array_append(errors, 'Password must contain at least one number');
  END IF;
  
  -- Check for special character
  IF password !~ '[!@#$%^&*(),.?":{}|<>]' THEN
    errors := array_append(errors, 'Password must contain at least one special character');
  END IF;
  
  RETURN jsonb_build_object(
    'is_valid', array_length(errors, 1) IS NULL,
    'errors', errors
  );
END;
$$;

-- Add enhanced rate limiting for admin setup
CREATE OR REPLACE FUNCTION public.check_admin_setup_rate_limit(ip_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Add session security validation function
CREATE OR REPLACE FUNCTION public.validate_session_security_enhanced(
  session_data JSONB,
  user_agent TEXT,
  ip_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  security_score INTEGER := 0;
  warnings TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Basic session validation
  IF session_data IS NULL OR NOT (session_data ? 'access_token' AND session_data ? 'user') THEN
    RETURN jsonb_build_object(
      'is_valid', false,
      'security_score', 0,
      'warnings', ARRAY['Invalid session structure']
    );
  END IF;
  
  -- Check session age
  IF (session_data->>'expires_at')::BIGINT * 1000 < EXTRACT(EPOCH FROM now()) * 1000 THEN
    warnings := array_append(warnings, 'Session expired');
    security_score := security_score - 50;
  ELSE
    security_score := security_score + 25;
  END IF;
  
  -- Check user agent consistency
  IF user_agent IS NOT NULL AND LENGTH(user_agent) > 0 THEN
    security_score := security_score + 15;
  ELSE
    warnings := array_append(warnings, 'Missing user agent');
    security_score := security_score - 10;
  END IF;
  
  -- Check IP address presence
  IF ip_address IS NOT NULL AND LENGTH(ip_address) > 0 THEN
    security_score := security_score + 10;
  ELSE
    warnings := array_append(warnings, 'Missing IP address');
    security_score := security_score - 5;
  END IF;
  
  RETURN jsonb_build_object(
    'is_valid', security_score >= 0,
    'security_score', security_score,
    'warnings', warnings
  );
END;
$$;
