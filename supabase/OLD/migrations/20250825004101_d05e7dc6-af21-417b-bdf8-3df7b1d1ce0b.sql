-- SECURITY FIX: Remove insecure vendors_public view that bypasses RLS
-- This view was allowing unrestricted access to vendor data, bypassing RLS policies

-- Drop the security-definer view that bypasses RLS
DROP VIEW IF EXISTS public.vendors_public;

-- The vendors table already has proper RLS policies in place:
-- - "Allow anonymous users to view vendors" policy allows public access when is_frozen = false
-- - "Allow users to view all vendors" policy allows authenticated users to view all vendors
-- 
-- These existing policies are sufficient and secure, so we don't need the bypass view.