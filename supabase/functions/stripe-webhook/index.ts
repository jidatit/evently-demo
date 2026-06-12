import type Stripe from "https://esm.sh/stripe@14.21.0";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getAppBaseUrl } from "../_shared/app-url.ts";
import {
  enqueueEmailOutbox,
  maybeEnqueuePayoutsLiveEmail,
} from "../_shared/email-outbox.ts";
import { corsHeaders, errorMessage, jsonResponse } from "../_shared/http.ts";
import { createLogger } from "../_shared/logger.ts";
import { captureException, initSentry } from "../_shared/sentry.ts";
import { getStripe } from "../_shared/stripe-client.ts";
import { stripeAccountNeedsAction } from "../_shared/stripe-account.ts";
import {
  isEnvGuardError,
  requireSupabaseServiceEnv,
} from "../_shared/supabase-env.ts";

const cors = corsHeaders("stripe-signature");
const log = createLogger("stripe-webhook");
initSentry("stripe-webhook");

type ServiceSnapshot = {
  name?: string;
  total_price_cents?: number;
  price_cents?: number;
};

type PaymentRow = {
  id: string;
  booking_id: string;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  checkout_url: string | null;
  status: string;
  amount_total_cents: number;
  amount_vendor_payout_cents: number;
};

type BookingRow = {
  id: string;
  status: string;
  customer_id: string;
  vendor_id: string;
  event_date: string;
  payment_link_expires_at: string | null;
  service_snapshot: ServiceSnapshot;
};

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

function formatExpiresAt(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

function displayNameFromProfile(
  row: { name: string | null; email: string | null } | null,
  fallbackEmail?: string | null,
): string {
  const n = row?.name?.trim();
  if (n) return n;
  const e = row?.email?.trim() || fallbackEmail?.trim();
  if (e) return e.split("@")[0] || e;
  return "Someone";
}

async function recordWebhookEvent(
  admin: SupabaseClient,
  event: Stripe.Event,
): Promise<
  | { isNew: false }
  | { isNew: true; webhookRowId: string }
> {
  const { data, error } = await admin
    .from("webhook_events")
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event as unknown as Record<string, unknown>,
      processing_status: "received",
    })
    .select("id")
    .maybeSingle();

  if (error?.code === "23505") {
    return { isNew: false };
  }
  if (error) {
    throw new Error(`webhook_events insert: ${error.message}`);
  }
  if (!data?.id) {
    throw new Error("webhook_events insert returned no row");
  }
  return { isNew: true, webhookRowId: data.id as string };
}

async function markWebhookProcessed(
  admin: SupabaseClient,
  webhookRowId: string,
  bookingId?: string | null,
): Promise<void> {
  const patch: Record<string, unknown> = {
    processing_status: "processed",
    processed_at: new Date().toISOString(),
    error_message: null,
  };
  if (bookingId) patch.booking_id = bookingId;
  const { error } = await admin
    .from("webhook_events")
    .update(patch)
    .eq("id", webhookRowId);
  if (error) {
    console.error("markWebhookProcessed:", error.message);
  }
}

async function markWebhookFailed(
  admin: SupabaseClient,
  webhookRowId: string,
  message: string,
  bookingId?: string | null,
): Promise<void> {
  const patch: Record<string, unknown> = {
    processing_status: "failed",
    processed_at: new Date().toISOString(),
    error_message: message.slice(0, 2000),
  };
  if (bookingId) patch.booking_id = bookingId;
  const { error } = await admin
    .from("webhook_events")
    .update(patch)
    .eq("id", webhookRowId);
  if (error) {
    console.error("markWebhookFailed:", error.message);
  }
}

async function markWebhookIgnored(
  admin: SupabaseClient,
  webhookRowId: string,
  bookingId?: string | null,
): Promise<void> {
  const patch: Record<string, unknown> = {
    processing_status: "ignored",
    processed_at: new Date().toISOString(),
  };
  if (bookingId) patch.booking_id = bookingId;
  const { error } = await admin
    .from("webhook_events")
    .update(patch)
    .eq("id", webhookRowId);
  if (error) {
    console.error("markWebhookIgnored:", error.message);
  }
}

