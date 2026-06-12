import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getAppBaseUrl } from "../_shared/app-url.ts";
import { enqueueEmailOutbox } from "../_shared/email-outbox.ts";
import { corsHeaders, errorMessage, jsonResponse } from "../_shared/http.ts";
import { createLogger } from "../_shared/logger.ts";
import { captureException, initSentry } from "../_shared/sentry.ts";
import {
  isEnvGuardError,
  requireSupabaseUserEnv,
} from "../_shared/supabase-env.ts";

const cors = corsHeaders();
const log = createLogger("send-quote");
initSentry("send-quote");

const SEND_QUOTE_STATUSES = ["requested", "quote_declined", "quote_withdrawn"];

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

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function buildQuoteBody(priceCents: number, notes?: string | null): string {
  const price = formatCents(priceCents);
  if (!notes?.trim()) return `Quote: ${price}`;
  const trimmed = notes.trim();
  const snippet = trimmed.length > 200 ? `${trimmed.slice(0, 197)}...` : trimmed;
  return `Quote: ${price}\n\n${snippet}`;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ServiceSnapshot = { name?: string; pricing_type?: string };

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

    let bodyJson: {
      bookingId?: string;
      quotePriceCents?: number;
      quoteNotes?: string;
    };
    try {
      bodyJson = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400, cors);
    }

    const bookingId = typeof bodyJson.bookingId === "string"
      ? bodyJson.bookingId.trim()
      : "";
    const quotePriceCents = Number(bodyJson.quotePriceCents);
    const quoteNotes = typeof bodyJson.quoteNotes === "string"
      ? bodyJson.quoteNotes.trim()
      : "";

    if (!bookingId || !UUID_RE.test(bookingId)) {
      return jsonResponse({ error: "bookingId is required" }, 400, cors);
    }
    if (!Number.isInteger(quotePriceCents) || quotePriceCents <= 0) {
      return jsonResponse(
        { error: "quotePriceCents must be a positive integer" },
        400,
        cors,
      );
    }
    if (quoteNotes.length > 2000) {
      return jsonResponse(
        { error: "quoteNotes must be at most 2000 characters" },
        400,
        cors,
      );
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
      return jsonResponse({ error: "Booking not found" }, 404, cors);
    }

    const priorStatus = String(booking.status);
    if (!SEND_QUOTE_STATUSES.includes(priorStatus)) {
      return jsonResponse(
        { error: "Booking is not in a state that allows sending a quote" },
        400,
        cors,
      );
    }

    const snapshot = booking.service_snapshot as ServiceSnapshot;
    if (snapshot?.pricing_type !== "quote") {
      return jsonResponse(
        { error: "Only quote-type bookings can receive a quote" },
        400,
        cors,
      );
    }

    const threadId = booking.thread_id as string | null;
    if (!threadId) {
      return jsonResponse(
        { error: "Booking has no conversation thread" },
        400,
        cors,
      );
    }

    const { data: thread, error: threadErr } = await admin
      .from("threads")
      .select("id, booking_id")
      .eq("id", threadId)
      .maybeSingle();

    if (threadErr || !thread) {
      return jsonResponse({ error: "Thread not found" }, 404, cors);
    }
    if (thread.booking_id !== bookingId) {
      return jsonResponse({ error: "Thread does not match booking" }, 400, cors);
    }

    const { data: stripeRow, error: stripeErr } = await admin
      .from("vendor_stripe_accounts")
      .select("payouts_enabled")
      .eq("vendor_id", vendor.id)
      .maybeSingle();

    if (stripeErr || !stripeRow?.payouts_enabled) {
      return jsonResponse(
        { error: "Payout account must be connected before sending quotes" },
        400,
        cors,
      );
    }

    const messageBody = buildQuoteBody(
      quotePriceCents,
      quoteNotes || null,
    );

    const { data: quoteMessage, error: msgErr } = await admin
      .from("thread_messages")
      .insert({
        thread_id: threadId,
        sender_id: uid,
        type: "quote",
        body: messageBody,
        quote_price_cents: quotePriceCents,
        quote_notes: quoteNotes || null,
        quote_status: "pending",
      })
      .select("*")
      .single();

    if (msgErr) {
      console.error(msgErr);
      if (msgErr.code === "23505") {
        return jsonResponse(
          { error: "A pending quote already exists for this conversation" },
          409,
          cors,
        );
      }
      return jsonResponse({ error: "Failed to send quote" }, 500, cors);
    }

    log.info("quote_message_inserted", {
      bookingId,
      threadMessageId: quoteMessage.id,
    });

    const { data: updatedBooking, error: updateErr } = await admin
      .from("bookings")
      .update({ status: "quote_sent" })
      .eq("id", bookingId)
      .select("*")
      .single();

    if (updateErr || !updatedBooking) {
      console.error(updateErr);
      return jsonResponse({ error: "Failed to update booking" }, 500, cors);
    }

    log.info("booking_status_updated", { bookingId, status: "quote_sent" });

    await admin.from("booking_status_history").insert({
      booking_id: bookingId,
      from_status: priorStatus,
      to_status: "quote_sent",
      changed_by: uid,
      actor_type: "vendor",
    });

    const { data: customerProfile } = await admin
      .from("profiles")
      .select("name, email")
      .eq("id", booking.customer_id as string)
      .maybeSingle();

    const plannerEmail = String(customerProfile?.email ?? "").trim();
    const serviceName = String(snapshot?.name ?? "Service");
    const baseUrl = getAppBaseUrl(req);
    const messageId = quoteMessage.id as string;

    if (plannerEmail) {
      await enqueueEmailOutbox(admin, {
        template: "quote_sent",
        idempotencyKey: `quote_sent:${bookingId}:${messageId}`,
        payload: {
          to: plannerEmail,
          plannerName: displayNameFromProfile(customerProfile, plannerEmail),
          vendorBusinessName: String(vendor.business_name ?? "").trim() ||
            "Vendor",
          serviceName,
          eventDate: formatEventDate(String(booking.event_date)),
          quoteAmount: formatCents(quotePriceCents),
          threadUrl: `${baseUrl}/dashboard?tab=messages&thread_id=${threadId}`,
          dashboardUrl: `${baseUrl}/dashboard?tab=bookings&booking_id=${bookingId}`,
        },
      });
    }

    return jsonResponse({
      booking: updatedBooking,
      quoteMessage,
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
