-- Fix staging environment database migration
-- This corrects UUID format and SQL syntax issues

-- Ensure proper UUID format for all test data
-- Drop and recreate staging_bugs if it exists with issues
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

-- Insert comprehensive staging test data
-- Test profiles with proper UUID v4 format
INSERT INTO public.profiles (id, email, name) VALUES
-- Test customers 
('11111111-1111-4111-8111-111111111111', 'customer1@bookd-test.com', 'Alice Johnson'),
('11111111-1111-4111-8111-111111111112', 'customer2@bookd-test.com', 'Bob Smith'),
('11111111-1111-4111-8111-111111111113', 'customer3@bookd-test.com', 'Carol Williams'),
('11111111-1111-4111-8111-111111111114', 'customer4@bookd-test.com', 'David Brown'),
('11111111-1111-4111-8111-111111111115', 'customer5@bookd-test.com', 'Emma Davis'),
('11111111-1111-4111-8111-111111111116', 'customer6@bookd-test.com', 'Frank Miller'),
('11111111-1111-4111-8111-111111111117', 'customer7@bookd-test.com', 'Grace Wilson'),
('11111111-1111-4111-8111-111111111118', 'customer8@bookd-test.com', 'Henry Moore'),
('11111111-1111-4111-8111-111111111119', 'customer9@bookd-test.com', 'Iris Taylor'),
('11111111-1111-4111-8111-111111111120', 'customer10@bookd-test.com', 'Jack Anderson'),
('11111111-1111-4111-8111-111111111121', 'customer11@bookd-test.com', 'Karen Thomas'),
('11111111-1111-4111-8111-111111111122', 'customer12@bookd-test.com', 'Leo Jackson'),
('11111111-1111-4111-8111-111111111123', 'customer13@bookd-test.com', 'Mia White'),
('11111111-1111-4111-8111-111111111124', 'customer14@bookd-test.com', 'Noah Harris'),
('11111111-1111-4111-8111-111111111125', 'customer15@bookd-test.com', 'Olivia Martin'),

-- Test vendors
('22222222-2222-4222-8222-222222222221', 'dj1@bookd-test.com', 'DJ Mike Beats'),
('22222222-2222-4222-8222-222222222222', 'dj2@bookd-test.com', 'Sarah Sound'),
('22222222-2222-4222-8222-222222222223', 'photo1@bookd-test.com', 'Lens Master Pro'),
('22222222-2222-4222-8222-222222222224', 'photo2@bookd-test.com', 'Picture Perfect'),
('22222222-2222-4222-8222-222222222225', 'catering1@bookd-test.com', 'Gourmet Catering Co'),
('22222222-2222-4222-8222-222222222226', 'catering2@bookd-test.com', 'Feast Masters'),
('22222222-2222-4222-8222-222222222227', 'rental1@bookd-test.com', 'Party Rentals Plus'),
('22222222-2222-4222-8222-222222222228', 'rental2@bookd-test.com', 'Event Equipment Pro'),
('22222222-2222-4222-8222-222222222229', 'planner1@bookd-test.com', 'Dream Events'),
('22222222-2222-4222-8222-222222222230', 'planner2@bookd-test.com', 'Perfect Planning'),
('22222222-2222-4222-8222-222222222231', 'florist1@bookd-test.com', 'Bloom & Blossom'),
('22222222-2222-4222-8222-222222222232', 'florist2@bookd-test.com', 'Petal Perfection'),
('22222222-2222-4222-8222-222222222233', 'baker1@bookd-test.com', 'Sweet Celebrations'),
('22222222-2222-4222-8222-222222222234', 'baker2@bookd-test.com', 'Cake Magic'),
('22222222-2222-4222-8222-222222222235', 'band1@bookd-test.com', 'Live Music Legends'),

-- Admin
('33333333-3333-4333-8333-333333333333', 'admin@bookd-test.com', 'Staging Admin')
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  name = EXCLUDED.name;