async function findPayment(
  admin: SupabaseClient,
  stripePaymentIntentId: string,
  bookingIdFromMetadata?: string | null,
): Promise<PaymentRow | null> {
  const { data: byPi } = await admin
    .from("payments")
    .select(
      "id, booking_id, stripe_payment_intent_id, stripe_checkout_session_id, checkout_url, status, amount_total_cents, amount_vendor_payout_cents",
    )
    .eq("stripe_payment_intent_id", stripePaymentIntentId)
    .maybeSingle();

  if (byPi) return byPi as PaymentRow;

  const bookingId = bookingIdFromMetadata?.trim();
  if (!bookingId) return null;

  const { data: byBooking } = await admin
    .from("payments")
    .select(
      "id, booking_id, stripe_payment_intent_id, stripe_checkout_session_id, checkout_url, status, amount_total_cents, amount_vendor_payout_cents",
    )
    .eq("booking_id", bookingId)
    .maybeSingle();

  return (byBooking as PaymentRow | null) ?? null;
}

async function loadBookingContext(
  admin: SupabaseClient,
  bookingId: string,
): Promise<{
  booking: BookingRow;
  vendor: { business_name: string | null; contact_email: string | null };
  customerProfile: { name: string | null; email: string | null } | null;
} | null> {
  const { data: booking, error: bookingErr } = await admin
    .from("bookings")
    .select(
      "id, status, customer_id, vendor_id, event_date, payment_link_expires_at, service_snapshot",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingErr || !booking) return null;

  const { data: vendor } = await admin
    .from("vendors")
    .select("business_name, contact_email")
    .eq("id", booking.vendor_id as string)
    .maybeSingle();

  const { data: customerProfile } = await admin
    .from("profiles")
    .select("name, email")
    .eq("id", booking.customer_id as string)
    .maybeSingle();

  return {
    booking: booking as BookingRow,
    vendor: vendor ?? { business_name: null, contact_email: null },
    customerProfile: customerProfile ?? null,
  };
}

async function handleAccountUpdated(
  admin: SupabaseClient,
  event: Stripe.Event,
  webhookRowId: string,
  cors: Record<string, string>,
): Promise<Response> {
  const account = event.data.object as Stripe.Account;
  const stripeAccountId = account.id;

  const { data: stripeRow, error: findError } = await admin
    .from("vendor_stripe_accounts")
    .select("vendor_id, payouts_enabled, payouts_ever_enabled")
    .eq("stripe_account_id", stripeAccountId)
    .maybeSingle();

  if (findError || !stripeRow) {
    console.warn("No vendor_stripe_accounts for account", stripeAccountId);
    await markWebhookIgnored(admin, webhookRowId);
    return jsonResponse({ received: true }, 200, cors);
  }

  const chargesEnabled = !!account.charges_enabled;
  const payoutsEnabled = !!account.payouts_enabled;
  const onboardingComplete = !!account.details_submitted;
  const previousPayoutsEnabled = !!stripeRow.payouts_enabled;
  const stripeActionRequired = stripeAccountNeedsAction(account);

  const payoutsEverEnabled =
    !!(stripeRow.payouts_ever_enabled as boolean) || payoutsEnabled;

  const { error: updateError } = await admin
    .from("vendor_stripe_accounts")
    .update({
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      onboarding_complete: onboardingComplete,
      payouts_ever_enabled: payoutsEverEnabled,
      stripe_action_required: stripeActionRequired,
    })
    .eq("stripe_account_id", stripeAccountId);

  if (updateError) {
    console.error(updateError);
    return jsonResponse({ error: updateError.message }, 500, cors);
  }

  log.info("account_updated", {
    stripeAccountId,
    vendorId: stripeRow.vendor_id,
    payoutsEnabled,
  });

  const { data: vendor } = await admin
    .from("vendors")
    .select("contact_email")
    .eq("id", stripeRow.vendor_id)
    .maybeSingle();

  const dashboardUrl = `${getAppBaseUrl()}/vendor-dashboard`;
  try {
    await maybeEnqueuePayoutsLiveEmail(admin, {
      vendorId: stripeRow.vendor_id as string,
      to: vendor?.contact_email as string | null | undefined,
      dashboardUrl,
      previousPayoutsEnabled,
      nextPayoutsEnabled: payoutsEnabled,
    });
  } catch (e) {
    console.error("email_outbox enqueue failed:", e);
  }

  await markWebhookProcessed(admin, webhookRowId);
  log.info("event_processed", { eventType: "account.updated" });
  return jsonResponse({ received: true }, 200, cors);
}

