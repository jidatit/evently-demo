-- Migration: vendor_module_schema_update_2025_12
-- Date: 2025-12-23
-- Purpose: Finalize vendor table for MVP - clean location, multi-category, simple availability foundation

-- ============================================================================
-- 1. Clean up old/obsolete columns (safe to run multiple times)
ALTER TABLE public.vendors
    DROP COLUMN IF EXISTS category,           -- old single category column
    DROP COLUMN IF EXISTS location,           -- any previous generic location
    DROP COLUMN IF EXISTS service_area;       -- explicitly removed per decision

-- 2. Add/ensure required columns
ALTER TABLE public.vendors
    -- Multi-category support (array)
    ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}',

    -- Simple location (USA only - city + state)
    ADD COLUMN IF NOT EXISTS city text,
    ADD COLUMN IF NOT EXISTS state text,

    -- Simple availability controls (MVP version)
    ADD COLUMN IF NOT EXISTS accepting_bookings boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS unavailable_until date,
    ADD COLUMN IF NOT EXISTS unavailable_message text,

    -- Safety field
    ADD COLUMN IF NOT EXISTS is_frozen boolean NOT NULL DEFAULT false;

-- 3. Create useful indexes
CREATE INDEX IF NOT EXISTS idx_vendors_state ON public.vendors (state);
CREATE INDEX IF NOT EXISTS idx_vendors_city ON public.vendors (city);
CREATE INDEX IF NOT EXISTS idx_vendors_accepting ON public.vendors (accepting_bookings);
CREATE INDEX IF NOT EXISTS idx_vendors_categories ON public.vendors USING GIN (categories);

-- 4. Future availability blocks table (structure prepared)
CREATE TABLE IF NOT EXISTS public.vendor_availability_blocks (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id   uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    starts_at   timestamptz NOT NULL,
    ends_at     timestamptz NOT NULL,
    reason      text,
    notes       text,
    created_at  timestamptz DEFAULT now(),

    CONSTRAINT chk_valid_date_range CHECK (starts_at < ends_at)
);

CREATE INDEX IF NOT EXISTS idx_availability_vendor_range 
    ON public.vendor_availability_blocks (vendor_id, starts_at, ends_at);

-- 5. Optional: service <-> media relation (nice to have)
ALTER TABLE public.vendor_media
    ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vendor_media_service 
    ON public.vendor_media (service_id);

-- ============================================================================
-- Migration complete
-- Recommended comment for documentation
COMMENT ON TABLE public.vendors IS 'Core vendor entity - MVP version with simple city/state location, multi-category support, and basic availability toggle.';