-- Create email_verifications table to store verification tokens
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL DEFAULT 'email_verification',
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own verification tokens" 
ON public.email_verifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage verification tokens" 
ON public.email_verifications 
FOR ALL 
USING (current_setting('role') = 'service_role');

-- Add trigger for updated_at
CREATE TRIGGER update_email_verifications_updated_at
  BEFORE UPDATE ON public.email_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle email verification
CREATE OR REPLACE FUNCTION public.verify_email_token(token_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  verification_record public.email_verifications%ROWTYPE;
  user_record auth.users%ROWTYPE;
BEGIN
  -- Get verification record
  SELECT * INTO verification_record
  FROM public.email_verifications
  WHERE token = token_param
    AND used_at IS NULL
    AND expires_at > now();

  -- Check if token exists and is valid
  IF verification_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired verification token'
    );
  END IF;

  -- Mark token as used
  UPDATE public.email_verifications
  SET used_at = now(), updated_at = now()
  WHERE token = token_param;

  -- Update user email_confirmed_at if not already confirmed
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, now())
  WHERE id = verification_record.user_id;

  -- Log security event
  INSERT INTO public.security_events (
    event_type,
    user_id,
    details,
    severity,
    category
  ) VALUES (
    'EMAIL_VERIFIED',
    verification_record.user_id,
    jsonb_build_object(
      'email', verification_record.email,
      'verification_type', verification_record.type,
      'timestamp', now()
    ),
    'medium',
    'authentication'
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', verification_record.user_id,
    'email', verification_record.email,
    'message', 'Email verified successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;