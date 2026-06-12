-- Messages inside a thread; insert bumps threads.updated_at for list ordering.

CREATE TABLE public.thread_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id uuid NOT NULL REFERENCES public.threads (id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    type text NOT NULL DEFAULT 'message'
        CHECK (type IN ('message', 'quote')),
    body text NOT NULL,
    quote_price_cents integer,
    quote_notes text,
    quote_status text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT thread_messages_quote_status_check CHECK (
        quote_status IS NULL
        OR quote_status IN ('pending', 'accepted', 'declined', 'withdrawn')
    )
);

CREATE INDEX idx_thread_messages_thread_id_created
    ON public.thread_messages (thread_id, created_at DESC);

CREATE UNIQUE INDEX idx_one_pending_quote_per_thread
    ON public.thread_messages (thread_id)
    WHERE type = 'quote' AND quote_status = 'pending';

CREATE OR REPLACE FUNCTION public.touch_thread_updated_at_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.threads
    SET updated_at = now()
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trig_thread_messages_touch_thread
    AFTER INSERT ON public.thread_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_thread_updated_at_on_message();

ALTER TABLE public.thread_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can select thread messages"
    ON public.thread_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.threads t
            WHERE t.id = thread_messages.thread_id
              AND (
                  t.customer_id = auth.uid()
                  OR EXISTS (
                      SELECT 1
                      FROM public.vendors v
                      WHERE v.id = t.vendor_id
                        AND v.user_id = auth.uid()
                  )
              )
        )
    );

CREATE POLICY "Participants can insert thread messages"
    ON public.thread_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM public.threads t
            WHERE t.id = thread_messages.thread_id
              AND (
                  t.customer_id = auth.uid()
                  OR EXISTS (
                      SELECT 1
                      FROM public.vendors v
                      WHERE v.id = t.vendor_id
                        AND v.user_id = auth.uid()
                  )
              )
        )
    );

CREATE POLICY "Admins have full access to thread_messages"
    ON public.thread_messages FOR ALL
    TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

COMMENT ON TABLE public.thread_messages IS 'Chat and future quote rows for a thread.';
