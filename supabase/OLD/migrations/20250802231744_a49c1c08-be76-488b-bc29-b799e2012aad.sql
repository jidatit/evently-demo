
-- PHASE 1: CRITICAL DATABASE SECURITY FIXES

-- 1. Fix search_path security issue in all database functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_customer_id_from_email(email_param text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  customer_id uuid;
BEGIN
  SELECT id INTO customer_id
  FROM public.profiles
  WHERE email = email_param;
  
  RETURN customer_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_setup_allowed()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  setup_record public.admin_setup_status%ROWTYPE;
BEGIN
  SELECT * INTO setup_record 
  FROM public.admin_setup_status 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- If no record exists or setup already completed, deny
  IF setup_record IS NULL OR setup_record.is_setup_completed THEN
    RETURN false;
  END IF;
  
  -- Check if setup period has expired
  IF setup_record.setup_expires_at < now() THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_admin_setup()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.admin_setup_status 
  SET is_setup_completed = true, 
      setup_completed_at = now()
  WHERE is_setup_completed = false;
  
  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_customer_id_on_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If customer_id is not set but we have an email, try to find the profile
  IF NEW.customer_id IS NULL AND NEW.customer_email IS NOT NULL THEN
    NEW.customer_id := public.get_customer_id_from_email(NEW.customer_email);
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.assign_user_role(_user_id uuid, _role app_role, _admin_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(_admin_user_id, 'admin') THEN
    RAISE EXCEPTION 'Only administrators can assign roles';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RAISE EXCEPTION 'User does not exist';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.assign_user_role_with_audit(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _admin_user_id uuid := auth.uid();
BEGIN
  IF NOT public.has_role(_admin_user_id, 'admin') THEN
    RAISE EXCEPTION 'Only administrators can assign roles';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id) THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  INSERT INTO public.role_audit (admin_user_id, target_user_id, role_assigned, action_type)
  VALUES (_admin_user_id, _user_id, _role, 'assign');
  
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_and_sanitize_input(input_text text, max_length integer DEFAULT 1000, allow_html boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  sanitized_text text;
  is_valid boolean := true;
  errors text[] := ARRAY[]::text[];
BEGIN
  -- Check for null or empty input
  IF input_text IS NULL OR trim(input_text) = '' THEN
    RETURN jsonb_build_object(
      'is_valid', false,
      'sanitized', '',
      'errors', ARRAY['Input cannot be empty']
    );
  END IF;
  
  sanitized_text := input_text;
  
  -- Length validation
  IF length(sanitized_text) > max_length THEN
    is_valid := false;
    errors := array_append(errors, 'Input exceeds maximum length of ' || max_length);
    sanitized_text := substring(sanitized_text, 1, max_length);
  END IF;
  
  -- HTML sanitization if not allowed
  IF NOT allow_html THEN
    sanitized_text := regexp_replace(sanitized_text, '<[^>]*>', '', 'g');
  END IF;
  
  -- Remove potentially dangerous characters
  sanitized_text := regexp_replace(sanitized_text, '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', 'g');
  
  -- XSS pattern detection
  IF sanitized_text ~* '(javascript:|on\w+\s*=|<script|<iframe|<object|<embed)' THEN
    is_valid := false;
    errors := array_append(errors, 'Potentially dangerous content detected');
    sanitized_text := regexp_replace(sanitized_text, '(javascript:|on\w+\s*=|<script[^>]*>.*?</script>|<iframe|<object|<embed)', '', 'gi');
  END IF;
  
  RETURN jsonb_build_object(
    'is_valid', is_valid,
    'sanitized', trim(sanitized_text),
    'errors', errors
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_booking_data(booking_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  validation_errors text[] := ARRAY[]::text[];
BEGIN
  -- Validate required fields
  IF NOT (booking_data ? 'customer_name') OR trim(booking_data->>'customer_name') = '' THEN
    validation_errors := array_append(validation_errors, 'Customer name is required');
  END IF;
  
  IF NOT (booking_data ? 'customer_email') OR trim(booking_data->>'customer_email') = '' THEN
    validation_errors := array_append(validation_errors, 'Customer email is required');
  END IF;
  
  -- Validate email format
  IF booking_data ? 'customer_email' AND NOT (booking_data->>'customer_email' ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$') THEN
    validation_errors := array_append(validation_errors, 'Invalid email format');
  END IF;
  
  -- Validate booking date
  IF NOT (booking_data ? 'booking_date') THEN
    validation_errors := array_append(validation_errors, 'Booking date is required');
  END IF;
  
  RETURN jsonb_build_object(
    'is_valid', array_length(validation_errors, 1) IS NULL,
    'errors', validation_errors,
    'sanitized_data', booking_data
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_password_complexity(password text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_year TEXT;
  sequence_num INTEGER;
  invoice_num TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-' || current_year || '-(\d+)') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.invoices
  WHERE invoice_number LIKE 'INV-' || current_year || '-%';
  
  invoice_num := 'INV-' || current_year || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN invoice_num;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

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

-- 2. Add comprehensive audit logging for role escalation attempts
CREATE TABLE IF NOT EXISTS public.role_escalation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  attempted_role app_role NOT NULL,
  attempt_method TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on role escalation attempts
ALTER TABLE public.role_escalation_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view escalation attempts
CREATE POLICY "Admins can view escalation attempts" ON public.role_escalation_attempts
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- System can log escalation attempts
CREATE POLICY "System can log escalation attempts" ON public.role_escalation_attempts
FOR INSERT WITH CHECK (true);

-- 3. Add function to log and block role escalation attempts
CREATE OR REPLACE FUNCTION public.log_role_escalation_attempt(
  _attempted_role app_role,
  _attempt_method TEXT,
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _blocked_reason TEXT DEFAULT 'Unauthorized role escalation attempt'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.role_escalation_attempts (
    user_id,
    attempted_role,
    attempt_method,
    ip_address,
    user_agent,
    blocked_reason
  ) VALUES (
    auth.uid(),
    _attempted_role,
    _attempt_method,
    _ip_address,
    _user_agent,
    _blocked_reason
  );
  
  -- Also log to security events
  PERFORM public.log_security_event(
    'ROLE_ESCALATION_ATTEMPT',
    auth.uid(),
    jsonb_build_object(
      'attempted_role', _attempted_role,
      'attempt_method', _attempt_method,
      'blocked_reason', _blocked_reason
    ),
    _ip_address,
    _user_agent
  );
END;
$function$;

-- 4. Strengthen role assignment with additional checks
CREATE OR REPLACE FUNCTION public.secure_assign_role(_target_user_id uuid, _role app_role)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _admin_user_id uuid := auth.uid();
  _result jsonb;
BEGIN
  -- Enhanced admin verification
  IF NOT public.has_role(_admin_user_id, 'admin') THEN
    PERFORM public.log_role_escalation_attempt(_role, 'secure_assign_role', NULL, NULL, 'Non-admin attempting role assignment');
    RETURN jsonb_build_object(
      'success', false,
      'error', 'UNAUTHORIZED',
      'message', 'Only administrators can assign roles'
    );
  END IF;
  
  -- Verify target user exists in profiles
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _target_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'USER_NOT_FOUND',
      'message', 'Target user profile not found'
    );
  END IF;
  
  -- Enhanced self-privilege escalation prevention
  IF _admin_user_id = _target_user_id AND _role = 'admin' THEN
    PERFORM public.log_role_escalation_attempt(_role, 'self_escalation', NULL, NULL, 'Admin attempting self-escalation');
    RETURN jsonb_build_object(
      'success', false,
      'error', 'SELF_ESCALATION_DENIED',
      'message', 'Cannot assign admin role to yourself'
    );
  END IF;
  
  -- Rate limiting check for role assignments
  IF NOT public.check_rate_limit(
    _admin_user_id::text || '_role_assign',
    'role_assignment',
    5, -- max 5 role assignments
    60 -- per hour
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'RATE_LIMITED',
      'message', 'Too many role assignment attempts. Please wait before trying again.'
    );
  END IF;
  
  -- Insert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Enhanced audit logging
  INSERT INTO public.role_audit (admin_user_id, target_user_id, role_assigned, action_type)
  VALUES (_admin_user_id, _target_user_id, _role, 'assign');
  
  -- Enhanced security event logging
  PERFORM public.log_security_event(
    'ROLE_ASSIGNED_SECURE',
    _admin_user_id,
    jsonb_build_object(
      'target_user_id', _target_user_id,
      'role_assigned', _role,
      'timestamp', now(),
      'security_level', 'high'
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Role assigned successfully with enhanced security',
    'role', _role,
    'target_user_id', _target_user_id
  );
END;
$function$;

-- 5. Add enhanced session validation with security scoring
CREATE OR REPLACE FUNCTION public.validate_session_security_enhanced(
  session_data jsonb, 
  user_agent text, 
  ip_address text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
  security_score INTEGER := 0;
  warnings TEXT[] := ARRAY[]::TEXT[];
  risk_factors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Basic session validation
  IF session_data IS NULL OR NOT (session_data ? 'access_token' AND session_data ? 'user') THEN
    RETURN jsonb_build_object(
      'is_valid', false,
      'security_score', 0,
      'warnings', ARRAY['Invalid session structure'],
      'risk_level', 'critical'
    );
  END IF;
  
  -- Check session age and expiry
  IF (session_data->>'expires_at')::BIGINT * 1000 < EXTRACT(EPOCH FROM now()) * 1000 THEN
    warnings := array_append(warnings, 'Session expired');
    risk_factors := array_append(risk_factors, 'expired_session');
    security_score := security_score - 100; -- Critical
  ELSE
    security_score := security_score + 25;
  END IF;
  
  -- Enhanced user agent validation
  IF user_agent IS NOT NULL AND LENGTH(user_agent) > 0 THEN
    security_score := security_score + 15;
    -- Check for suspicious user agents
    IF user_agent ~* '(bot|crawler|spider|scraper)' THEN
      warnings := array_append(warnings, 'Suspicious user agent detected');
      risk_factors := array_append(risk_factors, 'bot_user_agent');
      security_score := security_score - 25;
    END IF;
  ELSE
    warnings := array_append(warnings, 'Missing user agent');
    risk_factors := array_append(risk_factors, 'missing_user_agent');
    security_score := security_score - 10;
  END IF;
  
  -- Enhanced IP address validation
  IF ip_address IS NOT NULL AND LENGTH(ip_address) > 0 THEN
    security_score := security_score + 10;
    -- Check for localhost/development IPs
    IF ip_address IN ('127.0.0.1', '::1', 'localhost') THEN
      warnings := array_append(warnings, 'Development environment detected');
      security_score := security_score + 5; -- Actually good in dev
    END IF;
  ELSE
    warnings := array_append(warnings, 'Missing IP address');
    risk_factors := array_append(risk_factors, 'missing_ip');
    security_score := security_score - 5;
  END IF;
  
  -- Token structure validation
  IF session_data ? 'access_token' THEN
    DECLARE
      token_parts TEXT[];
    BEGIN
      token_parts := string_to_array(session_data->>'access_token', '.');
      IF array_length(token_parts, 1) != 3 THEN
        warnings := array_append(warnings, 'Invalid JWT structure');
        risk_factors := array_append(risk_factors, 'malformed_jwt');
        security_score := security_score - 50;
      ELSE
        security_score := security_score + 10;
      END IF;
    END;
  END IF;
  
  -- Log security validation event
  PERFORM public.log_security_event(
    'SESSION_VALIDATION_ENHANCED',
    (session_data->'user'->>'id')::UUID,
    jsonb_build_object(
      'security_score', security_score,
      'warnings_count', array_length(warnings, 1),
      'risk_factors', risk_factors,
      'validation_timestamp', now()
    ),
    ip_address,
    user_agent
  );
  
  RETURN jsonb_build_object(
    'is_valid', security_score >= 0,
    'security_score', security_score,
    'warnings', warnings,
    'risk_factors', risk_factors,
    'risk_level', CASE 
      WHEN security_score >= 40 THEN 'low'
      WHEN security_score >= 0 THEN 'medium'
      WHEN security_score >= -50 THEN 'high'
      ELSE 'critical'
    END
  );
END;
$function$;
