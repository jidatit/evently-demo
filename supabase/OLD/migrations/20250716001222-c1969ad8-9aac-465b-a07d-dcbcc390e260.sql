
-- Add frozen status column to vendors table
ALTER TABLE public.vendors 
ADD COLUMN is_frozen BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for better performance when filtering active vendors
CREATE INDEX idx_vendors_is_frozen ON public.vendors(is_frozen);

-- Update the existing RLS policy to hide frozen vendors from public view
DROP POLICY IF EXISTS "Anyone can view vendors" ON public.vendors;

CREATE POLICY "Anyone can view active vendors" 
  ON public.vendors 
  FOR SELECT 
  USING (is_frozen = FALSE);

-- Allow vendors to see their own profile even when frozen
CREATE POLICY "Vendors can view their own profile" 
  ON public.vendors 
  FOR SELECT 
  USING (auth.uid() = user_id);
