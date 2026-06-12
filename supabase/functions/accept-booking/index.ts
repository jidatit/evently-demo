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
const log = createLogger("accept-booking");
initSentry("accept-booking");

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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ServiceSnapshot = {
  name: string;
  pricing_type: string;
  total_price_cents?: number;
  price_cents?: number;
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

    const { data: vendor, error: vendorErr } = await admin
      .from("vendors")
      .select("id, business_name")
      .eq("user_id", uid)
      .maybeSingle();

    if (vendorErr || !vendor) {
      console.error("accept-booking: vendor not found for user", uid);
      return jsonResponse({ error: "Vendor not found" }, 404, cors);
    }

    const { data: booking, error: bookingErr } = await admin
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingErr) {
      console.error(bookingErr);
      return jsonResponse({ error: "Failed to load booking" }, 500, cors);
    }
    if (!booking || booking.vendor_id !== vendor.id) {
      console.error("accept-booking: booking not found or wrong vendor", {
        bookingId,
        vendorId: vendor.id,
      });
      return jsonResponse({ error: "Booking not found" }, 404, cors);
    }
    if (booking.status !== "requested") {
      console.error("accept-booking: booking not in requested state", {
        bookingId,
        status: booking.status,
      });
      return jsonResponse(
        { error: "Only requested bookings can be accepted" },
        400,
        cors,
      );
    }

    const snapshot = booking.service_snapshot as ServiceSnapshot;
    if (snapshot?.pricing_type === "quote") {
      console.error("accept-booking: quote pricing_type cannot be accepted here", {
        bookingId,
      });
      return jsonResponse(
        { error: "Quote bookings cannot be accepted at this stage" },
        400,
        cors,
      );
    }

    const { data: stripeRow, error: stripeErr } = await admin
      .from("vendor_stripe_accounts")
      .select("payouts_enabled")
      .eq("vendor_id", vendor.id)
      .maybeSingle();

    if (stripeErr || !stripeRow?.payouts_enabled) {
      console.error("accept-booking: vendor stripe payouts not enabled", {
        vendorId: vendor.id,
        stripeErr,
      });
      return jsonResponse(
        { error: "Payout account must be connected before accepting bookings" },
        400,
        cors,
      );
    }

    log.info("payout_check_passed", { bookingId, vendorId: vendor.id });

    const amountTotalCents = Math.max(
      0,
      Number(snapshot?.total_price_cents ?? snapshot?.price_cents ?? 0),
    );
    if (amountTotalCents <= 0) {
      console.error("accept-booking: invalid amount", {
        bookingId,
        amountTotalCents,
      });
      return jsonResponse({ error: "Invalid booking amount" }, 400, cors);
    }

    const amountPlatformFeeCents = Math.round(amountTotalCents * 0.12);
    const amountVendorPayoutCents = amountTotalCents - amountPlatformFeeCents;
    const serviceName = String(snapshot?.name ?? "Booking");

    const baseUrl = getAppBaseUrl(req);
    const stripe = getStripe();

    const expiresAtMs = Date.now() + 24 * 60 * 60 * 1000;
    const expiresAt = new Date(expiresAtMs).toISOString();
    const expiresAtUnix = Math.floor(expiresAtMs / 1000);

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
      expires_at: expiresAtUnix,
    }, {
      idempotencyKey: bookingId,
    });

    if (!session.url) {
      console.error("accept-booking: stripe session missing url", {
        bookingId,
        sessionId: session.id,
      });
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

    log.info("payment_row_inserted", { bookingId, stripeSessionId: session.id });

    const { data: acceptedBooking, error: acceptErr } = await admin
      .from("bookings")
      .update({ status: "accepted" })
      .eq("id", bookingId)
      .select("*")
      .single();

    if (acceptErr || !acceptedBooking) {
      console.error(acceptErr);
      return jsonResponse({ error: "Failed to update booking" }, 500, cors);
    }

    await admin.from("booking_status_history").insert({
      booking_id: bookingId,
      from_status: "requested",
      to_status: "accepted",
      changed_by: uid,
      actor_type: "vendor",
    });

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
      from_status: "accepted",
      to_status: "payment_pending",
      changed_by: null,
      actor_type: "system",
    });

    const { data: customerProfile } = await admin
      .from("profiles")
      .select("name, email")
      .eq("id", booking.customer_id as string)
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

    return jsonResponse({
      booking: finalBooking,
      paymentUrl: session.url,
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
