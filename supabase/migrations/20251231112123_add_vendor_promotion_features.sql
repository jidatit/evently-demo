-- Migration: Add profile_slug and social_links to vendors for public profiles and promotion
-- Timestamp: 202512310930
-- Purpose: Enable shareable public vendor URLs (bookd.com/v/slug) and social media links
--          for "Promote Your Business" dashboard section (MVP lightweight feature)

-- 1. Add new columns to vendors table
ALTER TABLE public.vendors
    ADD COLUMN IF NOT EXISTS profile_slug text UNIQUE,
    ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS is_profile_public boolean NOT NULL DEFAULT true;

-- 2. Add helpful comments for future developers
COMMENT ON COLUMN public.vendors.profile_slug IS 'Unique slug for public profile URL (e.g., bookd.com/v/faizan-dj). Must be unique across all vendors.';
COMMENT ON COLUMN public.vendors.social_links IS 'JSON object storing social/platform links. Keys: instagram, tiktok, facebook, website, etc. Values: full URLs. Frontend enforces allowed platforms.';
COMMENT ON COLUMN public.vendors.is_profile_public IS 'Controls whether this vendor''s public profile is visible on the marketplace. Defaults to true.';

-- 3. Indexes for performance
-- Index on profile_slug for fast public lookups (most important route: /v/:slug)
CREATE INDEX IF NOT EXISTS idx_vendors_profile_slug ON public.vendors(profile_slug);

-- GIN index on social_links for future queries (e.g., find vendors with Instagram)
CREATE INDEX IF NOT EXISTS idx_vendors_social_links ON public.vendors USING GIN (social_links);

-- Composite index for public marketplace queries (approved + accepting + public profile)
CREATE INDEX IF NOT EXISTS idx_vendors_public_visible 
    ON public.vendors(status, accepting_bookings, is_profile_public)
    WHERE status = 'approved' AND accepting_bookings = true AND is_profile_public = true;

-- 4. Update public read policy to respect is_profile_public
-- Replace or drop the old public policy if needed, then recreate with new condition
DROP POLICY IF EXISTS vendors_public_read ON public.vendors;

CREATE POLICY vendors_public_read ON public.vendors
    FOR SELECT
    USING (
        status = 'approved'
        AND accepting_bookings = true
        AND is_profile_public = true
    );


-- 6. Optional: Auto-generate initial profile_slug from business_name for existing vendors
-- Uncomment and run once if you have existing data and want to backfill slugs
--
-- UPDATE public.vendors
-- SET profile_slug = lower(regexp_replace(trim(business_name), '[^a-zA-Z0-9]+', '-', 'g'))
-- WHERE profile_slug IS NULL;
--
-- -- Handle duplicates by appending -1, -2, etc. (requires more advanced logic or app-level handling)