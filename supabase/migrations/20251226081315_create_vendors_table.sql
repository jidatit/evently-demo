-- Migration: Create vendors table with RLS and indexes
-- Timestamp: 202512270845

-- 1. Create vendors table (aligned with client-confirmed availability + onboarding needs)
CREATE TABLE public.vendors (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 uuid NOT NULL UNIQUE 
        REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    business_name           text NOT NULL,
    description             text,
    city                    text NOT NULL,              -- US-only location
    state                   text NOT NULL,
    contact_email           text,
    contact_phone           text,
    
    -- Simple global availability (Option A - client confirmed)
    accepting_bookings      boolean NOT NULL DEFAULT true,
    unavailable_until       date,
    unavailable_message     text,
    
    -- Moderation / status
    status                  text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    
    logo_url                text,
    
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Vendors can read/update their own record
CREATE POLICY vendors_select_own ON public.vendors
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY vendors_update_own ON public.vendors
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY vendors_insert_own ON public.vendors
FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- Admins can read/update all vendors
CREATE POLICY vendors_admin_all ON public.vendors
    FOR ALL
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Public can read approved, accepting vendors (for marketplace)
CREATE POLICY vendors_public_read ON public.vendors
    FOR SELECT
    USING (
        status = 'approved'
        AND accepting_bookings = true
    );

-- 4. Indexes
CREATE INDEX idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX idx_vendors_status_accepting ON public.vendors(status, accepting_bookings);
CREATE INDEX idx_vendors_city_state ON public.vendors(city, state);  -- for marketplace filtering

-- 5. Timestamp trigger (reuse if already created, or add here)
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_vendors_update_timestamp
    BEFORE UPDATE ON public.vendors
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();