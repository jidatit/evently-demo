
-- Phase 1: Critical Security Hardening - Database Functions Security
-- Fix search_path settings in database functions to prevent schema poisoning

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

-- Add enhanced input validation function with stricter security
CREATE OR REPLACE FUNCTION public.validate_and_sanitize_input_enhanced(
  input_text text, 
  max_length integer DEFAULT 1000, 
  allow_html boolean DEFAULT false,
  field_name text DEFAULT 'Input'
)
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
      'errors', ARRAY[field_name || ' cannot be empty']
    );
  END IF;
  
  sanitized_text := input_text;
  
  -- Length validation with stricter limits
  IF length(sanitized_text) > max_length THEN
    is_valid := false;
    errors := array_append(errors, field_name || ' exceeds maximum length of ' || max_length);
    sanitized_text := substring(sanitized_text, 1, max_length);
  END IF;
  
  -- Enhanced HTML sanitization
  IF NOT allow_html THEN
    -- Remove all HTML tags and entities
    sanitized_text := regexp_replace(sanitized_text, '<[^>]*>', '', 'g');
    sanitized_text := regexp_replace(sanitized_text, '&[^;]+;', '', 'g');
  END IF;
  
  -- Remove control characters and dangerous content
  sanitized_text := regexp_replace(sanitized_text, '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', 'g');
  
  -- Enhanced XSS pattern detection with more comprehensive patterns
  IF sanitized_text ~* '(javascript:|data:|vbscript:|on\w+\s*=|<script|<iframe|<object|<embed|<link|<meta|<form|eval\s*\(|expression\s*\(|\bfunction\s*\(|setTimeout|setInterval)' THEN
    is_valid := false;
    errors := array_append(errors, 'Potentially dangerous content detected in ' || field_name);
    -- More aggressive sanitization for dangerous content
    sanitized_text := regexp_replace(sanitized_text, '(javascript:|data:|vbscript:|on\w+\s*=|<[^>]*>|eval\s*\(|expression\s*\(|\bfunction\s*\(|setTimeout|setInterval)', '', 'gi');
  END IF;
  
  -- SQL injection pattern detection
  IF sanitized_text ~* '(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(from|where|into|values|table|database|schema)\b)' THEN
    is_valid := false;
    errors := array_append(errors, 'Potentially dangerous SQL patterns detected in ' || field_name);
    sanitized_text := regexp_replace(sanitized_text, '\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b', '', 'gi');
  END IF;
  
  -- Check for excessive special characters (potential encoding attacks)
  IF sanitized_text ~ '([%&+<>"\''\\]{5,})' THEN
    is_valid := false;
    errors := array_append(errors, 'Excessive special characters detected in ' || field_name);
  END IF;
  
  RETURN jsonb_build_object(
    'is_valid', is_valid,
    'sanitized', trim(sanitized_text),
    'errors', errors,
    'field_name', field_name
  );
END;
$function$;

