
-- Fix critical database function security vulnerability by adding SECURITY DEFINER SET search_path = ''
-- This prevents potential privilege escalation attacks

-- Update handle_new_user function
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

-- Update generate_invoice_number function
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
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || current_year || '-%';
  
  invoice_num := 'INV-' || current_year || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN invoice_num;
END;
$$;

-- Update has_role function
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

-- Update assign_vendor_role function
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

-- Update assign_user_role function
CREATE OR REPLACE FUNCTION public.assign_user_role(_user_id uuid, _role app_role, _admin_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
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
$$;

-- Update assign_user_role_with_audit function
CREATE OR REPLACE FUNCTION public.assign_user_role_with_audit(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
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
$$;

-- Add customer access policies for bookings (allow customers to view their own bookings by email)
CREATE POLICY "Customers can view their own bookings by email" 
ON public.bookings 
FOR SELECT 
USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Add customer access policies for invoices (allow customers to view their own invoices by email)
CREATE POLICY "Customers can view their own invoices by email" 
ON public.invoices 
FOR SELECT 
USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Create indexes for better performance on email lookups
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON public.bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_email ON public.invoices(customer_email);

-- Create admin setup tracking table to prevent multiple admin setups
CREATE TABLE IF NOT EXISTS public.admin_setup_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setup_completed_at timestamp with time zone NOT NULL DEFAULT now(),
  admin_email text NOT NULL,
  ip_address text,
  user_agent text
);

-- Enable RLS on admin setup log
ALTER TABLE public.admin_setup_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view setup logs
CREATE POLICY "Admins can view setup logs" 
ON public.admin_setup_log 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));
