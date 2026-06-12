-- Transactional email outbox: enqueue from Edge (service role); drain via process-email-outbox.

CREATE TABLE public.email_outbox (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template text NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    idempotency_key text NOT NULL,
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'dead')),
    attempts integer NOT NULL DEFAULT 0,
    max_attempts integer NOT NULL DEFAULT 5,
    next_attempt_at timestamptz NOT NULL DEFAULT now(),
    last_error text,
    sent_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT email_outbox_idempotency_key_unique UNIQUE (idempotency_key)
);

CREATE INDEX idx_email_outbox_pending_due
    ON public.email_outbox (next_attempt_at ASC, created_at ASC)
    WHERE status = 'pending';

COMMENT ON TABLE public.email_outbox IS
    'Transactional outbox for outbound email; processed by process-email-outbox Edge Function.';
COMMENT ON COLUMN public.email_outbox.idempotency_key IS
    'Dedupes enqueue (e.g. payouts_live:vendor:{uuid}).';
COMMENT ON COLUMN public.email_outbox.payload IS
    'Template-specific JSON; worker renders HTML and sends via Resend.';

CREATE TRIGGER trig_email_outbox_update_timestamp
    BEFORE UPDATE ON public.email_outbox
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;

-- No policies: anon/authenticated cannot read or insert; service_role bypasses RLS.

CREATE OR REPLACE FUNCTION public.claim_email_outbox_batch(p_limit integer DEFAULT 25)
RETURNS SETOF public.email_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH cte AS (
        SELECT id
        FROM public.email_outbox
        WHERE status = 'pending'
          AND next_attempt_at <= now()
        ORDER BY created_at ASC
        LIMIT p_limit
        FOR UPDATE SKIP LOCKED
    )
    UPDATE public.email_outbox e
    SET status = 'sending', updated_at = now()
    FROM cte
    WHERE e.id = cte.id
    RETURNING e.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_email_outbox_batch(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_email_outbox_batch(integer) TO service_role;

COMMENT ON FUNCTION public.claim_email_outbox_batch(integer) IS
    'Atomically claims pending outbox rows for the worker; service_role only.';
