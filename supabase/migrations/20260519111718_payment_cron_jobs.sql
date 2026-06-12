-- Layer 6: pg_cron jobs for payment link expiry and booking auto-complete.
-- Reads Supabase Vault secrets (provision in Studio → Vault): project_url, service_role_key, web_base_url.
-- See project plan "Secrets to provision" — never commit secret values.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- Expire payment_pending bookings whose link expired; history + email_outbox.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_expire_payment_links()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_web_base_url text;
  r                record;
BEGIN
  SELECT ds.decrypted_secret INTO v_web_base_url
  FROM vault.decrypted_secrets ds
  WHERE ds.name = 'web_base_url';

  IF v_web_base_url IS NULL OR btrim(v_web_base_url) = '' THEN
    RAISE WARNING 'fn_expire_payment_links: vault secret web_base_url missing; dashboard links in emails will be empty';
    v_web_base_url := '';
  ELSE
    v_web_base_url := rtrim(v_web_base_url, '/');
  END IF;

  FOR r IN
    SELECT
      b.id,
      b.customer_id,
      b.vendor_id,
      b.event_date,
      b.service_snapshot,
      prof.email AS customer_email,
      prof.name AS customer_name,
      v.business_name,
      v.contact_email AS vendor_email
    FROM public.bookings b
    JOIN public.profiles prof ON prof.id = b.customer_id
    JOIN public.vendors v ON v.id = b.vendor_id
    WHERE b.status = 'payment_pending'
      AND b.payment_link_expires_at IS NOT NULL
      AND b.payment_link_expires_at < now()
  LOOP
    UPDATE public.bookings
    SET status = 'expired', updated_at = now()
    WHERE id = r.id;

    INSERT INTO public.booking_status_history (
      booking_id, from_status, to_status, changed_by, actor_type, reason
    ) VALUES (
      r.id, 'payment_pending', 'expired', NULL, 'system', NULL
    );

    INSERT INTO public.email_outbox (
      template, idempotency_key, payload, status, attempts, max_attempts, next_attempt_at
    ) VALUES (
      'payment_link_expired_planner',
      'expired_planner:' || r.id::text,
      jsonb_build_object(
        'to', r.customer_email,
        'plannerName', coalesce(nullif(trim(r.customer_name), ''), split_part(r.customer_email, '@', 1)),
        'vendorBusinessName', coalesce(nullif(trim(r.business_name), ''), 'Vendor'),
        'serviceName', coalesce(r.service_snapshot->>'name', 'Service'),
        'eventDate', r.event_date::text,
        'dashboardUrl', v_web_base_url || '/dashboard?tab=bookings'
      ),
      'pending', 0, 5, now()
    )
    ON CONFLICT (idempotency_key) DO NOTHING;

    INSERT INTO public.email_outbox (
      template, idempotency_key, payload, status, attempts, max_attempts, next_attempt_at
    ) VALUES (
      'payment_link_expired_vendor',
      'expired_vendor:' || r.id::text,
      jsonb_build_object(
        'to', r.vendor_email,
        'vendorBusinessName', coalesce(nullif(trim(r.business_name), ''), 'Vendor'),
        'plannerName', coalesce(nullif(trim(r.customer_name), ''), split_part(r.customer_email, '@', 1)),
        'serviceName', coalesce(r.service_snapshot->>'name', 'Service'),
        'eventDate', r.event_date::text,
        'dashboardUrl', v_web_base_url || '/vendor-dashboard?tab=bookings'
      ),
      'pending', 0, 5, now()
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.fn_expire_payment_links() IS
  'Cron: expire payment_pending bookings; insert history and email_outbox. Requires vault.web_base_url.';

-- ---------------------------------------------------------------------------
-- Auto-complete paid bookings 48h after event_date; call release-payout via pg_net.
-- Layer 7: uncomment booking_claims guard when table exists.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_auto_complete_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_url    text;
  v_service_role   text;
  v_web_base_url   text;
  r                record;
BEGIN
  SELECT ds.decrypted_secret INTO v_project_url
  FROM vault.decrypted_secrets ds
  WHERE ds.name = 'project_url';

  SELECT ds.decrypted_secret INTO v_service_role
  FROM vault.decrypted_secrets ds
  WHERE ds.name = 'service_role_key';

  SELECT ds.decrypted_secret INTO v_web_base_url
  FROM vault.decrypted_secrets ds
  WHERE ds.name = 'web_base_url';

  IF v_web_base_url IS NULL OR btrim(v_web_base_url) = '' THEN
    RAISE WARNING 'fn_auto_complete_bookings: vault secret web_base_url missing; completion email links may be empty';
    v_web_base_url := '';
  ELSE
    v_web_base_url := rtrim(v_web_base_url, '/');
  END IF;

  IF v_project_url IS NULL OR btrim(v_project_url) = ''
     OR v_service_role IS NULL OR btrim(v_service_role) = '' THEN
    RAISE WARNING 'fn_auto_complete_bookings: vault project_url or service_role_key missing; will skip net.http_post to release-payout';
  ELSE
    v_project_url := rtrim(v_project_url, '/');
  END IF;

  FOR r IN
    SELECT
      b.id,
      b.customer_id,
      b.vendor_id,
      b.event_date,
      b.service_snapshot,
      prof.email AS customer_email,
      prof.name AS customer_name,
      v.business_name,
      v.contact_email AS vendor_email
    FROM public.bookings b
    JOIN public.profiles prof ON prof.id = b.customer_id
    JOIN public.vendors v ON v.id = b.vendor_id
    WHERE b.status = 'paid'
      AND (b.event_date::timestamp + interval '48 hours') < now()
      -- AND NOT EXISTS (
      --   SELECT 1 FROM public.booking_claims bc
      --   WHERE bc.booking_id = b.id AND bc.status = 'under_review'
      -- )
  LOOP
    UPDATE public.bookings
    SET
      status = 'completed',
      completed_at = now(),
      event_completed_at = coalesce(event_completed_at, now()),
      updated_at = now()
    WHERE id = r.id
      AND status = 'paid';

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    INSERT INTO public.booking_status_history (
      booking_id, from_status, to_status, changed_by, actor_type, reason
    ) VALUES (
      r.id, 'paid', 'completed', NULL, 'system', NULL
    );

    INSERT INTO public.email_outbox (
      template, idempotency_key, payload, status, attempts, max_attempts, next_attempt_at
    ) VALUES (
      'booking_completed_planner',
      'booking_completed_planner:' || r.id::text,
      jsonb_build_object(
        'to', r.customer_email,
        'plannerName', coalesce(nullif(trim(r.customer_name), ''), split_part(r.customer_email, '@', 1)),
        'vendorBusinessName', coalesce(nullif(trim(r.business_name), ''), 'Vendor'),
        'serviceName', coalesce(r.service_snapshot->>'name', 'Service'),
        'eventDate', r.event_date::text,
        'dashboardUrl', v_web_base_url || '/dashboard?tab=bookings'
      ),
      'pending', 0, 5, now()
    )
    ON CONFLICT (idempotency_key) DO NOTHING;

    INSERT INTO public.email_outbox (
      template, idempotency_key, payload, status, attempts, max_attempts, next_attempt_at
    ) VALUES (
      'booking_completed_vendor',
      'booking_completed_vendor:' || r.id::text,
      jsonb_build_object(
        'to', r.vendor_email,
        'vendorBusinessName', coalesce(nullif(trim(r.business_name), ''), 'Vendor'),
        'plannerName', coalesce(nullif(trim(r.customer_name), ''), split_part(r.customer_email, '@', 1)),
        'serviceName', coalesce(r.service_snapshot->>'name', 'Service'),
        'eventDate', r.event_date::text,
        'dashboardUrl', v_web_base_url || '/vendor-dashboard?tab=bookings'
      ),
      'pending', 0, 5, now()
    )
    ON CONFLICT (idempotency_key) DO NOTHING;

    IF v_project_url IS NOT NULL AND btrim(v_project_url) <> ''
       AND v_service_role IS NOT NULL AND btrim(v_service_role) <> '' THEN
      PERFORM net.http_post(
        url := v_project_url || '/functions/v1/release-payout',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_role
        ),
        body := jsonb_build_object('bookingId', r.id::text)
      );
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.fn_auto_complete_bookings() IS
  'Cron: complete paid bookings 48h after event_date; enqueue completion emails; POST release-payout. Vault: project_url, service_role_key, web_base_url.';

GRANT EXECUTE ON FUNCTION public.fn_expire_payment_links() TO postgres;
GRANT EXECUTE ON FUNCTION public.fn_auto_complete_bookings() TO postgres;

-- Idempotent cron registration
DO $$
DECLARE
  jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'expire-payment-links';
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;
END $$;

SELECT cron.schedule(
  'expire-payment-links',
  '*/15 * * * *',
  $$SELECT public.fn_expire_payment_links();$$
);

DO $$
DECLARE
  jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'auto-complete-bookings';
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;
END $$;

SELECT cron.schedule(
  'auto-complete-bookings',
  '0 * * * *',
  $$SELECT public.fn_auto_complete_bookings();$$
);
