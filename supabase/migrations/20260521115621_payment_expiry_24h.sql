-- Redefine fn_auto_complete_bookings: use outbox_cron_secret + X-Cron-Secret for release-payout.
-- Does not touch fn_expire_payment_links or cron schedule registration.

CREATE OR REPLACE FUNCTION public.fn_auto_complete_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_url    text;
  v_cron_secret    text;
  v_web_base_url   text;
  r                record;
BEGIN
  SELECT ds.decrypted_secret INTO v_project_url
  FROM vault.decrypted_secrets ds
  WHERE ds.name = 'project_url';

  SELECT ds.decrypted_secret INTO v_cron_secret
  FROM vault.decrypted_secrets ds
  WHERE ds.name = 'outbox_cron_secret';

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
     OR v_cron_secret IS NULL OR btrim(v_cron_secret) = '' THEN
    RAISE WARNING 'fn_auto_complete_bookings: vault project_url or outbox_cron_secret missing; will skip net.http_post to release-payout';
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
       AND v_cron_secret IS NOT NULL AND btrim(v_cron_secret) <> '' THEN
      PERFORM net.http_post(
        url := v_project_url || '/functions/v1/release-payout',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-Cron-Secret', v_cron_secret
        ),
        body := jsonb_build_object('bookingId', r.id::text)
      );
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.fn_auto_complete_bookings() IS
  'Cron: complete paid bookings 48h after event_date; enqueue completion emails; POST release-payout. Vault: project_url, outbox_cron_secret, web_base_url.';

GRANT EXECUTE ON FUNCTION public.fn_auto_complete_bookings() TO postgres;
