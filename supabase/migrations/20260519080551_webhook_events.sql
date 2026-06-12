-- Layer 5: Stripe webhook idempotency audit log (service role writes via stripe-webhook).

CREATE TABLE public.webhook_events (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id     text NOT NULL UNIQUE,
    event_type          text NOT NULL,
    payload             jsonb NOT NULL,
    booking_id          uuid REFERENCES public.bookings (id) ON DELETE SET NULL,
    processing_status   text NOT NULL DEFAULT 'received'
        CHECK (processing_status IN (
            'received',
            'processed',
            'failed',
            'ignored'
        )),
    error_message       text,
    received_at         timestamptz NOT NULL DEFAULT now(),
    processed_at        timestamptz
);

COMMENT ON TABLE public.webhook_events IS
    'Append-only log of Stripe webhook events for idempotency and replay/debug.';

CREATE INDEX idx_webhook_events_event_type ON public.webhook_events (event_type);
CREATE INDEX idx_webhook_events_booking_id ON public.webhook_events (booking_id);
CREATE INDEX idx_webhook_events_processing_pending
    ON public.webhook_events (processing_status)
    WHERE processing_status IN ('received', 'failed');

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: edge functions use service_role (bypasses RLS).

CREATE POLICY "Admins have full access to webhook_events"
    ON public.webhook_events FOR ALL
    TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Public checkout success page: limited booking status by Stripe session id.
CREATE OR REPLACE FUNCTION public.get_checkout_booking_status(p_session_id text)
RETURNS TABLE (
    booking_id uuid,
    booking_status text,
    vendor_name text,
    service_name text,
    event_date text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        b.id AS booking_id,
        b.status::text AS booking_status,
        COALESCE(NULLIF(trim(v.business_name), ''), 'Vendor') AS vendor_name,
        COALESCE(
            NULLIF(trim(b.service_snapshot ->> 'name'), ''),
            'Booking'
        ) AS service_name,
        b.event_date::text AS event_date
    FROM public.payments p
    JOIN public.bookings b ON b.id = p.booking_id
    JOIN public.vendors v ON v.id = b.vendor_id
    WHERE p.stripe_checkout_session_id = p_session_id
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_checkout_booking_status(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_checkout_booking_status(text) TO anon, authenticated;

COMMENT ON FUNCTION public.get_checkout_booking_status(text) IS
    'Returns minimal booking status for Stripe Checkout success redirect (no PII).';
