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
const log = createLogger("withdraw-quote");
initSentry("withdraw-quote");

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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ServiceSnapshot = { name?: string };

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
      threadMessageId?: string;
      reason?: string;
    };
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
    const reason = typeof bodyJson.reason === "string"
      ? bodyJson.reason.trim()
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
    if (booking.status !== "quote_sent") {
      return jsonResponse(
        { error: "Only bookings with a sent quote can be withdrawn" },
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

    const { data: withdrawnMsg, error: withdrawMsgErr } = await admin
      .from("thread_messages")
      .update({ quote_status: "withdrawn" })
      .eq("id", threadMessageId)
      .eq("quote_status", "pending")
      .select("*")
      .maybeSingle();

    if (withdrawMsgErr || !withdrawnMsg) {
      console.error(withdrawMsgErr);
      return jsonResponse(
        { error: "Quote is no longer pending" },
        409,
        cors,
      );
    }

    const { data: updated, error: updateErr } = await admin
      .from("bookings")
      .update({ status: "quote_withdrawn" })
      .eq("id", bookingId)
      .select("*")
      .single();

    if (updateErr || !updated) {
      console.error(updateErr);
      return jsonResponse({ error: "Failed to update booking" }, 500, cors);
    }

    log.info("quote_withdrawn", { bookingId, threadMessageId });

    await admin.from("booking_status_history").insert({
      booking_id: bookingId,
      from_status: "quote_sent",
      to_status: "quote_withdrawn",
      changed_by: uid,
      actor_type: "vendor",
      reason: reason || null,
    });

    const { data: customerProfile } = await admin
      .from("profiles")
      .select("name, email")
      .eq("id", booking.customer_id as string)
      .maybeSingle();

    const plannerEmail = String(customerProfile?.email ?? "").trim();
    const snapshot = booking.service_snapshot as ServiceSnapshot;
    const baseUrl = getAppBaseUrl(req);
    const quoteCents = Number(message.quote_price_cents ?? 0);

    if (plannerEmail) {
      await enqueueEmailOutbox(admin, {
        template: "quote_withdrawn",
        idempotencyKey: `quote_withdrawn:${bookingId}:${threadMessageId}`,
        payload: {
          to: plannerEmail,
          plannerName: displayNameFromProfile(customerProfile, plannerEmail),
          vendorBusinessName: String(vendor.business_name ?? "").trim() ||
            "Vendor",
          serviceName: String(snapshot?.name ?? "Service"),
          eventDate: formatEventDate(String(booking.event_date)),
          quoteAmount: formatCents(quoteCents),
          reason: reason || undefined,
          dashboardUrl: `${baseUrl}/dashboard?tab=bookings&booking_id=${bookingId}`,
        },
      });
    }

    return jsonResponse({ booking: updated }, 200, cors);
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
