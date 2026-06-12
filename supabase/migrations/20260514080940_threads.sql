-- Pre-booking chat: conversation threads between customers and vendors.

CREATE TABLE public.threads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id uuid NOT NULL REFERENCES public.vendors (id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    booking_id uuid,
    status text NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'closed')),
    last_notified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT threads_vendor_customer_unique UNIQUE (vendor_id, customer_id)
);

COMMENT ON COLUMN public.threads.booking_id IS 'FK to bookings(id) added in Layer 3 migration.';

CREATE INDEX idx_threads_vendor_id ON public.threads (vendor_id);
CREATE INDEX idx_threads_customer_id ON public.threads (customer_id);
CREATE INDEX idx_threads_updated_at ON public.threads (updated_at DESC);

CREATE TRIGGER trig_threads_update_timestamp
    BEFORE UPDATE ON public.threads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can select own threads"
    ON public.threads FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.vendors v
            WHERE v.id = threads.vendor_id
              AND v.user_id = auth.uid()
        )
    );

CREATE POLICY "Customers can select own threads"
    ON public.threads FOR SELECT
    TO authenticated
    USING (customer_id = auth.uid());

CREATE POLICY "Customers can insert threads"
    ON public.threads FOR INSERT
    TO authenticated
    WITH CHECK (
        customer_id = auth.uid()
        AND (
            (auth.jwt() -> 'user_metadata' ->> 'role') IS NULL
            OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'customer'
        )
    );

CREATE POLICY "Admins have full access to threads"
    ON public.threads FOR ALL
    TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

COMMENT ON TABLE public.threads IS 'Planner–vendor message threads; booking_id linked in Layer 3.';
