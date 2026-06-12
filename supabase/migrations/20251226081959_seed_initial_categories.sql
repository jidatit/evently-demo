-- Migration: Seed initial categories from UI
-- Timestamp: 202512270915

INSERT INTO public.categories (name, slug, is_active, description)
VALUES
    ('Catering', 'catering', true, 'Professional catering services for events'),
    ('Photography', 'photography', true, 'Event and wedding photographers'),
    ('DJ/Music', 'dj-music', true, 'DJ services and live music entertainment'),
    ('Decor', 'decor', true, 'Event decoration and setup'),
    ('Other', 'other', true, 'Other specialized event services')
ON CONFLICT (name) DO NOTHING;

-- Optional extras (good to have for testing/marketplace)
INSERT INTO public.categories (name, slug, is_active, description)
VALUES
    ('Videography', 'videography', true, 'Videography services'),
    ('Venue', 'venue', true, 'Event venues and locations'),
    ('Florist', 'florist', true, 'Floral and decor services')
ON CONFLICT (name) DO NOTHING;

-- Log count for confirmation
DO $$ 
BEGIN
    RAISE NOTICE 'Seeded % active categories', 
        (SELECT COUNT(*) FROM public.categories WHERE is_active = true);
END $$;