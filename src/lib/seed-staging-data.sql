-- Staging Database Seed Data for Book'D
-- Run this script in your staging Supabase database

-- Create staging logs table for tracking
CREATE TABLE IF NOT EXISTS public.staging_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type TEXT NOT NULL,
  log_level TEXT DEFAULT 'info',
  message TEXT,
  environment TEXT NOT NULL DEFAULT 'staging',
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on staging logs
ALTER TABLE public.staging_logs ENABLE ROW LEVEL SECURITY;

-- Allow system to insert logs
CREATE POLICY "System can insert staging logs" ON public.staging_logs
FOR INSERT WITH CHECK (true);

-- Allow admins to view logs
CREATE POLICY "Admins can view staging logs" ON public.staging_logs
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed staging users (profiles)
INSERT INTO public.profiles (id, email, name) VALUES
('11111111-1111-1111-1111-111111111111', 'staging-customer@bookd-test.com', 'Test Customer'),
('22222222-2222-2222-2222-222222222222', 'staging-vendor1@bookd-test.com', 'Staging DJ Service'),
('33333333-3333-3333-3333-333333333333', 'staging-vendor2@bookd-test.com', 'Test Photographer'),
('44444444-4444-4444-4444-444444444444', 'staging-admin@bookd-test.com', 'Staging Admin'),
('55555555-5555-5555-5555-555555555555', 'staging-customer2@bookd-test.com', 'Another Test Customer')
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  name = EXCLUDED.name;

-- Seed user roles
INSERT INTO public.user_roles (user_id, role) VALUES
('44444444-4444-4444-4444-444444444444', 'admin'),
('22222222-2222-2222-2222-222222222222', 'vendor'),
('33333333-3333-3333-3333-333333333333', 'vendor')
ON CONFLICT (user_id, role) DO NOTHING;

-- Seed staging vendors
INSERT INTO public.vendors (id, user_id, business_name, category, description, contact_email, contact_phone, location) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Staging Sound & DJ Services', 'DJ/Music', 'Professional DJ services for staging and testing. Amazing beats for your fake events!', 'staging-dj@bookd-test.com', '555-STAGE-DJ', 'Staging City, ST'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'Test Photo Studio', 'Photography', 'Professional photography for all your staging needs. We make everything look great in tests!', 'staging-photo@bookd-test.com', '555-TEST-PIC', 'Test Town, ST')
ON CONFLICT (id) DO UPDATE SET 
  business_name = EXCLUDED.business_name,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- Seed staging services
INSERT INTO public.services (id, vendor_id, name, description, price, pricing_type, duration_minutes) VALUES
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Wedding DJ Package', 'Complete DJ service with sound system and lighting for staging weddings', 799.99, 'per_event', 360),
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Corporate Event DJ', 'Professional DJ services for corporate events and staging', 599.99, 'per_event', 240),
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Wedding Photography', 'Full day wedding photography package for staging', 1299.99, 'per_event', 480),
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Event Photography', 'Corporate and social event photography for staging', 899.99, 'per_event', 300);

-- Seed staging bookings
INSERT INTO public.bookings (id, vendor_id, customer_id, customer_name, customer_email, service_name, booking_date, start_time, end_time, status, total_amount, notes) VALUES
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Test Customer', 'staging-customer@bookd-test.com', 'Wedding DJ Package', '2024-03-15', '18:00', '23:00', 'confirmed', 799.99, 'Staging wedding event - test booking'),
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Test Customer', 'staging-customer@bookd-test.com', 'Event Photography', '2024-03-20', '14:00', '19:00', 'pending', 899.99, 'Corporate event photography - staging'),
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'Another Test Customer', 'staging-customer2@bookd-test.com', 'Corporate Event DJ', '2024-03-25', '19:00', '23:00', 'confirmed', 599.99, 'Test corporate booking for staging');

-- Seed staging reviews
INSERT INTO public.vendor_reviews (vendor_id, customer_id, overall_rating, service_rating, communication_rating, value_rating, review_text, is_verified) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 5, 5, 5, 4, 'Amazing DJ service! Perfect for our staging wedding. The music selection was exactly what we needed for testing.', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 4, 5, 4, 4, 'Great photographer for our staging event. Professional and captured all the important test moments.', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 5, 5, 5, 5, 'Excellent staging DJ! Made our fake corporate event feel real. Highly recommended for testing purposes.', true);

-- Insert staging notification
INSERT INTO public.staging_logs (log_type, log_level, message, environment, data) VALUES
('seed', 'info', 'Staging database seeded with dummy data', 'staging', 
jsonb_build_object(
  'seeded_at', now(),
  'tables_seeded', ARRAY['profiles', 'user_roles', 'vendors', 'services', 'bookings', 'vendor_reviews'],
  'test_users', 5,
  'test_vendors', 2,
  'test_bookings', 3,
  'notes', 'All data is for testing purposes only'
));

-- Create a staging environment flag
CREATE TABLE IF NOT EXISTS public.environment_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.environment_config ENABLE ROW LEVEL SECURITY;

-- Allow system to manage config
CREATE POLICY "System can manage environment config" ON public.environment_config
FOR ALL USING (true);

-- Insert staging config
INSERT INTO public.environment_config (environment, config) VALUES
('staging', jsonb_build_object(
  'stripe_test_mode', true,
  'email_test_mode', true,
  'test_email_recipient', 'staging-test@bookd-testing.com',
  'detailed_logging', true,
  'max_test_payment_amount', 500,
  'banner_message', 'STAGING – TESTING ENVIRONMENT'
))
ON CONFLICT (environment) DO UPDATE SET
  config = EXCLUDED.config,
  updated_at = now();