
-- Fix critical security vulnerabilities in database functions and policies

-- 1. Fix database function security by updating search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.assign_vendor_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'vendor')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Fix the critical role escalation vulnerability by removing dangerous policies
DROP POLICY IF EXISTS "Service role can insert roles" ON public.user_roles;

-- Create a secure policy that completely prevents client-side role insertion
CREATE POLICY "Prevent all client role insertion" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (false);

-- 3. Create secure role management functions with enhanced security
CREATE OR REPLACE FUNCTION public.secure_assign_role(_target_user_id uuid, _role app_role)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  _admin_user_id uuid := auth.uid();
  _result jsonb;
BEGIN
  -- Verify admin user exists and has admin role
  IF NOT public.has_role(_admin_user_id, 'admin') THEN
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
  
  -- Prevent self-privilege escalation for additional security
  IF _admin_user_id = _target_user_id AND _role = 'admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'SELF_ESCALATION_DENIED',
      'message', 'Cannot assign admin role to yourself'
    );
  END IF;
  
  -- Insert the role (will bypass RLS due to SECURITY DEFINER)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the action in audit table with enhanced details
  INSERT INTO public.role_audit (admin_user_id, target_user_id, role_assigned, action_type)
  VALUES (_admin_user_id, _target_user_id, _role, 'assign');
  
  -- Log security event
  INSERT INTO public.security_events (
    event_type,
    user_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    'ROLE_ASSIGNED',
    _admin_user_id,
    jsonb_build_object(
      'target_user_id', _target_user_id,
      'role_assigned', _role,
      'timestamp', now()
    ),
    'server-side',
    'secure_function'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Role assigned successfully',
    'role', _role,
    'target_user_id', _target_user_id
  );
END;
$$;

-- 4. Create security events table for comprehensive monitoring
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on security events table
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Admins can view security events" 
ON public.security_events 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Create function to revoke roles securely
CREATE OR REPLACE FUNCTION public.secure_revoke_role(_target_user_id uuid, _role app_role)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  _admin_user_id uuid := auth.uid();
BEGIN
  -- Verify admin permissions
  IF NOT public.has_role(_admin_user_id, 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'UNAUTHORIZED',
      'message', 'Only administrators can revoke roles'
    );
  END IF;
  
  -- Prevent revoking admin role from self (last admin protection)
  IF _admin_user_id = _target_user_id AND _role = 'admin' THEN
    -- Check if this is the last admin
    IF (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') <= 1 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'LAST_ADMIN_PROTECTION',
        'message', 'Cannot revoke admin role from the last administrator'
      );
    END IF;
  END IF;
  
  -- Remove the role
  DELETE FROM public.user_roles 
  WHERE user_id = _target_user_id AND role = _role;
  
  -- Log the action
  INSERT INTO public.role_audit (admin_user_id, target_user_id, role_assigned, action_type)
  VALUES (_admin_user_id, _target_user_id, _role, 'revoke');
  
  -- Log security event
  INSERT INTO public.security_events (
    event_type,
    user_id,
    details
  ) VALUES (
    'ROLE_REVOKED',
    _admin_user_id,
    jsonb_build_object(
      'target_user_id', _target_user_id,
      'role_revoked', _role,
      'timestamp', now()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Role revoked successfully'
  );
END;
$$;

-- 6. Create indexes for better security monitoring performance
CREATE INDEX IF NOT EXISTS idx_security_events_type_time ON public.security_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_user_time ON public.security_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_role_audit_admin_time ON public.role_audit(admin_user_id, created_at);
