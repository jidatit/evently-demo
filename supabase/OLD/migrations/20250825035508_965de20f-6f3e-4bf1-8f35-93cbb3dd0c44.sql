
-- Add booking availability fields to vendors table
ALTER TABLE public.vendors 
ADD COLUMN accepting_bookings boolean NOT NULL DEFAULT true,
ADD COLUMN unavailable_until date DEFAULT NULL,
ADD COLUMN unavailable_message text DEFAULT NULL;

-- Update the existing RLS policies to consider booking availability for public access
DROP POLICY IF EXISTS "Public can view basic vendor info only" ON public.vendors;

CREATE POLICY "Public can view basic vendor info only" 
ON public.vendors 
FOR SELECT 
USING (
  (is_frozen = false) AND 
  (auth.uid() IS NULL)
);

-- Create a new policy for authenticated users that shows availability status
DROP POLICY IF EXISTS "Authenticated users can view vendor contact info" ON public.vendors;

CREATE POLICY "Authenticated users can view vendor contact info" 
ON public.vendors 
FOR SELECT 
USING (
  (is_frozen = false) AND 
  (auth.uid() IS NOT NULL)
);