async function handlePaymentIntentSucceeded(
  admin: SupabaseClient,
  event: Stripe.Event,
  webhookRowId: string,
): Promise<string | null> {
  const pi = event.data.object as Stripe.PaymentIntent;
  const piId = pi.id;
  const bookingIdFromMeta =
    typeof pi.metadata?.booking_id === "string"
      ? pi.metadata.booking_id
      : null;

  const payment = await findPayment(admin, piId, bookingIdFromMeta);
  if (!payment) {
    await markWebhookIgnored(admin, webhookRowId);
    return null;
  }

  const bookingId = payment.booking_id;
  const ctx = await loadBookingContext(admin, bookingId);
  if (!ctx) {
    await markWebhookIgnored(admin, webhookRowId, bookingId);
    return bookingId;
  }

  const { booking, vendor, customerProfile } = ctx;
  const snap = booking.service_snapshot;
  const serviceName = String(snap?.name ?? "Booking");
  const baseUrl = getAppBaseUrl();

  if (payment.status !== "succeeded") {
    const { error: payErr } = await admin
      .from("payments")
      .update({
        status: "succeeded",
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: piId,
      })
      .eq("id", payment.id);

    if (payErr) {
      throw new Error(`payments update: ${payErr.message}`);
    }

    if (booking.status !== "paid" && booking.status !== "refunded") {
      const { error: bookErr } = await admin
        .from("bookings")
        .update({ status: "paid" })
        .eq("id", bookingId);

      if (bookErr) {
        throw new Error(`bookings update: ${bookErr.message}`);
      }

      await admin.from("booking_status_history").insert({
        booking_id: bookingId,
        from_status: "payment_pending",
        to_status: "paid",
        changed_by: null,
        actor_type: "system",
      });

      const plannerEmail = String(customerProfile?.email ?? "").trim();
      const vendorEmail = String(vendor.contact_email ?? "").trim();
      const eventDate = formatEventDate(String(booking.event_date));
      const totalPaid = formatCents(payment.amount_total_cents);
      const vendorPayout = formatCents(payment.amount_vendor_payout_cents);
      const plannerName = displayNameFromProfile(
        customerProfile,
        plannerEmail,
      );
      const vendorBusinessName =
        String(vendor.business_name ?? "").trim() || "Vendor";

      if (plannerEmail) {
        await enqueueEmailOutbox(admin, {
          template: "payment_confirmed_planner",
          idempotencyKey: `payment_confirmed_planner:${bookingId}`,
          payload: {
            to: plannerEmail,
            plannerName,
            vendorBusinessName,
            serviceName,
            eventDate,
            totalPaid,
            dashboardUrl: `${baseUrl}/dashboard?tab=bookings`,
          },
        });
      }

      if (vendorEmail) {
        await enqueueEmailOutbox(admin, {
          template: "payment_confirmed_vendor",
          idempotencyKey: `payment_confirmed_vendor:${bookingId}`,
          payload: {
            to: vendorEmail,
            vendorBusinessName,
            plannerName,
            serviceName,
            eventDate,
            vendorPayout,
            dashboardUrl: `${baseUrl}/vendor-dashboard?tab=bookings`,
          },
        });
      }
    }
  }

  log.info("payment_succeeded", { bookingId });
  await markWebhookProcessed(admin, webhookRowId, bookingId);
  log.info("event_processed", { eventType: "payment_intent.succeeded", bookingId });
  return bookingId;
}

async function handlePaymentIntentPaymentFailed(
  admin: SupabaseClient,
  event: Stripe.Event,
  webhookRowId: string,
  stripe: Stripe,
): Promise<string | null> {
  const pi = event.data.object as Stripe.PaymentIntent;
  const piId = pi.id;
  const bookingIdFromMeta =
    typeof pi.metadata?.booking_id === "string"
      ? pi.metadata.booking_id
      : null;

  const payment = await findPayment(admin, piId, bookingIdFromMeta);
  if (!payment) {
    await markWebhookIgnored(admin, webhookRowId);
    return null;
  }

  const bookingId = payment.booking_id;
  const ctx = await loadBookingContext(admin, bookingId);
  if (!ctx) {
    await markWebhookIgnored(admin, webhookRowId, bookingId);
    return bookingId;
  }

  const { booking, vendor, customerProfile } = ctx;

  const { error: payErr } = await admin
    .from("payments")
    .update({
      status: "failed",
      stripe_payment_intent_id: piId,
    })
    .eq("id", payment.id);

  if (payErr) {
    throw new Error(`payments update: ${payErr.message}`);
  }

  let retryUrl = payment.checkout_url ?? "";
  if (payment.stripe_checkout_session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        payment.stripe_checkout_session_id,
      );
      if (session.url) retryUrl = session.url;
    } catch (e) {
      console.error("checkout.sessions.retrieve failed:", e);
    }
  }

  const plannerEmail = String(customerProfile?.email ?? "").trim();
  if (plannerEmail && retryUrl) {
    const snap = booking.service_snapshot;
    const serviceName = String(snap?.name ?? "Booking");
    const baseUrl = getAppBaseUrl();
    const expiresAt = booking.payment_link_expires_at
      ? formatExpiresAt(booking.payment_link_expires_at)
      : "soon";

    await enqueueEmailOutbox(admin, {
      template: "payment_failed",
      idempotencyKey: `payment_failed:${bookingId}:${event.id}`,
      payload: {
        to: plannerEmail,
        plannerName: displayNameFromProfile(customerProfile, plannerEmail),
        vendorBusinessName:
          String(vendor.business_name ?? "").trim() || "Vendor",
        serviceName,
        eventDate: formatEventDate(String(booking.event_date)),
        retryUrl,
        expiresAt,
        dashboardUrl: `${baseUrl}/dashboard?tab=bookings`,
      },
    });
  }

  log.info("payment_failed", { bookingId });
  await markWebhookProcessed(admin, webhookRowId, bookingId);
  log.info("event_processed", {
    eventType: "payment_intent.payment_failed",
    bookingId,
  });
  return bookingId;
}

