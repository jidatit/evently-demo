
-- First, completely disable RLS temporarily to ensure we can work
ALTER TABLE public.vendors DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Public can view basic vendor info" ON public.vendors;
DROP POLICY IF EXISTS "Authenticated users can create vendor profiles" ON public.vendors;
DROP POLICY IF EXISTS "Vendor owners can manage their profiles" ON public.vendors;
DROP POLICY IF EXISTS "Admins can manage all vendors" ON public.vendors;

-- Create very simple, permissive policies
CREATE POLICY "Allow authenticated users to insert vendors"
  ON public.vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to view all vendors"
  ON public.vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow vendor owners to update their profiles"
  ON public.vendors
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow vendor owners to delete their profiles"
  ON public.vendors
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Also allow public read access for basic vendor info
CREATE POLICY "Allow anonymous users to view vendors"
  ON public.vendors
  FOR SELECT
  TO anon
  USING (is_frozen = false);
