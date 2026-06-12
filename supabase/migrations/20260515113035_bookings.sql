-- Layer 3: booking requests between planners and vendors.

CREATE TABLE public.bookings (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key         uuid NOT NULL UNIQUE,

    vendor_id               uuid NOT NULL REFERENCES public.vendors (id) ON DELETE RESTRICT,
    customer_id             uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    thread_id               uuid REFERENCES public.threads (id) ON DELETE SET NULL,

    service_id              uuid REFERENCES public.services (id) ON DELETE RESTRICT,
    service_snapshot        jsonb NOT NULL,

    event_date              date NOT NULL,
    event_time_start        time,
    event_time_end          time,
    event_location          text,
    notes                   text,

    status                  text NOT NULL DEFAULT 'requested'
        CHECK (status IN (
            'requested',
            'quote_sent',
            'quote_accepted',
            'quote_declined',
            'quote_withdrawn',
            'accepted',
            'payment_pending',
            'paid',
            'completed',
            'declined',
            'cancelled',
            'expired',
            'refunded'
        )),

    decline_reason          text,
    declined_by             text CHECK (declined_by IN ('vendor', 'customer')),

    payment_link_expires_at timestamptz,

    event_completed_at      timestamptz,
    completed_at            timestamptz,
    payout_released_at      timestamptz,

    vendor_category_id      uuid REFERENCES public.categories (id) ON DELETE SET NULL,

    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.bookings IS 'Planner booking requests and lifecycle for vendor services.';
COMMENT ON COLUMN public.bookings.service_snapshot IS
    'JSON snapshot: name, price_cents, pricing_type, duration_minutes, description.';

CREATE INDEX idx_bookings_vendor_id ON public.bookings (vendor_id);
CREATE INDEX idx_bookings_customer_id ON public.bookings (customer_id);
CREATE INDEX idx_bookings_status ON public.bookings (status);
CREATE INDEX idx_bookings_event_date ON public.bookings (event_date);
CREATE INDEX idx_bookings_payment_pending_expires
    ON public.bookings (payment_link_expires_at)
    WHERE status = 'payment_pending';
CREATE INDEX idx_bookings_paid_event_date
    ON public.bookings (event_date)
    WHERE status = 'paid';

CREATE TRIGGER trig_bookings_update_timestamp
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can select own bookings"
    ON public.bookings FOR SELECT
    TO authenticated
    USING (customer_id = auth.uid());

CREATE POLICY "Customers can insert own bookings"
    ON public.bookings FOR INSERT
    TO authenticated
    WITH CHECK (
        customer_id = auth.uid()
        AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'customer'
    );

CREATE POLICY "Vendors can select own bookings"
    ON public.bookings FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.vendors v
            WHERE v.id = bookings.vendor_id
              AND v.user_id = auth.uid()
        )
    );

CREATE POLICY "Vendors can update own bookings"
    ON public.bookings FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.vendors v
            WHERE v.id = bookings.vendor_id
              AND v.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.vendors v
            WHERE v.id = bookings.vendor_id
              AND v.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins have full access to bookings"
    ON public.bookings FOR ALL
    TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
