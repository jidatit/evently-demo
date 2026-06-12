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
const log = createLogger("decline-booking");
initSentry("decline-booking");

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401, cors);
    }
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return jsonResponse({ error: "Unauthorized" }, 401, cors);
    }

    let bodyJson: { bookingId?: string; reason?: string };
    try {
      bodyJson = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400, cors);
    }

    const bookingId = typeof bodyJson.bookingId === "string"
      ? bodyJson.bookingId.trim()
      : "";
    const reason = typeof bodyJson.reason === "string"
      ? bodyJson.reason.trim()
      : "";

    if (!bookingId || !UUID_RE.test(bookingId)) {
      return jsonResponse({ error: "bookingId is required" }, 400, cors);
    }
    if (!reason) {
      return jsonResponse({ error: "reason is required" }, 400, cors);
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
    if (booking.status !== "requested") {
      return jsonResponse(
        { error: "Only requested bookings can be declined" },
        400,
        cors,
      );
    }

    const { data: updated, error: updateErr } = await admin
      .from("bookings")
      .update({
        status: "declined",
        decline_reason: reason,
        declined_by: "vendor",
      })
      .eq("id", bookingId)
      .select("*")
      .single();

    if (updateErr || !updated) {
      console.error(updateErr);
      return jsonResponse({ error: "Failed to decline booking" }, 500, cors);
    }

    log.info("booking_declined", { bookingId, vendorId: vendor.id });

    await admin.from("booking_status_history").insert({
      booking_id: bookingId,
      from_status: "requested",
      to_status: "declined",
      changed_by: uid,
      actor_type: "vendor",
      reason,
    });

    const { data: customerProfile } = await admin
      .from("profiles")
      .select("name, email")
      .eq("id", booking.customer_id as string)
      .maybeSingle();

    const plannerEmail = String(customerProfile?.email ?? "").trim();
    const snapshot = booking.service_snapshot as { name?: string };
    const baseUrl = getAppBaseUrl(req);

    if (plannerEmail) {
      await enqueueEmailOutbox(admin, {
        template: "booking_declined",
        idempotencyKey: `booking_declined:${bookingId}`,
        payload: {
          to: plannerEmail,
          plannerName: displayNameFromProfile(customerProfile, plannerEmail),
          vendorBusinessName: String(vendor.business_name ?? "").trim() ||
            "Vendor",
          serviceName: String(snapshot?.name ?? "Service"),
          eventDate: formatEventDate(String(booking.event_date)),
          declineReason: reason,
          dashboardUrl: `${baseUrl}/dashboard?tab=bookings`,
        },
      });
      log.info("email_enqueued", {
        bookingId,
        template: "booking_declined",
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
