-- Migration: Create vendor_media table with RLS and indexes
-- Timestamp: 202512271200

-- 1. Create vendor_media table
CREATE TABLE public.vendor_media (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id       uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    
    file_name       text NOT NULL,
    file_url        text NOT NULL,                  -- Public or signed URL from Supabase Storage
    file_type       text NOT NULL 
        CHECK (file_type IN ('image', 'video')),
    file_size       integer,                         -- in bytes
    mime_type       text,
    
    -- Optional metadata (future-proof)
    display_order   integer DEFAULT 0,
    is_active       boolean NOT NULL DEFAULT true,
    
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.vendor_media ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Vendors can manage (CRUD) their own media
CREATE POLICY vendor_media_vendor_all ON public.vendor_media
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

-- Public read for active media (vendor profile/gallery)
CREATE POLICY vendor_media_public_read ON public.vendor_media
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

-- Admins can manage all media
CREATE POLICY vendor_media_admin_all ON public.vendor_media
    FOR ALL
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 4. Indexes for performance
CREATE INDEX idx_vendor_media_vendor_id ON public.vendor_media(vendor_id);
CREATE INDEX idx_vendor_media_vendor_active ON public.vendor_media(vendor_id, is_active);
CREATE INDEX idx_vendor_media_created_at ON public.vendor_media(created_at DESC);

-- 5. Timestamp trigger (update updated_at)
CREATE TRIGGER trig_vendor_media_update_timestamp
    BEFORE UPDATE ON public.vendor_media
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();