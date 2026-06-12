-- Migration: Add service_id column to vendor_media for per-service media support
-- Timestamp: 202512280930

-- 1. Add the new column (nullable, since existing rows are vendor-level)
ALTER TABLE public.vendor_media
ADD COLUMN service_id uuid REFERENCES public.services(id) ON DELETE SET NULL;

-- 2. Add index for fast per-service queries
CREATE INDEX idx_vendor_media_service_id 
    ON public.vendor_media (service_id);

-- 3. (Optional) Add comment for clarity
COMMENT ON COLUMN public.vendor_media.service_id 
    IS 'Optional reference to a specific service this media belongs to. NULL means general vendor-level media.';

-- 4. (Optional) Update RLS if needed — but existing policies already cover this via vendor ownership
-- No change required here, as vendor_id still controls access

-- 5. Log completion (for your reference)
DO $$ 
BEGIN
    RAISE NOTICE 'Added service_id column to vendor_media successfully.';
END $$;