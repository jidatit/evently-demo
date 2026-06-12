
-- This file contains the SQL for missing database functions
-- These would need to be added via a database migration

-- Function to check rate limits with database persistence
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _identifier text,
  _action_type text,
  _max_requests integer,
  _window_minutes integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_count integer;
  window_start timestamptz;
  reset_time timestamptz;
  existing_record record;
BEGIN
  window_start := now() - (_window_minutes || ' minutes')::interval;
  reset_time := now() + (_window_minutes || ' minutes')::interval;
  
  -- Get or create rate limit record
  SELECT * INTO existing_record
  FROM public.rate_limits
  WHERE identifier = _identifier 
    AND action_type = _action_type
    AND created_at > window_start;
  
  IF existing_record IS NULL THEN
    -- Create new record
    INSERT INTO public.rate_limits (identifier, action_type, attempt_count, first_attempt, last_attempt)
    VALUES (_identifier, _action_type, 1, now(), now());
    
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', _max_requests - 1,
      'reset_time', reset_time
    );
  ELSE
    -- Update existing record
    IF existing_record.attempt_count >= _max_requests THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'remaining', 0,
        'reset_time', existing_record.first_attempt + (_window_minutes || ' minutes')::interval
      );
    ELSE
      UPDATE public.rate_limits
      SET attempt_count = attempt_count + 1,
          last_attempt = now()
      WHERE id = existing_record.id;
      
      RETURN jsonb_build_object(
        'allowed', true,
        'remaining', _max_requests - (existing_record.attempt_count + 1),
        'reset_time', reset_time
      );
    END IF;
  END IF;
END;
$function$;

-- Function to record rate limit attempts
CREATE OR REPLACE FUNCTION public.record_rate_limit_attempt(
  _identifier text,
  _action_type text,
  _success boolean,
  _ip_address text DEFAULT NULL,
  _user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log the attempt in security events
  INSERT INTO public.security_events (
    event_type,
    details,
    ip_address,
    user_agent,
    severity,
    category
  ) VALUES (
    'RATE_LIMIT_ATTEMPT',
    jsonb_build_object(
      'identifier', _identifier,
      'action_type', _action_type,
      'success', _success,
      'timestamp', now()
    ),
    _ip_address,
    _user_agent,
    CASE WHEN _success THEN 'low' ELSE 'medium' END,
    'rate_limiting'
  );
END;
$function$;

-- Function to log security events (if not exists)
CREATE OR REPLACE FUNCTION public.log_security_event(
  _event_type text,
  _user_id uuid DEFAULT NULL,
  _details jsonb DEFAULT NULL,
  _ip_address text DEFAULT NULL,
  _user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.security_events (
    event_type,
    user_id,
    details,
    ip_address,
    user_agent,
    severity,
    category
  ) VALUES (
    _event_type,
    COALESCE(_user_id, auth.uid()),
    _details,
    _ip_address,
    _user_agent,
    'medium',
    'general'
  );
END;
$function$;

-- Updated function to handle contract completion and send copies
CREATE OR REPLACE FUNCTION public.update_contract_status()
RETURNS TRIGGER AS $$
DECLARE
  signature_count integer;
BEGIN
  -- Count signatures for this contract
  SELECT COUNT(DISTINCT signer_type) INTO signature_count
  FROM public.contract_signatures 
  WHERE contract_id = NEW.contract_id;
  
  -- If both vendor and customer have signed
  IF signature_count = 2 THEN
    UPDATE public.contracts 
    SET status = 'signed', updated_at = now() 
    WHERE id = NEW.contract_id;
    
    -- Trigger edge function to send contract copies
    -- This would normally be done via a webhook or queue
    -- For now, we'll log it as a security event for tracking
    INSERT INTO public.security_events (
      event_type,
      details,
      severity,
      category
    ) VALUES (
      'CONTRACT_FULLY_SIGNED',
      jsonb_build_object(
        'contract_id', NEW.contract_id,
        'timestamp', now(),
        'requires_email_notification', true
      ),
      'low',
      'contract_management'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
