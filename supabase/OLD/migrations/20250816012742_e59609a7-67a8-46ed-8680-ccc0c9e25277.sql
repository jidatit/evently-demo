
-- Fix RLS policies for vendors table to allow proper access

-- First, let's update the vendors table policies to be more permissive for authenticated users
-- Drop the overly restrictive policy that's blocking access
DROP POLICY IF EXISTS "Block all anonymous vendor access" ON vendors;

-- Update the policy to allow authenticated users to read vendor data they need
DROP POLICY IF EXISTS "Authenticated users basic vendor info only" ON vendors;
CREATE POLICY "Authenticated users can view basic vendor info" 
  ON vendors 
  FOR SELECT 
  TO authenticated
  USING (is_frozen = false);

-- Ensure vendors can read their own full data
DROP POLICY IF EXISTS "Vendors can view their own profile" ON vendors;
CREATE POLICY "Vendors can view their own profile" 
  ON vendors 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- Make sure vendor creation works properly
DROP POLICY IF EXISTS "Users can create their own vendor profile" ON vendors;
CREATE POLICY "Users can create their own vendor profile" 
  ON vendors 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Ensure vendors can update their own profiles  
DROP POLICY IF EXISTS "Users can update their own vendor profile" ON vendors;
CREATE POLICY "Users can update their own vendor profile" 
  ON vendors 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create a trigger to automatically assign vendor role when vendor profile is created
DROP TRIGGER IF EXISTS assign_vendor_role_trigger ON vendors;
CREATE TRIGGER assign_vendor_role_trigger
  AFTER INSERT ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION assign_vendor_role();