-- Enhanced rate limiting function with better security
CREATE OR REPLACE FUNCTION public.enhanced_rate_limit_check(
  identifier_param text,
  action_type_param text,
  max_attempts integer DEFAULT 5,
  window_minutes integer DEFAULT 15,
  strict_mode boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_record public.rate_limits%ROWTYPE;
  window_start timestamptz := now() - (window_minutes || ' minutes')::interval;
  is_blocked boolean := false;
  remaining_attempts integer;
BEGIN
  -- Get existing rate limit record
  SELECT * INTO current_record
  FROM public.rate_limits
  WHERE identifier = identifier_param 
    AND action_type = action_type_param;
  
  -- If no record exists, create one
  IF current_record IS NULL THEN
    INSERT INTO public.rate_limits (identifier, action_type, attempt_count, first_attempt, last_attempt)
    VALUES (identifier_param, action_type_param, 1, now(), now());
    
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining_attempts', max_attempts - 1,
      'reset_time', now() + (window_minutes || ' minutes')::interval,
      'strict_mode', strict_mode
    );
  END IF;
  
  -- Check if currently blocked
  IF current_record.blocked_until IS NOT NULL AND current_record.blocked_until > now() THEN
    -- Log security event for blocked attempt
    INSERT INTO public.security_events (event_type, details, severity, category)
    VALUES (
      'RATE_LIMIT_BLOCKED',
      jsonb_build_object(
        'identifier_hash', substr(md5(identifier_param), 1, 8),
        'action_type', action_type_param,
        'blocked_until', current_record.blocked_until,
        'strict_mode', strict_mode
      ),
      'high',
      'rate_limiting'
    );
    
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining_attempts', 0,
      'reset_time', current_record.blocked_until,
      'blocked', true,
      'strict_mode', strict_mode
    );
  END IF;
  
  -- Reset if outside window
  IF current_record.first_attempt < window_start THEN
    UPDATE public.rate_limits
    SET attempt_count = 1,
        first_attempt = now(),
        last_attempt = now(),
        blocked_until = NULL
    WHERE id = current_record.id;
    
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining_attempts', max_attempts - 1,
      'reset_time', now() + (window_minutes || ' minutes')::interval,
      'strict_mode', strict_mode
    );
  END IF;
  
  -- Calculate remaining attempts
  remaining_attempts := max_attempts - (current_record.attempt_count + 1);
  
  -- Check if this attempt would exceed the limit
  IF current_record.attempt_count >= max_attempts THEN
    -- Block the user
    UPDATE public.rate_limits
    SET blocked_until = CASE 
      WHEN strict_mode THEN now() + (window_minutes * 2 || ' minutes')::interval
      ELSE now() + (window_minutes || ' minutes')::interval
    END,
    last_attempt = now()
    WHERE id = current_record.id;
    
    is_blocked := true;
  ELSE
    -- Increment attempt count
    UPDATE public.rate_limits
    SET attempt_count = attempt_count + 1,
        last_attempt = now()
    WHERE id = current_record.id;
  END IF;
  
  -- Log the rate limit attempt
  INSERT INTO public.security_events (event_type, details, severity, category)
  VALUES (
    CASE WHEN is_blocked THEN 'RATE_LIMIT_EXCEEDED' ELSE 'RATE_LIMIT_CHECK' END,
    jsonb_build_object(
      'identifier_hash', substr(md5(identifier_param), 1, 8),
      'action_type', action_type_param,
      'attempt_count', current_record.attempt_count + 1,
      'max_attempts', max_attempts,
      'blocked', is_blocked,
      'strict_mode', strict_mode
    ),
    CASE WHEN is_blocked THEN 'high' ELSE 'medium' END,
    'rate_limiting'
  );
  
  RETURN jsonb_build_object(
    'allowed', NOT is_blocked,
    'remaining_attempts', GREATEST(0, remaining_attempts),
    'reset_time', CASE 
      WHEN is_blocked THEN current_record.blocked_until
      ELSE current_record.first_attempt + (window_minutes || ' minutes')::interval
    END,
    'blocked', is_blocked,
    'strict_mode', strict_mode
  );
END;
$function$;

-- Add function to check admin setup security
CREATE OR REPLACE FUNCTION public.secure_admin_setup_check(
  ip_address_param text,
  user_agent_param text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  setup_allowed boolean;
  attempt_count integer;
  rate_limit_result jsonb;
BEGIN
  -- First check if admin setup is allowed at all
  SELECT public.is_admin_setup_allowed() INTO setup_allowed;
  
  IF NOT setup_allowed THEN
    -- Log unauthorized admin setup attempt
    INSERT INTO public.security_events (event_type, details, ip_address, user_agent, severity, category)
    VALUES (
      'UNAUTHORIZED_ADMIN_SETUP_ATTEMPT',
      jsonb_build_object(
        'reason', 'Admin setup not allowed or expired',
        'timestamp', now()
      ),
      ip_address_param,
      user_agent_param,
      'critical',
      'admin_security'
    );
    
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Admin setup is not currently allowed or has expired'
    );
  END IF;
  
  -- Check rate limits for admin setup (stricter limits)
  SELECT public.enhanced_rate_limit_check(
    'admin_setup_' || COALESCE(ip_address_param, 'unknown'),
    'admin_setup',
    3, -- max 3 attempts
    60, -- per hour
    true -- strict mode
  ) INTO rate_limit_result;
  
  IF NOT (rate_limit_result->>'allowed')::boolean THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Rate limit exceeded for admin setup attempts',
      'reset_time', rate_limit_result->>'reset_time'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'remaining_attempts', rate_limit_result->>'remaining_attempts'
  );
END;
$function$;