-- User roles for vendors and admin
INSERT INTO public.user_roles (user_id, role) VALUES
('33333333-3333-4333-8333-333333333333', 'admin'),
('22222222-2222-4222-8222-222222222221', 'vendor'),
('22222222-2222-4222-8222-222222222222', 'vendor'),
('22222222-2222-4222-8222-222222222223', 'vendor'),
('22222222-2222-4222-8222-222222222224', 'vendor'),
('22222222-2222-4222-8222-222222222225', 'vendor'),
('22222222-2222-4222-8222-222222222226', 'vendor'),
('22222222-2222-4222-8222-222222222227', 'vendor'),
('22222222-2222-4222-8222-222222222228', 'vendor'),
('22222222-2222-4222-8222-222222222229', 'vendor'),
('22222222-2222-4222-8222-222222222230', 'vendor'),
('22222222-2222-4222-8222-222222222231', 'vendor'),
('22222222-2222-4222-8222-222222222232', 'vendor'),
('22222222-2222-4222-8222-222222222233', 'vendor'),
('22222222-2222-4222-8222-222222222234', 'vendor'),
('22222222-2222-4222-8222-222222222235', 'vendor')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create vendor profiles across all categories
INSERT INTO public.vendors (id, user_id, business_name, category, description, contact_email, contact_phone, location) VALUES
-- DJs
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222221', 'DJ Mike Beats Entertainment', 'DJ/Music', 'Professional DJ with 10+ years experience in weddings and corporate events.', 'dj1@bookd-test.com', '555-DJ-BEATS', 'New York, NY'),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab', '22222222-2222-4222-8222-222222222222', 'Sarah Sound Productions', 'DJ/Music', 'Award-winning female DJ with modern sound systems and lighting.', 'dj2@bookd-test.com', '555-SOUND-DJ', 'Los Angeles, CA'),

-- Photography
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222223', 'Lens Master Pro Photography', 'Photography', 'Artistic wedding and event photography specialist.', 'photo1@bookd-test.com', '555-LENS-PRO', 'Chicago, IL'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc', '22222222-2222-4222-8222-222222222224', 'Picture Perfect Studios', 'Photography', 'Contemporary photography with drone capabilities and same-day editing.', 'photo2@bookd-test.com', '555-PERFECT', 'Miami, FL'),

-- Catering
('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '22222222-2222-4222-8222-222222222225', 'Gourmet Catering Co', 'Catering', 'Farm-to-table catering with customizable menus for all dietary restrictions.', 'catering1@bookd-test.com', '555-GOURMET', 'Seattle, WA'),
('cccccccc-cccc-4ccc-8ccc-cccccccccccd', '22222222-2222-4222-8222-222222222226', 'Feast Masters Catering', 'Catering', 'Full-service catering for events of all sizes with international cuisine.', 'catering2@bookd-test.com', '555-FEAST-M', 'Austin, TX'),

-- Rentals
('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '22222222-2222-4222-8222-222222222227', 'Party Rentals Plus', 'Rentals', 'Complete party rental solutions including tents, tables, chairs, and linens.', 'rental1@bookd-test.com', '555-RENTALS', 'Denver, CO'),
('dddddddd-dddd-4ddd-8ddd-ddddddddddde', '22222222-2222-4222-8222-222222222228', 'Event Equipment Pro', 'Rentals', 'Professional-grade AV equipment, staging, and furniture rentals.', 'rental2@bookd-test.com', '555-EQUIP-PRO', 'Portland, OR')
ON CONFLICT (id) DO UPDATE SET 
  business_name = EXCLUDED.business_name,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- Insert sample bug reports for testing
INSERT INTO public.staging_bugs (issue_id, area, title, steps_to_reproduce, error_message, status, priority) VALUES
('BUG-001', 'Customer Flow', 'Sign up form validation error', '1. Go to signup page\n2. Leave email field empty\n3. Click submit', 'Email is required', 'Open', 'Medium'),
('BUG-002', 'Payment', 'Stripe test payment fails', '1. Complete booking flow\n2. Enter test card 4242424242424242\n3. Submit payment', 'Payment intent creation failed', 'Fixed', 'High'),
('BUG-003', 'Vendor Flow', 'Calendar not loading', '1. Login as vendor\n2. Navigate to dashboard\n3. Click calendar tab', 'Cannot read property of undefined', 'Open', 'High'),
('BUG-004', 'UI/UX', 'Mobile menu not responsive', '1. Open site on mobile\n2. Click hamburger menu\n3. Try to navigate', 'Menu items overlap', 'Open', 'Low'),
('BUG-005', 'Customer Flow', 'Search filters not working', '1. Go to browse vendors\n2. Apply location filter\n3. Results do not update', 'Filter state not updating', 'Open', 'Medium'),
('BUG-006', 'Vendor Flow', 'Profile image upload fails', '1. Go to vendor profile\n2. Try to upload logo\n3. Upload button not responding', 'File upload timeout', 'Retest', 'Low')
ON CONFLICT (issue_id) DO UPDATE SET
  title = EXCLUDED.title,
  steps_to_reproduce = EXCLUDED.steps_to_reproduce,
  error_message = EXCLUDED.error_message,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority;