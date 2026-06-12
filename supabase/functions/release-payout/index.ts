import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getAppBaseUrl } from "../_shared/app-url.ts";
import { enqueueEmailOutbox } from "../_shared/email-outbox.ts";
import { timingSafeEqual } from "../_shared/crypto.ts";
import { corsHeaders, errorMessage, jsonResponse } from "../_shared/http.ts";
import { createLogger } from "../_shared/logger.ts";
import { captureException, initSentry } from "../_shared/sentry.ts";
import { getStripe } from "../_shared/stripe-client.ts";
import {
  isEnvGuardError,
  requireSupabaseServiceEnv,
} from "../_shared/supabase-env.ts";

const cors = corsHeaders("x-cron-secret");
const log = createLogger("release-payout");
initSentry("release-payout");

function formatEventDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, cors);
  }

  log.info("function_called", { method: req.method });

  try {
    const expectedCronSecret = Deno.env.get("OUTBOX_CRON_SECRET") ?? "";
    if (!expectedCronSecret) {
      console.error("release-payout: OUTBOX_CRON_SECRET not set");
      return jsonResponse({ error: "Server misconfigured" }, 500, cors);
    }
    const providedCronSecret = req.headers.get("x-cron-secret") ?? "";
    if (!timingSafeEqual(providedCronSecret, expectedCronSecret)) {
      console.error("release-payout: invalid or missing X-Cron-Secret header");
      return jsonResponse({ error: "Unauthorized" }, 401, cors);
    }

    const envCheck = requireSupabaseServiceEnv(cors);
    if (isEnvGuardError(envCheck)) return envCheck.response;
    const { url: supabaseUrl, serviceRoleKey } = envCheck.env;

    let bodyJson: { bookingId?: string };
    try {
      bodyJson = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400, cors);
    }

    const bookingId = typeof bodyJson.bookingId === "string"
      ? bodyJson.bookingId.trim()
      : "";
    if (!bookingId || !UUID_RE.test(bookingId)) {
      return jsonResponse({ error: "bookingId is required" }, 400, cors);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: booking, error: bookingErr } = await admin
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingErr) {
      console.error("release-payout: failed to load booking", {
        bookingId,
        error: bookingErr,
      });
      return jsonResponse({ error: "Failed to load booking" }, 500, cors);
    }
    if (!booking) {
      return jsonResponse({ error: "Booking not found" }, 404, cors);
    }

    if (booking.status !== "completed") {
      console.error("release-payout: booking not completed", {
        bookingId,
        status: booking.status,
      });
      return jsonResponse(
        { error: "Booking must be completed before payout release" },
        400,
        cors,
      );
    }

    if (booking.payout_released_at) {
      return jsonResponse({ ok: true, alreadyReleased: true }, 200, cors);
    }

    const { data: payment, error: payErr } = await admin
      .from("payments")
      .select("*")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (payErr) {
      console.error("release-payout: failed to load payment", {
        bookingId,
        error: payErr,
      });
      return jsonResponse({ error: "Failed to load payment" }, 500, cors);
    }
    if (!payment) {
      return jsonResponse({ error: "Payment not found" }, 404, cors);
    }

    if (payment.status !== "succeeded") {
      console.error("release-payout: payment not succeeded", {
        bookingId,
        status: payment.status,
      });
      return jsonResponse(
        { error: "Payment must be succeeded to release payout" },
        400,
        cors,
      );
    }

    if (payment.payout_released_at || payment.stripe_transfer_id) {
      return jsonResponse({ ok: true, alreadyReleased: true }, 200, cors);
    }

    const payoutCents = Number(payment.amount_vendor_payout_cents ?? 0);
    if (payoutCents <= 0) {
      console.error("release-payout: zero payout amount", {
        bookingId,
        payoutCents,
      });
      return jsonResponse(
        { error: "No vendor payout amount for this booking" },
        400,
        cors,
      );
    }

    const { data: stripeRow, error: stripeErr } = await admin
      .from("vendor_stripe_accounts")
      .select("stripe_account_id, payouts_enabled")
      .eq("vendor_id", booking.vendor_id as string)
      .maybeSingle();

    if (stripeErr || !stripeRow?.stripe_account_id) {
      console.error("release-payout: vendor stripe account missing", {
        vendorId: booking.vendor_id,
        error: stripeErr,
      });
      return jsonResponse(
        { error: "Vendor Stripe account not found" },
        404,
        cors,
      );
    }

    if (!stripeRow.payouts_enabled) {
      console.error("release-payout: payouts not enabled on stripe", {
        vendorId: booking.vendor_id,
      });
      return jsonResponse(
        { error: "Vendor payouts are not enabled on Stripe" },
        400,
        cors,
      );
    }

    const stripeAccountId = String(stripeRow.stripe_account_id);
    const stripe = getStripe();

    let transferId: string;
    try {
      const transfer = await stripe.transfers.create(
        {
          amount: payoutCents,
          currency: "usd",
          destination: stripeAccountId,
          transfer_group: bookingId,
          metadata: { booking_id: bookingId },
        },
        { idempotencyKey: `payout:${bookingId}` },
      );
      transferId = transfer.id;
      log.info("stripe_transfer_created", { bookingId, transferId });
    } catch (e: unknown) {
      log.error("stripe_transfer_failed", {
        bookingId,
        errorMessage: e instanceof Error ? e.message : String(e),
        errorStack: e instanceof Error ? e.stack : undefined,
      });
      captureException(e, { bookingId });
      console.error("release-payout: Stripe transfer failed", {
        bookingId,
        error: e,
      });
      return jsonResponse(
        { error: errorMessage(e) },
        502,
        cors,
      );
    }

    const nowIso = new Date().toISOString();

    const { error: payUpErr } = await admin
      .from("payments")
      .update({
        stripe_transfer_id: transferId,
        payout_released_at: nowIso,
      })
      .eq("id", payment.id);

    if (payUpErr) {
      log.error("payout_payment_update_failed", {
        bookingId,
        paymentId: payment.id,
        errorMessage: payUpErr.message,
      });
      captureException(payUpErr, { bookingId, paymentId: payment.id });
      console.error("release-payout: failed to record payout on payment", {
        bookingId,
        paymentId: payment.id,
        error: payUpErr,
      });
      return jsonResponse(
        { error: "Failed to record payout on payment" },
        500,
        cors,
      );
    }

    const { error: bookUpErr } = await admin
      .from("bookings")
      .update({ payout_released_at: nowIso })
      .eq("id", bookingId);

    if (bookUpErr) {
      log.error("payout_booking_update_failed", {
        bookingId,
        errorMessage: bookUpErr.message,
      });
      captureException(bookUpErr, { bookingId });
      console.error("release-payout: failed to record payout on booking", {
        bookingId,
        error: bookUpErr,
      });
      return jsonResponse(
        { error: "Failed to record payout on booking" },
        500,
        cors,
      );
    }

    log.info("payout_released", { bookingId, transferId });

    const { data: vendor } = await admin
      .from("vendors")
      .select("business_name, contact_email")
      .eq("id", booking.vendor_id as string)
      .maybeSingle();

    const vendorEmail = String(vendor?.contact_email ?? "").trim();
    const snap = booking.service_snapshot as { name?: string };
    const serviceName = String(snap?.name ?? "Service");
    const baseUrl = getAppBaseUrl(req);
    const stripeDashboardUrl = "https://dashboard.stripe.com/connect/accounts/" +
      encodeURIComponent(stripeAccountId);

    if (vendorEmail) {
      try {
        await enqueueEmailOutbox(admin, {
          template: "payout_released",
          idempotencyKey: `payout_released:${bookingId}`,
          payload: {
            to: vendorEmail,
            vendorBusinessName: String(vendor?.business_name ?? "").trim() ||
              "Vendor",
            serviceName,
            eventDate: formatEventDate(String(booking.event_date)),
            payoutAmount: formatCents(payoutCents),
            dashboardUrl: `${baseUrl}/vendor-dashboard?tab=bookings`,
            stripeDashboardUrl,
          },
        });
      } catch (e) {
        console.error("release-payout: email_outbox enqueue failed", {
          bookingId,
          error: e,
        });
      }
    }

    return jsonResponse({ ok: true, transferId }, 200, cors);
  } catch (e: unknown) {
    log.error("unhandled_exception", {
      errorMessage: e instanceof Error ? e.message : String(e),
      errorStack: e instanceof Error ? e.stack : undefined,
    });
    captureException(e);
    console.error("release-payout: unexpected error", e);
    return jsonResponse({ error: errorMessage(e) }, 500, cors);
  }
});
