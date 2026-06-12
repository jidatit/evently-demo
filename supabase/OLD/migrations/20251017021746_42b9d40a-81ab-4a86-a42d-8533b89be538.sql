-- Fix profiles table RLS to explicitly prevent unauthenticated access
-- Drop existing SELECT policy and create a more explicit one

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create explicit policy that only allows authenticated users to view their own profile
CREATE POLICY "Authenticated users can view only their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Add explicit policy to block all anonymous access
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Add comment documenting the security intent
COMMENT ON TABLE public.profiles IS 'User profiles containing PII (email, name). RLS policies ensure only authenticated users can view their own data. Anonymous access is explicitly blocked.';
