-- Migration: Create services table with RLS and indexes
-- Timestamp: 202512271045

-- 1. Create services table
CREATE TABLE public.services (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id       uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    
    name            text NOT NULL,
    description     text,
    price           numeric,                           -- NULL = quote-based
    pricing_type    text NOT NULL 
        CHECK (pricing_type IN ('per_hour', 'per_event', 'per_day', 'quote')),
    duration_minutes integer,                           -- in minutes
    
    is_active       boolean NOT NULL DEFAULT true,
    display_order   integer DEFAULT 0,                 -- for sorting on profile
    
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Vendors can manage (CRUD) their own services
CREATE POLICY services_vendor_all ON public.services
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.vendors v
            WHERE v.id = vendor_id AND v.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.vendors v
            WHERE v.id = vendor_id AND v.user_id = auth.uid()
        )
    );

-- Public read for active services (marketplace/vendor profile)
CREATE POLICY services_public_read ON public.services
    FOR SELECT
    USING (
        is_active = true
        AND EXISTS (
            SELECT 1 FROM public.vendors v
            WHERE v.id = vendor_id 
              AND v.status = 'approved'
              AND v.accepting_bookings = true
        )
    );

-- Admins can manage all services
CREATE POLICY services_admin_all ON public.services
    FOR ALL
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 4. Indexes for performance
-- Common lookups
CREATE INDEX idx_services_vendor_id ON public.services(vendor_id);
CREATE INDEX idx_services_vendor_active ON public.services(vendor_id, is_active);
CREATE INDEX idx_services_name ON public.services(name);  -- for search if needed later

-- 5. Timestamp trigger (update updated_at)
CREATE TRIGGER trig_services_update_timestamp
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();