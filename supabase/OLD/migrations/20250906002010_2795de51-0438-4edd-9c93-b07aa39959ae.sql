-- Enhanced staging environment setup for Book'D with comprehensive test data

-- Create bug tracking table
CREATE TABLE IF NOT EXISTS public.staging_bugs (
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

-- Expanded staging data with 25+ vendors across categories
INSERT INTO public.profiles (id, email, name) VALUES
-- Customers (25)
('c0000001-1111-1111-1111-111111111111', 'customer1@bookd-test.com', 'Alice Johnson'),
('c0000002-1111-1111-1111-111111111111', 'customer2@bookd-test.com', 'Bob Smith'),
('c0000003-1111-1111-1111-111111111111', 'customer3@bookd-test.com', 'Carol Williams'),
('c0000004-1111-1111-1111-111111111111', 'customer4@bookd-test.com', 'David Brown'),
('c0000005-1111-1111-1111-111111111111', 'customer5@bookd-test.com', 'Emma Davis'),
('c0000006-1111-1111-1111-111111111111', 'customer6@bookd-test.com', 'Frank Miller'),
('c0000007-1111-1111-1111-111111111111', 'customer7@bookd-test.com', 'Grace Wilson'),
('c0000008-1111-1111-1111-111111111111', 'customer8@bookd-test.com', 'Henry Moore'),
('c0000009-1111-1111-1111-111111111111', 'customer9@bookd-test.com', 'Iris Taylor'),
('c0000010-1111-1111-1111-111111111111', 'customer10@bookd-test.com', 'Jack Anderson'),
('c0000011-1111-1111-1111-111111111111', 'customer11@bookd-test.com', 'Karen Thomas'),
('c0000012-1111-1111-1111-111111111111', 'customer12@bookd-test.com', 'Leo Jackson'),
('c0000013-1111-1111-1111-111111111111', 'customer13@bookd-test.com', 'Mia White'),
('c0000014-1111-1111-1111-111111111111', 'customer14@bookd-test.com', 'Noah Harris'),
('c0000015-1111-1111-1111-111111111111', 'customer15@bookd-test.com', 'Olivia Martin'),
('c0000016-1111-1111-1111-111111111111', 'customer16@bookd-test.com', 'Paul Garcia'),
('c0000017-1111-1111-1111-111111111111', 'customer17@bookd-test.com', 'Quinn Rodriguez'),
('c0000018-1111-1111-1111-111111111111', 'customer18@bookd-test.com', 'Ruby Lewis'),
('c0000019-1111-1111-1111-111111111111', 'customer19@bookd-test.com', 'Sam Lee'),
('c0000020-1111-1111-1111-111111111111', 'customer20@bookd-test.com', 'Tina Walker'),
('c0000021-1111-1111-1111-111111111111', 'customer21@bookd-test.com', 'Uma Hall'),
('c0000022-1111-1111-1111-111111111111', 'customer22@bookd-test.com', 'Victor Allen'),
('c0000023-1111-1111-1111-111111111111', 'customer23@bookd-test.com', 'Wendy Young'),
('c0000024-1111-1111-1111-111111111111', 'customer24@bookd-test.com', 'Xavier King'),
('c0000025-1111-1111-1111-111111111111', 'customer25@bookd-test.com', 'Yara Scott'),

-- Vendors (25+)
('v0000001-2222-2222-2222-222222222222', 'dj1@bookd-test.com', 'DJ Mike Beats'),
('v0000002-2222-2222-2222-222222222222', 'dj2@bookd-test.com', 'Sarah Sound'),
('v0000003-2222-2222-2222-222222222222', 'photo1@bookd-test.com', 'Lens Master Pro'),
('v0000004-2222-2222-2222-222222222222', 'photo2@bookd-test.com', 'Picture Perfect'),
('v0000005-2222-2222-2222-222222222222', 'catering1@bookd-test.com', 'Gourmet Catering Co'),
('v0000006-2222-2222-2222-222222222222', 'catering2@bookd-test.com', 'Feast Masters'),
('v0000007-2222-2222-2222-222222222222', 'rental1@bookd-test.com', 'Party Rentals Plus'),
('v0000008-2222-2222-2222-222222222222', 'rental2@bookd-test.com', 'Event Equipment Pro'),
('v0000009-2222-2222-2222-222222222222', 'planner1@bookd-test.com', 'Dream Events'),
('v0000010-2222-2222-2222-222222222222', 'planner2@bookd-test.com', 'Perfect Planning'),
('v0000011-2222-2222-2222-222222222222', 'florist1@bookd-test.com', 'Bloom & Blossom'),
('v0000012-2222-2222-2222-222222222222', 'florist2@bookd-test.com', 'Petal Perfection'),
('v0000013-2222-2222-2222-222222222222', 'baker1@bookd-test.com', 'Sweet Celebrations'),
('v0000014-2222-2222-2222-222222222222', 'baker2@bookd-test.com', 'Cake Magic'),
('v0000015-2222-2222-2222-222222222222', 'band1@bookd-test.com', 'Live Music Legends'),
('v0000016-2222-2222-2222-222222222222', 'band2@bookd-test.com', 'The Event Band'),
('v0000017-2222-2222-2222-222222222222', 'decor1@bookd-test.com', 'Elegant Designs'),
('v0000018-2222-2222-2222-222222222222', 'decor2@bookd-test.com', 'Style & Space'),
('v0000019-2222-2222-2222-222222222222', 'video1@bookd-test.com', 'Cinema Moments'),
('v0000020-2222-2222-2222-222222222222', 'video2@bookd-test.com', 'Video Visions'),
('v0000021-2222-2222-2222-222222222222', 'makeup1@bookd-test.com', 'Beauty Pro'),
('v0000022-2222-2222-2222-222222222222', 'makeup2@bookd-test.com', 'Glam Squad'),
('v0000023-2222-2222-2222-222222222222', 'transport1@bookd-test.com', 'Luxury Rides'),
('v0000024-2222-2222-2222-222222222222', 'transport2@bookd-test.com', 'Elite Transport'),
('v0000025-2222-2222-2222-222222222222', 'security1@bookd-test.com', 'Safe Events Security'),
('v0000026-2222-2222-2222-222222222222', 'cleaning1@bookd-test.com', 'Post-Event Cleanup'),

-- Admin
('admin001-3333-3333-3333-333333333333', 'admin@bookd-test.com', 'Staging Admin')
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  name = EXCLUDED.name;

-- User roles for vendors and admin
INSERT INTO public.user_roles (user_id, role) VALUES
('admin001-3333-3333-3333-333333333333', 'admin'),
('v0000001-2222-2222-2222-222222222222', 'vendor'),
('v0000002-2222-2222-2222-222222222222', 'vendor'),
('v0000003-2222-2222-2222-222222222222', 'vendor'),
('v0000004-2222-2222-2222-222222222222', 'vendor'),
('v0000005-2222-2222-2222-222222222222', 'vendor'),
('v0000006-2222-2222-2222-222222222222', 'vendor'),
('v0000007-2222-2222-2222-222222222222', 'vendor'),
('v0000008-2222-2222-2222-222222222222', 'vendor'),
('v0000009-2222-2222-2222-222222222222', 'vendor'),
('v0000010-2222-2222-2222-222222222222', 'vendor'),
('v0000011-2222-2222-2222-222222222222', 'vendor'),
('v0000012-2222-2222-2222-222222222222', 'vendor'),
('v0000013-2222-2222-2222-222222222222', 'vendor'),
('v0000014-2222-2222-2222-222222222222', 'vendor'),
('v0000015-2222-2222-2222-222222222222', 'vendor'),
('v0000016-2222-2222-2222-222222222222', 'vendor'),
('v0000017-2222-2222-2222-222222222222', 'vendor'),
('v0000018-2222-2222-2222-222222222222', 'vendor'),
('v0000019-2222-2222-2222-222222222222', 'vendor'),
('v0000020-2222-2222-2222-222222222222', 'vendor'),
('v0000021-2222-2222-2222-222222222222', 'vendor'),
('v0000022-2222-2222-2222-222222222222', 'vendor'),
('v0000023-2222-2222-2222-222222222222', 'vendor'),
('v0000024-2222-2222-2222-222222222222', 'vendor'),
('v0000025-2222-2222-2222-222222222222', 'vendor'),
('v0000026-2222-2222-2222-222222222222', 'vendor')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create vendors across all categories
INSERT INTO public.vendors (id, user_id, business_name, category, description, contact_email, contact_phone, location) VALUES
-- DJs (4)
('dj000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'v0000001-2222-2222-2222-222222222222', 'DJ Mike Beats Entertainment', 'DJ/Music', 'Professional DJ with 10+ years experience. Specializes in weddings, corporate events, and parties.', 'dj1@bookd-test.com', '555-DJ-BEATS', 'New York, NY'),
('dj000002-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'v0000002-2222-2222-2222-222222222222', 'Sarah Sound Productions', 'DJ/Music', 'Award-winning female DJ bringing energy to every event. Modern sound systems and lighting included.', 'dj2@bookd-test.com', '555-SOUND-DJ', 'Los Angeles, CA'),

-- Photography (4)
('ph000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'v0000003-2222-2222-2222-222222222222', 'Lens Master Pro Photography', 'Photography', 'Capturing life\'s precious moments with artistic flair. Wedding and event specialist.', 'photo1@bookd-test.com', '555-LENS-PRO', 'Chicago, IL'),
('ph000002-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'v0000004-2222-2222-2222-222222222222', 'Picture Perfect Studios', 'Photography', 'Contemporary photography studio with drone capabilities and same-day editing.', 'photo2@bookd-test.com', '555-PERFECT', 'Miami, FL'),

-- Catering (4)
('ca000001-cccc-cccc-cccc-cccccccccccc', 'v0000005-2222-2222-2222-222222222222', 'Gourmet Catering Co', 'Catering', 'Farm-to-table catering with customizable menus. Accommodates all dietary restrictions.', 'catering1@bookd-test.com', '555-GOURMET', 'Seattle, WA'),
('ca000002-cccc-cccc-cccc-cccccccccccc', 'v0000006-2222-2222-2222-222222222222', 'Feast Masters Catering', 'Catering', 'Full-service catering for events of all sizes. International cuisine specialists.', 'catering2@bookd-test.com', '555-FEAST-M', 'Austin, TX'),

-- Rentals (4)
('re000001-dddd-dddd-dddd-dddddddddddd', 'v0000007-2222-2222-2222-222222222222', 'Party Rentals Plus', 'Rentals', 'Complete party rental solutions: tents, tables, chairs, linens, and more.', 'rental1@bookd-test.com', '555-RENTALS', 'Denver, CO'),
('re000002-dddd-dddd-dddd-dddddddddddd', 'v0000008-2222-2222-2222-222222222222', 'Event Equipment Pro', 'Rentals', 'Professional-grade AV equipment, staging, and furniture rentals for any event.', 'rental2@bookd-test.com', '555-EQUIP-PRO', 'Portland, OR'),

-- Event Planning (4)
('pl000001-eeee-eeee-eeee-eeeeeeeeeeee', 'v0000009-2222-2222-2222-222222222222', 'Dream Events Planning', 'Event Planning', 'Full-service event planning from concept to execution. Making your dreams reality.', 'planner1@bookd-test.com', '555-DREAM-EV', 'Boston, MA'),
('pl000002-eeee-eeee-eeee-eeeeeeeeeeee', 'v0000010-2222-2222-2222-222222222222', 'Perfect Planning Solutions', 'Event Planning', 'Stress-free event coordination with attention to every detail. Corporate and social events.', 'planner2@bookd-test.com', '555-PERFECT-P', 'San Francisco, CA'),

-- Florists (2)
('fl000001-ffff-ffff-ffff-ffffffffffff', 'v0000011-2222-2222-2222-222222222222', 'Bloom & Blossom Florals', 'Florist', 'Fresh, seasonal floral arrangements and installations. Sustainable and locally sourced.', 'florist1@bookd-test.com', '555-BLOOM-FL', 'Nashville, TN'),
('fl000002-ffff-ffff-ffff-ffffffffffff', 'v0000012-2222-2222-2222-222222222222', 'Petal Perfection Design', 'Florist', 'Luxury floral design for upscale events. Custom arrangements and bridal bouquets.', 'florist2@bookd-test.com', '555-PETAL-P', 'Atlanta, GA'),

-- Bakers (2)
('bk000001-gggg-gggg-gggg-gggggggggggg', 'v0000013-2222-2222-2222-222222222222', 'Sweet Celebrations Bakery', 'Bakery', 'Custom wedding cakes and dessert tables. Gluten-free and vegan options available.', 'baker1@bookd-test.com', '555-SWEET-C', 'Philadelphia, PA'),
('bk000002-gggg-gggg-gggg-gggggggggggg', 'v0000014-2222-2222-2222-222222222222', 'Cake Magic Creations', 'Bakery', 'Artistic cake designs and gourmet desserts. Winner of multiple baking awards.', 'baker2@bookd-test.com', '555-CAKE-M', 'Las Vegas, NV'),

-- Live Music (2) 
('mu000001-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'v0000015-2222-2222-2222-222222222222', 'Live Music Legends', 'Live Music', 'Professional live band covering all genres. From jazz trios to full rock bands.', 'band1@bookd-test.com', '555-LIVE-M', 'New Orleans, LA'),
('mu000002-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'v0000016-2222-2222-2222-222222222222', 'The Event Band Collective', 'Live Music', 'Versatile musicians for any occasion. Classical, jazz, pop, and contemporary hits.', 'band2@bookd-test.com', '555-EVENT-B', 'Detroit, MI'),

-- Decorations (2)
('de000001-iiii-iiii-iiii-iiiiiiiiiiii', 'v0000017-2222-2222-2222-222222222222', 'Elegant Designs & Decor', 'Decorations', 'Transforming spaces with elegant decor and lighting. Modern and classic styles available.', 'decor1@bookd-test.com', '555-ELEGANT', 'Phoenix, AZ'),
('de000002-iiii-iiii-iiii-iiiiiiiiiiii', 'v0000018-2222-2222-2222-222222222222', 'Style & Space Decorations', 'Decorations', 'Creative event styling and custom installations. Themed events our specialty.', 'decor2@bookd-test.com', '555-STYLE-S', 'Minneapolis, MN'),

-- Videography (2)
('vi000001-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'v0000019-2222-2222-2222-222222222222', 'Cinema Moments Productions', 'Videography', 'Cinematic wedding and event videography. 4K filming with drone footage available.', 'video1@bookd-test.com', '555-CINEMA', 'Sacramento, CA'),
('vi000002-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'v0000020-2222-2222-2222-222222222222', 'Video Visions Studio', 'Videography', 'Storytelling through video. Same-day highlight reels and professional editing.', 'video2@bookd-test.com', '555-VIDEO-V', 'Charlotte, NC');

-- Insert sample bug reports
INSERT INTO public.staging_bugs (issue_id, area, title, steps_to_reproduce, error_message, status, priority) VALUES
('BUG-001', 'Customer Flow', 'Sign up form validation error', '1. Go to signup page\n2. Leave email field empty\n3. Click submit', 'Email is required', 'Open', 'Medium'),
('BUG-002', 'Payment', 'Stripe test payment fails', '1. Complete booking flow\n2. Enter test card 4242424242424242\n3. Submit payment', 'Payment intent creation failed', 'Fixed', 'High'),
('BUG-003', 'Vendor Flow', 'Calendar not loading', '1. Login as vendor\n2. Navigate to dashboard\n3. Click calendar tab', 'Cannot read property of undefined', 'Open', 'High'),
('BUG-004', 'UI/UX', 'Mobile menu not responsive', '1. Open site on mobile\n2. Click hamburger menu\n3. Try to navigate', 'Menu items overlap', 'Open', 'Low');