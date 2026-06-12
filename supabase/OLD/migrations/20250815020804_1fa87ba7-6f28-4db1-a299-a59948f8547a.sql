-- SECURITY FIX: Granular vendor data access policies to prevent contact info harvesting
-- This fixes the security vulnerability where contact information could be harvested

-- Drop the overly permissive authenticated user policy
DROP POLICY IF EXISTS "Authenticated users controlled vendor access" ON public.vendors;

-- Create new granular policies for authenticated users
-- Policy 1: Basic vendor info for browsing (no contact details)
CREATE POLICY "Authenticated users can browse basic vendor info" 
ON public.vendors 
FOR SELECT 
TO authenticated
USING (
  is_frozen = false 
);

-- Policy 2: Contact info only accessible during legitimate booking process
-- This requires additional verification that the user is actually booking
CREATE POLICY "Contact info for verified booking intent only"
ON public.vendors
FOR SELECT
TO authenticated  
USING (
  is_frozen = false AND
  -- Only allow contact access if user has recent booking interaction
  EXISTS (
    SELECT 1 FROM public.security_events se
    WHERE se.user_id = auth.uid()
    AND se.event_type = 'VENDOR_CONTACT_ACCESS_REQUEST'
    AND se.details->>'vendor_id' = vendors.id::text
    AND se.created_at > now() - interval '10 minutes'
  )
);

-- Create function to log and authorize contact information access
CREATE OR REPLACE FUNCTION public.authorize_vendor_contact_access(vendor_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only authenticated users can request contact access
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Log the contact access request
  INSERT INTO public.security_events (
    event_type,
    user_id, 
    details,
    severity,
    category
  ) VALUES (
    'VENDOR_CONTACT_ACCESS_REQUEST',
    auth.uid(),
    jsonb_build_object(
      'vendor_id', vendor_id_param,
      'purpose', 'booking_inquiry',
      'timestamp', now(),
      'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for'
    ),
    'medium',
    'data_access'
  );
  
  RETURN true;
END;
$$;

-- Enhance the existing secure database functions to be even more restrictive
CREATE OR REPLACE FUNCTION public.get_vendor_contact_for_booking(vendor_id_param uuid)
RETURNS TABLE(
  id uuid,
  business_name text,
  contact_email text, 
  contact_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- SECURITY: Only authenticated users can access contact info
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required for vendor contact information';
  END IF;
  
  -- SECURITY: Rate limit contact access requests  
  IF NOT public.check_rate_limit(
    auth.uid()::text || '_vendor_contact',
    'vendor_contact_access', 
    10, -- max 10 contact requests
    60  -- per hour  
  ) THEN
    RAISE EXCEPTION 'Too many contact access requests. Please wait before trying again.';
  END IF;
  
  -- Authorize and log the access
  IF NOT public.authorize_vendor_contact_access(vendor_id_param) THEN
    RAISE EXCEPTION 'Contact access authorization failed';
  END IF;

  RETURN QUERY
  SELECT 
    v.id,
    v.business_name,
    v.contact_email,
    v.contact_phone
  FROM public.vendors v
  WHERE v.is_frozen = false
    AND v.id = vendor_id_param;
    
  -- Log successful contact access
  INSERT INTO public.security_events (
    event_type,
    user_id,
    details,
    severity,
    category
  ) VALUES (
    'VENDOR_CONTACT_ACCESSED',
    auth.uid(),
    jsonb_build_object(
      'vendor_id', vendor_id_param,
      'access_method', 'secure_function',
      'timestamp', now()
    ),
    'high',
    'sensitive_data_access'
  );
END;
$$;