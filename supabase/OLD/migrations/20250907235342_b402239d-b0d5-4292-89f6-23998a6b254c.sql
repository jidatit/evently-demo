-- Create staging bugs table and environment config only
-- Skip fake user profiles since they require auth.users entries

DROP TABLE IF EXISTS public.staging_bugs CASCADE;

CREATE TABLE public.staging_bugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id TEXT NOT NULL UNIQUE,
  area TEXT NOT NULL CHECK (area IN ('Customer Flow', 'Vendor Flow', 'Admin', 'Payment', 'UI/UX')),
  title TEXT NOT NULL,
  steps_to_reproduce TEXT,
  error_message TEXT,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Fixed', 'Retest', 'Closed')),
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  assigned_to UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on bug tracking
ALTER TABLE public.staging_bugs ENABLE ROW LEVEL SECURITY;

-- Policies for bug tracking
CREATE POLICY "Anyone can view staging bugs" ON public.staging_bugs
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage bugs" ON public.staging_bugs
FOR ALL USING (auth.uid() IS NOT NULL);

-- Create environment config table
CREATE TABLE IF NOT EXISTS public.environment_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment TEXT NOT NULL UNIQUE,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.environment_config ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read environment config
CREATE POLICY "Anyone can read environment config" ON public.environment_config
FOR SELECT USING (true);

-- Insert staging environment configuration
INSERT INTO public.environment_config (environment, config) VALUES
('staging', jsonb_build_object(
  'test_mode', true,
  'sandbox_payments', true,
  'email_routing', 'staging-test@bookd-testing.com',
  'logging_enabled', true,
  'debug_mode', true,
  'banner_message', 'You are in STAGING MODE - Test data and sandbox payments active'
))
ON CONFLICT (environment) DO UPDATE SET
  config = EXCLUDED.config,
  updated_at = now();

-- Insert sample bug reports for testing (without user dependencies)
INSERT INTO public.staging_bugs (issue_id, area, title, steps_to_reproduce, error_message, status, priority) VALUES
('BUG-001', 'Customer Flow', 'Sign up form validation error', '1. Go to signup page\n2. Leave email field empty\n3. Click submit', 'Email is required', 'Open', 'Medium'),
('BUG-002', 'Payment', 'Stripe test payment fails', '1. Complete booking flow\n2. Enter test card 4242424242424242\n3. Submit payment', 'Payment intent creation failed', 'Fixed', 'High'),
('BUG-003', 'Vendor Flow', 'Calendar not loading', '1. Login as vendor\n2. Navigate to dashboard\n3. Click calendar tab', 'Cannot read property of undefined', 'Open', 'High'),
('BUG-004', 'UI/UX', 'Mobile menu not responsive', '1. Open site on mobile\n2. Click hamburger menu\n3. Try to navigate', 'Menu items overlap', 'Open', 'Low'),
('BUG-005', 'Customer Flow', 'Search filters not working', '1. Go to browse vendors\n2. Apply location filter\n3. Results do not update', 'Filter state not updating', 'Open', 'Medium'),
('BUG-006', 'Vendor Flow', 'Profile image upload fails', '1. Go to vendor profile\n2. Try to upload logo\n3. Upload button not responding', 'File upload timeout', 'Retest', 'Low'),
('BUG-007', 'Payment', 'Commission calculation incorrect', '1. Complete a booking\n2. Mark invoice as paid\n3. Check commission amount', '10% commission not calculated properly', 'Open', 'Critical'),
('BUG-008', 'Admin', 'User deletion not working', '1. Go to admin dashboard\n2. Try to delete test user\n3. User still appears in list', 'Deletion API returns 500 error', 'Open', 'High'),
('BUG-009', 'Customer Flow', 'Booking confirmation email missing', '1. Complete booking process\n2. Submit payment\n3. Check email', 'Confirmation email not sent', 'Fixed', 'Medium'),
('BUG-010', 'Vendor Flow', 'Payout settings not saving', '1. Go to vendor settings\n2. Update bank details\n3. Save changes', 'Form validation error on save', 'Open', 'Medium')
ON CONFLICT (issue_id) DO UPDATE SET
  title = EXCLUDED.title,
  steps_to_reproduce = EXCLUDED.steps_to_reproduce,
  error_message = EXCLUDED.error_message,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority;