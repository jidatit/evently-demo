
-- Create a secure function to handle vendor profile creation
CREATE OR REPLACE FUNCTION public.create_vendor_profile(
  p_business_name text,
  p_category text,
  p_description text DEFAULT NULL,
  p_contact_email text DEFAULT NULL,
  p_contact_phone text DEFAULT NULL,
  p_location text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_vendor vendors%ROWTYPE;
  current_user_id uuid;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;
  
  -- Check if vendor already exists for this user
  IF EXISTS (SELECT 1 FROM vendors WHERE user_id = current_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Vendor profile already exists for this user'
    );
  END IF;
  
  -- Insert the vendor record
  INSERT INTO vendors (
    user_id,
    business_name,
    category,
    description,
    contact_email,
    contact_phone,
    location
  ) VALUES (
    current_user_id,
    p_business_name,
    p_category,
    p_description,
    COALESCE(p_contact_email, (SELECT email FROM auth.users WHERE id = current_user_id)),
    p_contact_phone,
    p_location
  ) RETURNING * INTO new_vendor;
  
  -- Assign vendor role
  INSERT INTO user_roles (user_id, role)
  VALUES (current_user_id, 'vendor'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Return success with vendor data
  RETURN jsonb_build_object(
    'success', true,
    'vendor', row_to_json(new_vendor)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_vendor_profile TO authenticated;
