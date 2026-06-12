-- Fix critical RLS vulnerabilities in user_roles table

-- Drop existing policies that may be too permissive
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create strict RLS policies for user_roles table
-- Only allow users to view their own roles
CREATE POLICY "Users can view own roles only" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Only allow system/service role to insert roles (no direct user inserts)
CREATE POLICY "Service role can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (false); -- This prevents all direct inserts from the client

-- Only admins can update roles, and only through secure functions
CREATE POLICY "Admins can update roles via functions" 
ON public.user_roles 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete roles
CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Create a secure function for role assignment that bypasses RLS
CREATE OR REPLACE FUNCTION public.assign_user_role(_user_id uuid, _role app_role, _admin_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the requesting user is an admin
  IF NOT public.has_role(_admin_user_id, 'admin') THEN
    RAISE EXCEPTION 'Only administrators can assign roles';
  END IF;
  
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RAISE EXCEPTION 'User does not exist';
  END IF;
  
  -- Insert the role (will bypass RLS due to SECURITY DEFINER)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN true;
END;
$$;

-- Create audit table for tracking role changes
CREATE TABLE IF NOT EXISTS public.role_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  role_assigned app_role NOT NULL,
  action_type text NOT NULL DEFAULT 'assign',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.role_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.role_audit 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Create enhanced role assignment function with audit logging
CREATE OR REPLACE FUNCTION public.assign_user_role_with_audit(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _admin_user_id uuid := auth.uid();
BEGIN
  -- Check if the requesting user is an admin
  IF NOT public.has_role(_admin_user_id, 'admin') THEN
    RAISE EXCEPTION 'Only administrators can assign roles';
  END IF;
  
  -- Check if user exists in profiles table
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id) THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Insert the role (will bypass RLS due to SECURITY DEFINER)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the action
  INSERT INTO public.role_audit (admin_user_id, target_user_id, role_assigned, action_type)
  VALUES (_admin_user_id, _user_id, _role, 'assign');
  
  RETURN true;
END;
$$;