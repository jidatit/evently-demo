-- Migration: Add public read policy to vendor_categories
-- Timestamp: 20260102_add_public_read_vendor_categories
-- Purpose: Enable anonymous read access to vendor_categories 
--          only for vendors that are approved, accepting bookings, and have is_profile_public = true

-- Drop if exists (safe re-apply)
DROP POLICY IF EXISTS "vendor_categories_public_read" ON public.vendor_categories;

-- Create the policy
CREATE POLICY "vendor_categories_public_read" ON public.vendor_categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.vendors v
      WHERE v.id = vendor_categories.vendor_id
        AND v.status = 'approved'
        AND v.accepting_bookings = true
        AND v.is_profile_public = true
    )
  );

-- Make sure RLS is enabled (usually already is, but safe to run)
ALTER TABLE public.vendor_categories ENABLE ROW LEVEL SECURITY;

-- Optional: Add a helpful comment
COMMENT ON POLICY "vendor_categories_public_read" ON public.vendor_categories IS
  'Allows anonymous/public read access to vendor-category relationships only if the vendor is approved, accepting bookings, and has a public profile enabled.';