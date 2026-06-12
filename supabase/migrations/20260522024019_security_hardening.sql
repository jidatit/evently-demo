
-- 1. vendor_signups: admin-only read, single insert policy
DROP POLICY IF EXISTS "Authenticated can read signups" ON public.vendor_signups;
DROP POLICY IF EXISTS "Allow public signups" ON public.vendor_signups;
DROP POLICY IF EXISTS "Anyone can sign up" ON public.vendor_signups;

CREATE POLICY "vendor_signups_public_insert"
ON public.vendor_signups FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "vendor_signups_admin_read"
ON public.vendor_signups FOR SELECT TO authenticated
USING (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin');

CREATE POLICY "vendor_signups_admin_all"
ON public.vendor_signups FOR ALL TO authenticated
USING (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin')
WITH CHECK (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin');

-- 2. message-attachments storage: only uploader (folder owner) can read
DROP POLICY IF EXISTS "Users can read own message attachments" ON storage.objects;
CREATE POLICY "Users can read own message attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'message-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. vendor-media storage: write only inside own uid folder
DROP POLICY IF EXISTS "Vendors can upload their own media" ON storage.objects;
DROP POLICY IF EXISTS "Vendors can update their own media" ON storage.objects;
DROP POLICY IF EXISTS "Vendors can delete their own media" ON storage.objects;

CREATE POLICY "Vendors can upload their own media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'vendor-media'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Vendors can update their own media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'vendor-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'vendor-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Vendors can delete their own media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'vendor-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. bookings: trigger to restrict vendor-side column changes
CREATE OR REPLACE FUNCTION public.fn_bookings_vendor_update_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin');
  is_vendor boolean;
BEGIN
  IF is_admin THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = OLD.vendor_id AND v.user_id = auth.uid()
  ) INTO is_vendor;

  IF is_vendor THEN
    IF NEW.customer_id IS DISTINCT FROM OLD.customer_id
       OR NEW.vendor_id IS DISTINCT FROM OLD.vendor_id
       OR NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key
       OR NEW.service_id IS DISTINCT FROM OLD.service_id
       OR NEW.service_snapshot::text IS DISTINCT FROM OLD.service_snapshot::text
       OR NEW.event_date IS DISTINCT FROM OLD.event_date
       OR NEW.event_end_date IS DISTINCT FROM OLD.event_end_date
       OR NEW.event_time_start IS DISTINCT FROM OLD.event_time_start
       OR NEW.event_time_end IS DISTINCT FROM OLD.event_time_end
       OR NEW.event_location IS DISTINCT FROM OLD.event_location
       OR NEW.payment_link_expires_at IS DISTINCT FROM OLD.payment_link_expires_at
       OR NEW.payout_released_at IS DISTINCT FROM OLD.payout_released_at THEN
      RAISE EXCEPTION 'Vendors cannot modify protected booking fields';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_vendor_update_guard ON public.bookings;
CREATE TRIGGER bookings_vendor_update_guard
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.fn_bookings_vendor_update_guard();

-- 5. Remove insecure user_metadata role checks (still scoped to auth.uid())
DROP POLICY IF EXISTS "Customers can insert own bookings" ON public.bookings;
CREATE POLICY "Customers can insert own bookings"
ON public.bookings FOR INSERT TO authenticated
WITH CHECK (
  customer_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = bookings.vendor_id AND v.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Customers can insert threads" ON public.threads;
CREATE POLICY "Customers can insert threads"
ON public.threads FOR INSERT TO authenticated
WITH CHECK (
  customer_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = threads.vendor_id AND v.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Customers can insert own favorites" ON public.vendor_favorites;
CREATE POLICY "Customers can insert own favorites"
ON public.vendor_favorites FOR INSERT TO authenticated
WITH CHECK (customer_id = auth.uid());

-- 6. Pin search_path on public helper functions
ALTER FUNCTION public.create_profile_on_signup() SET search_path = public;
ALTER FUNCTION public.update_timestamp() SET search_path = public;
ALTER FUNCTION public.touch_thread_updated_at_on_message() SET search_path = public;
ALTER FUNCTION public.fetch_vendors_rpc(text, text, text, text, uuid, numeric, numeric, integer, integer) SET search_path = public;
ALTER FUNCTION public.fetch_vendors_rpc_v2(text, text, text, text, uuid, numeric, numeric, integer, integer) SET search_path = public;
;