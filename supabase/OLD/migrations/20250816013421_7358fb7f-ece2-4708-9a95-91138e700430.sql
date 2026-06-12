
-- Drop existing restrictive policies that are preventing vendor profile creation
DROP POLICY IF EXISTS "Authenticated users can view basic vendor info" ON public.vendors;
DROP POLICY IF EXISTS "Users can create their own vendor profile" ON public.vendors;
DROP POLICY IF EXISTS "Users can update their own vendor profile" ON public.vendors;
DROP POLICY IF EXISTS "Users can delete their own vendor profile" ON public.vendors;
DROP POLICY IF EXISTS "Vendors can view their own profile" ON public.vendors;
DROP POLICY IF EXISTS "Vendor owners full access to own data" ON public.vendors;
DROP POLICY IF EXISTS "Vendor owners sensitive data access" ON public.vendors;
DROP POLICY IF EXISTS "Admin read access to all vendors" ON public.vendors;

-- Create new policies that allow proper vendor profile creation
CREATE POLICY "Public can view basic vendor info" 
  ON public.vendors 
  FOR SELECT 
  USING (is_frozen = false);

CREATE POLICY "Authenticated users can create vendor profiles" 
  ON public.vendors 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vendor owners can manage their profiles" 
  ON public.vendors 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all vendors" 
  ON public.vendors 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ensure the trigger exists to assign vendor role automatically
CREATE OR REPLACE FUNCTION assign_vendor_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'vendor')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS assign_vendor_role_trigger ON public.vendors;
CREATE TRIGGER assign_vendor_role_trigger
  AFTER INSERT ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION assign_vendor_role();
