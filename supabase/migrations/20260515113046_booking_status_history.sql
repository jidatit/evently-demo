-- Layer 3: explicit booking status audit trail (inserted by edge functions only).

CREATE TABLE public.booking_status_history (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      uuid NOT NULL REFERENCES public.bookings (id) ON DELETE CASCADE,
    from_status     text,
    to_status       text NOT NULL,
    changed_by      uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    actor_type      text NOT NULL CHECK (actor_type IN ('customer', 'vendor', 'system', 'admin')),
    reason          text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_status_history_booking_id
    ON public.booking_status_history (booking_id);
CREATE INDEX idx_booking_status_history_created_at
    ON public.booking_status_history (created_at DESC);

ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can select own booking status history"
    ON public.booking_status_history FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.bookings b
            WHERE b.id = booking_status_history.booking_id
              AND b.customer_id = auth.uid()
        )
    );

CREATE POLICY "Vendors can select own booking status history"
    ON public.booking_status_history FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.bookings b
            JOIN public.vendors v ON v.id = b.vendor_id
            WHERE b.id = booking_status_history.booking_id
              AND v.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins have full access to booking status history"
    ON public.booking_status_history FOR ALL
    TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
