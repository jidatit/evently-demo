-- Migration: Create categories table + vendor_categories join table
-- Timestamp: 202512260930

-- 1. Categories table (data-driven, admin can manage these)
CREATE TABLE public.categories (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL UNIQUE,              -- e.g. 'Photography', 'Catering'
    slug        text UNIQUE,                       -- optional, good for URLs
    is_active   boolean NOT NULL DEFAULT true,
    description text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Join table: vendors ↔ categories (many-to-many + primary flag)
CREATE TABLE public.vendor_categories (
    vendor_id     uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    category_id   uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,

    is_primary    boolean NOT NULL DEFAULT false,
    display_order integer DEFAULT 0,

    created_at    timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (vendor_id, category_id)
);

-- 3. Enforce exactly one primary category per vendor
CREATE UNIQUE INDEX idx_vendor_one_primary_category
ON public.vendor_categories (vendor_id)
WHERE is_primary = true;

-- 4. Other useful indexes
CREATE INDEX idx_vendor_categories_category_id 
    ON public.vendor_categories (category_id);

CREATE INDEX idx_vendor_categories_primary 
    ON public.vendor_categories (vendor_id) 
    WHERE is_primary = true;

CREATE INDEX idx_vendor_categories_vendor_id 
    ON public.vendor_categories (vendor_id);

-- 5. Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_categories ENABLE ROW LEVEL SECURITY;

-- 6. Basic RLS Policies

-- Categories: everyone can read active categories (for vendor onboarding)
CREATE POLICY categories_read_public ON public.categories
    FOR SELECT
    USING (is_active = true);

-- Admin can manage categories (create/update/delete)
CREATE POLICY categories_admin_all ON public.categories
    FOR ALL
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

-- Vendor categories: vendors manage their own
CREATE POLICY vendor_categories_own_insert ON public.vendor_categories
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.vendors v
            WHERE v.id = vendor_id AND v.user_id = auth.uid()
        )
    );

CREATE POLICY vendor_categories_own_update_delete ON public.vendor_categories
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.vendors v
            WHERE v.id = vendor_id AND v.user_id = auth.uid()
        )
    );

-- Admins can see/manage all vendor-category relations
CREATE POLICY vendor_categories_admin_all ON public.vendor_categories
    FOR ALL
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

-- 7. Timestamp trigger (update updated_at)
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_categories_update_timestamp
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
