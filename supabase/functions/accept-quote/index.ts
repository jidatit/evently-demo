import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getAppBaseUrl } from "../_shared/app-url.ts";
import { enqueueEmailOutbox } from "../_shared/email-outbox.ts";
import { corsHeaders, errorMessage, jsonResponse } from "../_shared/http.ts";
import { createLogger } from "../_shared/logger.ts";
import { captureException, initSentry } from "../_shared/sentry.ts";
import { getStripe } from "../_shared/stripe-client.ts";
import {
  isEnvGuardError,
  requireSupabaseUserEnv,
} from "../_shared/supabase-env.ts";

const cors = corsHeaders();
const log = createLogger("accept-quote");
initSentry("accept-quote");

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

function formatEventDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
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

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ServiceSnapshot = {
  name?: string;
  description?: string | null;
  pricing_type?: string;
  rate_cents?: number;
  quantity?: number;
  quantity_unit?: string;
  total_price_cents?: number;
  duration_minutes?: number | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, cors);
  }

  log.info("function_called", { method: req.method });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401, cors);
    }
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return jsonResponse({ error: "Unauthorized" }, 401, cors);
    }

    let bodyJson: { bookingId?: string; threadMessageId?: string };
    try {
      bodyJson = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400, cors);
    }

    const bookingId = typeof bodyJson.bookingId === "string"
      ? bodyJson.bookingId.trim()
      : "";
    const threadMessageId = typeof bodyJson.threadMessageId === "string"
      ? bodyJson.threadMessageId.trim()
      : "";

    if (!bookingId || !UUID_RE.test(bookingId)) {
      return jsonResponse({ error: "bookingId is required" }, 400, cors);
    }
    if (!threadMessageId || !UUID_RE.test(threadMessageId)) {
      return jsonResponse({ error: "threadMessageId is required" }, 400, cors);
    }

    const envCheck = requireSupabaseUserEnv(cors);
    if (isEnvGuardError(envCheck)) return envCheck.response;
    const { url: supabaseUrl, anonKey: supabaseAnon, serviceRoleKey: serviceKey } =
      envCheck.env;

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      auth: { persistSession: false },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser(
      token,
    );
    if (authError || !user) {
      return jsonResponse({ error: "Invalid session" }, 401, cors);
    }

    const uid = user.id;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: booking, error: bookingErr } = await admin
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingErr) {
      console.error(bookingErr);
      return jsonResponse({ error: "Failed to load booking" }, 500, cors);
    }
    if (!booking || booking.customer_id !== uid) {
      return jsonResponse({ error: "Booking not found" }, 404, cors);
    }
    if (booking.status !== "quote_sent") {
      return jsonResponse(
        { error: "Only bookings with a sent quote can be accepted" },
        400,
        cors,
      );
    }

    const threadId = booking.thread_id as string | null;
    if (!threadId) {
      return jsonResponse({ error: "Booking has no thread" }, 400, cors);
    }

    const { data: message, error: msgErr } = await admin
      .from("thread_messages")
      .select("*")
      .eq("id", threadMessageId)
      .maybeSingle();

    if (msgErr) {
      console.error(msgErr);
      return jsonResponse({ error: "Failed to load quote" }, 500, cors);
    }
    if (
      !message ||
      message.thread_id !== threadId ||
      message.type !== "quote" ||
      message.quote_status !== "pending"
    ) {
      return jsonResponse({ error: "Quote not found or not pending" }, 404, cors);
    }

    const quotePriceCents = Number(message.quote_price_cents ?? 0);
    if (!Number.isInteger(quotePriceCents) || quotePriceCents <= 0) {
      return jsonResponse({ error: "Invalid quote amount" }, 400, cors);
    }

    const { data: vendor, error: vendorErr } = await admin
      .from("vendors")
      .select("id, business_name")
      .eq("id", booking.vendor_id as string)
      .maybeSingle();

    if (vendorErr || !vendor) {
      return jsonResponse({ error: "Vendor not found" }, 404, cors);
    }

    const { data: stripeRow, error: stripeErr } = await admin
      .from("vendor_stripe_accounts")
      .select("payouts_enabled")
      .eq("vendor_id", vendor.id)
      .maybeSingle();

    if (stripeErr || !stripeRow?.payouts_enabled) {
      return jsonResponse(
        { error: "Vendor payout account is not ready for payments" },
        400,
        cors,
      );
    }

    const { data: acceptedMsg, error: acceptMsgErr } = await admin
      .from("thread_messages")
      .update({ quote_status: "accepted" })
      .eq("id", threadMessageId)
      .eq("quote_status", "pending")
      .select("*")
      .maybeSingle();

    if (acceptMsgErr || !acceptedMsg) {
      console.error(acceptMsgErr);
      return jsonResponse(
        { error: "Quote is no longer pending" },
        409,
        cors,
      );
    }

    log.info("quote_accepted", { bookingId, threadMessageId });

    const priorSnapshot = booking.service_snapshot as ServiceSnapshot;
    const lockedSnapshot: ServiceSnapshot = {
      ...priorSnapshot,
      pricing_type: "quote",
      rate_cents: quotePriceCents,
      quantity: 1,
      quantity_unit: "quote",
      total_price_cents: quotePriceCents,
    };

    const { data: quoteAcceptedBooking, error: snapErr } = await admin
      .from("bookings")
      .update({
        status: "quote_accepted",
        service_snapshot: lockedSnapshot,
      })
      .eq("id", bookingId)
      .select("*")
      .single();

    if (snapErr || !quoteAcceptedBooking) {
      console.error(snapErr);
      return jsonResponse({ error: "Failed to lock quote price" }, 500, cors);
    }

    log.info("snapshot_locked", { bookingId, quotePriceCents });

    await admin.from("booking_status_history").insert({
      booking_id: bookingId,
      from_status: "quote_sent",
      to_status: "quote_accepted",
      changed_by: uid,
      actor_type: "customer",
    });

    const amountTotalCents = quotePriceCents;
    const amountPlatformFeeCents = Math.round(amountTotalCents * 0.12);
    const amountVendorPayoutCents = amountTotalCents - amountPlatformFeeCents;
    const serviceName = String(lockedSnapshot?.name ?? "Booking");

    const baseUrl = getAppBaseUrl(req);
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: amountTotalCents,
          product_data: { name: serviceName },
        },
        quantity: 1,
      }],
      payment_intent_data: {
        metadata: { booking_id: bookingId },
      },
      success_url:
        `${baseUrl}/booking-confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard?tab=bookings&booking_id=${bookingId}`,
      metadata: { booking_id: bookingId },
    }, {
      idempotencyKey: bookingId,
    });

    if (!session.url) {
      return jsonResponse({ error: "Failed to create checkout session" }, 500, cors);
    }

    log.info("checkout_session_created", {
      bookingId,
      stripeSessionId: session.id,
    });

    const { error: paymentErr } = await admin.from("payments").insert({
      booking_id: bookingId,
      stripe_checkout_session_id: session.id,
      checkout_url: session.url,
      amount_total_cents: amountTotalCents,
      amount_platform_fee_cents: amountPlatformFeeCents,
      amount_vendor_payout_cents: amountVendorPayoutCents,
      platform_fee_pct: 12.0,
      status: "pending",
    });

    if (paymentErr) {
      log.error("payment_insert_failed", {
        bookingId,
        errorMessage: paymentErr.message,
      });
      captureException(paymentErr, { bookingId, vendorId: vendor.id });
      console.error(paymentErr);
      return jsonResponse({ error: "Failed to record payment" }, 500, cors);
    }

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { data: finalBooking, error: pendingErr } = await admin
      .from("bookings")
      .update({
        status: "payment_pending",
        payment_link_expires_at: expiresAt,
      })
      .eq("id", bookingId)
      .select("*")
      .single();

    if (pendingErr || !finalBooking) {
      console.error(pendingErr);
      return jsonResponse({ error: "Failed to set payment pending" }, 500, cors);
    }

    log.info("booking_status_updated", {
      bookingId,
      status: "payment_pending",
    });

    await admin.from("booking_status_history").insert({
      booking_id: bookingId,
      from_status: "quote_accepted",
      to_status: "payment_pending",
      changed_by: null,
      actor_type: "system",
    });

    const { data: customerProfile } = await admin
      .from("profiles")
      .select("name, email")
      .eq("id", uid)
      .maybeSingle();

    const plannerEmail = String(customerProfile?.email ?? "").trim();
    const expiresFormatted = formatExpiresAt(expiresAt);

    if (plannerEmail) {
      await enqueueEmailOutbox(admin, {
        template: "booking_accepted",
        idempotencyKey: `booking_accepted:${bookingId}`,
        payload: {
          to: plannerEmail,
          plannerName: displayNameFromProfile(customerProfile, plannerEmail),
          vendorBusinessName: String(vendor.business_name ?? "").trim() ||
            "Vendor",
          serviceName,
          eventDate: formatEventDate(String(booking.event_date)),
          paymentUrl: session.url,
          expiresAt: expiresFormatted,
          dashboardUrl: `${baseUrl}/dashboard?tab=bookings`,
        },
      });
    }

    const { data: vendorRow } = await admin
      .from("vendors")
      .select("contact_email")
      .eq("id", vendor.id)
      .maybeSingle();

    const vendorEmail = String(vendorRow?.contact_email ?? "").trim();
    if (vendorEmail) {
      await enqueueEmailOutbox(admin, {
        template: "quote_accepted",
        idempotencyKey: `quote_accepted:${bookingId}`,
        payload: {
          to: vendorEmail,
          vendorBusinessName: String(vendor.business_name ?? "").trim() ||
            "Vendor",
          plannerName: displayNameFromProfile(
            customerProfile,
            plannerEmail,
          ),
          serviceName,
          eventDate: formatEventDate(String(booking.event_date)),
          quoteAmount: formatCents(quotePriceCents),
          dashboardUrl: `${baseUrl}/vendor-dashboard?tab=bookings&booking_id=${bookingId}`,
        },
      });
    }

    return jsonResponse({
      booking: finalBooking,
      paymentUrl: session.url,
      quoteMessage: acceptedMsg,
    }, 200, cors);
  } catch (e: unknown) {
    log.error("unhandled_exception", {
      errorMessage: e instanceof Error ? e.message : String(e),
      errorStack: e instanceof Error ? e.stack : undefined,
    });
    captureException(e);
    console.error(e);
    return jsonResponse({ error: errorMessage(e) }, 500, cors);
  }
});
