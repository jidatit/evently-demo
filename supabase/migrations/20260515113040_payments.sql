-- Layer 3: Stripe payment records per booking (service role writes via edge functions).

CREATE TABLE public.payments (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id                  uuid NOT NULL UNIQUE REFERENCES public.bookings (id) ON DELETE RESTRICT,

    stripe_payment_intent_id    text UNIQUE,
    stripe_checkout_session_id  text UNIQUE,
    stripe_transfer_id          text,
    stripe_refund_id            text,

    checkout_url                text,

    amount_total_cents          integer NOT NULL,
    amount_platform_fee_cents   integer NOT NULL,
    amount_vendor_payout_cents  integer NOT NULL,
    platform_fee_pct            numeric(5, 2) NOT NULL DEFAULT 12.00,
    currency                    text NOT NULL DEFAULT 'usd',

    status                      text NOT NULL DEFAULT 'pending'
        CHECK (status IN (
            'pending',
            'succeeded',
            'failed',
            'refunded',
            'disputed'
        )),

    paid_at                     timestamptz,
    refunded_at                 timestamptz,
    payout_released_at          timestamptz,
    created_at                  timestamptz NOT NULL DEFAULT now(),
    updated_at                  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.payments.checkout_url IS
    'Stripe Checkout session URL; set once on accept-booking.';

CREATE INDEX idx_payments_booking_id ON public.payments (booking_id);
CREATE INDEX idx_payments_stripe_payment_intent_id ON public.payments (stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON public.payments (status);

CREATE TRIGGER trig_payments_update_timestamp
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can select own payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.bookings b
            WHERE b.id = payments.booking_id
              AND b.customer_id = auth.uid()
        )
    );

CREATE POLICY "Vendors can select own payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.bookings b
            JOIN public.vendors v ON v.id = b.vendor_id
            WHERE b.id = payments.booking_id
              AND v.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins have full access to payments"
    ON public.payments FOR ALL
    TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