async function handleChargeRefunded(
  admin: SupabaseClient,
  event: Stripe.Event,
  webhookRowId: string,
): Promise<string | null> {
  const charge = event.data.object as Stripe.Charge;
  const piField = charge.payment_intent;
  const piId = typeof piField === "string"
    ? piField
    : piField?.id ?? null;

  if (!piId) {
    await markWebhookIgnored(admin, webhookRowId);
    return null;
  }

  const payment = await findPayment(admin, piId, null);
  if (!payment) {
    await markWebhookIgnored(admin, webhookRowId);
    return null;
  }

  const bookingId = payment.booking_id;
  const ctx = await loadBookingContext(admin, bookingId);
  if (!ctx) {
    await markWebhookIgnored(admin, webhookRowId, bookingId);
    return bookingId;
  }

  const { booking, vendor, customerProfile } = ctx;
  const snap = booking.service_snapshot;
  const serviceName = String(snap?.name ?? "Booking");
  const baseUrl = getAppBaseUrl();
  const eventDate = formatEventDate(String(booking.event_date));
  const refundId = charge.refunds?.data?.[0]?.id ?? null;
  const refundReason = charge.refunds?.data?.[0]?.reason ??
    (typeof charge.refunds?.data?.[0]?.metadata?.reason === "string"
      ? charge.refunds.data[0].metadata.reason
      : undefined);

  const alreadyRefunded = booking.status === "refunded";

  if (payment.status !== "refunded") {
    const { error: payErr } = await admin
      .from("payments")
      .update({
        status: "refunded",
        stripe_refund_id: refundId,
        refunded_at: new Date().toISOString(),
        stripe_payment_intent_id: piId,
      })
      .eq("id", payment.id);

    if (payErr) {
      throw new Error(`payments update: ${payErr.message}`);
    }
  }

  if (!alreadyRefunded) {
    const fromStatus = booking.status;
    const { error: bookErr } = await admin
      .from("bookings")
      .update({ status: "refunded" })
      .eq("id", bookingId);

    if (bookErr) {
      throw new Error(`bookings update: ${bookErr.message}`);
    }

    await admin.from("booking_status_history").insert({
      booking_id: bookingId,
      from_status: fromStatus,
      to_status: "refunded",
      changed_by: null,
      actor_type: "system",
    });

    const plannerEmail = String(customerProfile?.email ?? "").trim();
    const vendorEmail = String(vendor.contact_email ?? "").trim();
    const plannerName = displayNameFromProfile(
      customerProfile,
      plannerEmail,
    );
    const vendorBusinessName =
      String(vendor.business_name ?? "").trim() || "Vendor";
    const refundReasonStr = refundReason ? String(refundReason) : "";

    if (plannerEmail) {
      await enqueueEmailOutbox(admin, {
        template: "booking_refunded",
        idempotencyKey: `booking_refunded:planner:${bookingId}`,
        payload: {
          to: plannerEmail,
          recipientName: plannerName,
          serviceName,
          eventDate,
          refundReason: refundReasonStr,
          dashboardUrl: `${baseUrl}/dashboard?tab=bookings`,
        },
      });
    }

    if (vendorEmail) {
      await enqueueEmailOutbox(admin, {
        template: "booking_refunded",
        idempotencyKey: `booking_refunded:vendor:${bookingId}`,
        payload: {
          to: vendorEmail,
          recipientName: vendorBusinessName,
          serviceName,
          eventDate,
          refundReason: refundReasonStr,
          dashboardUrl: `${baseUrl}/vendor-dashboard?tab=bookings`,
        },
      });
    }
  }

  log.info("charge_refunded", { bookingId });
  await markWebhookProcessed(admin, webhookRowId, bookingId);
  log.info("event_processed", { eventType: "charge.refunded", bookingId });
  return bookingId;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, cors);
  }

  log.info("function_called", { method: req.method });

  const platformSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET_PLATFORM");
  const connectSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET_CONNECT");
  const webhookSecrets = [platformSecret, connectSecret].filter(
    (s): s is string => !!s && s.length > 0,
  );

  if (webhookSecrets.length === 0) {
    console.error(
      "Neither STRIPE_WEBHOOK_SECRET_PLATFORM nor STRIPE_WEBHOOK_SECRET_CONNECT is set",
    );
    return jsonResponse({ error: "Server misconfigured" }, 500, cors);
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return jsonResponse({ error: "Missing signature" }, 400, cors);
  }

  let event: Stripe.Event | null = null;
  let lastVerifyError: unknown = null;
  try {
    const body = await req.text();
    const stripe = getStripe();
    for (const secret of webhookSecrets) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, sig, secret);
        break;
      } catch (e) {
        lastVerifyError = e;
      }
    }
  } catch (e) {
    lastVerifyError = e;
  }

  if (!event) {
    log.warn("signature_verification_failed", {
      errorMessage: lastVerifyError instanceof Error
        ? lastVerifyError.message
        : String(lastVerifyError),
      secretsTried: webhookSecrets.length,
    });
    console.error("Webhook signature verification failed:", lastVerifyError);
    return jsonResponse({ error: "Invalid signature" }, 400, cors);
  }

  log.info("webhook_received", {
    stripeEventId: event.id,
    eventType: event.type,
  });

  const envCheck = requireSupabaseServiceEnv(cors);
  if (isEnvGuardError(envCheck)) return envCheck.response;
  const { url: supabaseUrl, serviceRoleKey: serviceKey } = envCheck.env;

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const stripe = getStripe();

  let recorded: { isNew: false } | { isNew: true; webhookRowId: string };
  try {
    recorded = await recordWebhookEvent(admin, event);
  } catch (e) {
    log.error("webhook_record_failed", {
      stripeEventId: event.id,
      eventType: event.type,
      errorMessage: e instanceof Error ? e.message : String(e),
      errorStack: e instanceof Error ? e.stack : undefined,
    });
    captureException(e, {
      stripeEventId: event.id,
      eventType: event.type,
    });
    console.error(e);
    return jsonResponse({ error: errorMessage(e) }, 500, cors);
  }

  if (!recorded.isNew) {
    log.info("duplicate_webhook_ignored", { stripeEventId: event.id });
    return jsonResponse({ received: true, duplicate: true }, 200, cors);
  }

  const webhookRowId = recorded.webhookRowId;

  if (event.type === "account.updated") {
    try {
      return await handleAccountUpdated(admin, event, webhookRowId, cors);
    } catch (e) {
      log.error("account_updated_failed", {
        stripeEventId: event.id,
        eventType: event.type,
        errorMessage: e instanceof Error ? e.message : String(e),
        errorStack: e instanceof Error ? e.stack : undefined,
      });
      captureException(e, {
        stripeEventId: event.id,
        eventType: event.type,
      });
      console.error(e);
      await markWebhookFailed(admin, webhookRowId, errorMessage(e));
      return jsonResponse({ error: errorMessage(e) }, 500, cors);
    }
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(admin, event, webhookRowId);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentPaymentFailed(
          admin,
          event,
          webhookRowId,
          stripe,
        );
        break;
      case "charge.refunded":
        await handleChargeRefunded(admin, event, webhookRowId);
        break;
      default:
        log.info("event_ignored", { eventType: event.type, stripeEventId: event.id });
        await markWebhookIgnored(admin, webhookRowId);
    }
  } catch (e) {
    log.error("webhook_handler_failed", {
      stripeEventId: event.id,
      eventType: event.type,
      errorMessage: e instanceof Error ? e.message : String(e),
      errorStack: e instanceof Error ? e.stack : undefined,
    });
    captureException(e, {
      stripeEventId: event.id,
      eventType: event.type,
    });
    console.error(`Webhook ${event.type} failed:`, e);
    await markWebhookFailed(admin, webhookRowId, errorMessage(e));
  }

  return jsonResponse({ received: true }, 200, cors);
});
