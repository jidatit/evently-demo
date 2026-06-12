import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildServiceSnapshot } from "../_shared/booking-pricing.ts";
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
const log = createLogger("create-booking");
initSentry("create-booking");

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

    let bodyJson: {
      idempotencyKey?: string;
      vendorId?: string;
      serviceId?: string;
      eventDate?: string;
      eventEndDate?: string;
      eventTimeStart?: string;
      eventTimeEnd?: string;
      eventLocation?: string;
      notes?: string;
    };
    try {
      bodyJson = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400, cors);
    }

    const idempotencyKey = typeof bodyJson.idempotencyKey === "string"
      ? bodyJson.idempotencyKey.trim()
      : "";
    const vendorId = typeof bodyJson.vendorId === "string"
      ? bodyJson.vendorId.trim()
      : "";
    const serviceId = typeof bodyJson.serviceId === "string"
      ? bodyJson.serviceId.trim()
      : "";
    const eventDate = typeof bodyJson.eventDate === "string"
      ? bodyJson.eventDate.trim()
      : "";
    const eventEndDate = typeof bodyJson.eventEndDate === "string" &&
        bodyJson.eventEndDate.trim()
      ? bodyJson.eventEndDate.trim()
      : null;

    if (!idempotencyKey || !UUID_RE.test(idempotencyKey)) {
      return jsonResponse({ error: "idempotencyKey must be a valid UUID" }, 400, cors);
    }
    if (!vendorId || !UUID_RE.test(vendorId)) {
      return jsonResponse({ error: "vendorId is required" }, 400, cors);
    }
    if (!serviceId || !UUID_RE.test(serviceId)) {
      return jsonResponse({ error: "serviceId is required" }, 400, cors);
    }
    if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      return jsonResponse({ error: "eventDate must be YYYY-MM-DD" }, 400, cors);
    }
    if (eventEndDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventEndDate)) {
      return jsonResponse({ error: "eventEndDate must be YYYY-MM-DD" }, 400, cors);
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

    const role = user.user_metadata?.role as string | undefined;
    if (role && role !== "customer") {
      return jsonResponse({ error: "Only customers can create bookings" }, 403, cors);
    }

    const uid = user.id;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: service, error: serviceErr } = await admin
      .from("services")
      .select(
        "id, vendor_id, name, description, price, pricing_type, duration_minutes, is_active",
      )
      .eq("id", serviceId)
      .maybeSingle();

    if (serviceErr) {
      console.error(serviceErr);
      return jsonResponse({ error: "Failed to load service" }, 500, cors);
    }
    if (!service || service.vendor_id !== vendorId) {
      return jsonResponse({ error: "Service not found for this vendor" }, 404, cors);
    }
    if (!service.is_active) {
      return jsonResponse({ error: "Service is not available" }, 400, cors);
    }

    const { data: vendor, error: vendorErr } = await admin
      .from("vendors")
      .select("id, business_name, contact_email, status")
      .eq("id", vendorId)
      .maybeSingle();

    if (vendorErr || !vendor) {
      return jsonResponse({ error: "Vendor not found" }, 404, cors);
    }
    if (vendor.status !== "approved") {
      return jsonResponse({ error: "Vendor is not accepting bookings" }, 400, cors);
    }

    const { data: stripeRow } = await admin
      .from("vendor_stripe_accounts")
      .select("payouts_enabled")
      .eq("vendor_id", vendorId)
      .maybeSingle();

    if (!stripeRow?.payouts_enabled) {
      return jsonResponse(
        { error: "This vendor is not yet accepting bookings" },
        400,
        cors,
      );
    }

    const eventTimeStart = typeof bodyJson.eventTimeStart === "string" &&
        bodyJson.eventTimeStart.trim()
      ? bodyJson.eventTimeStart.trim()
      : null;
    const eventTimeEnd = typeof bodyJson.eventTimeEnd === "string" &&
        bodyJson.eventTimeEnd.trim()
      ? bodyJson.eventTimeEnd.trim()
      : null;

    const snapshotResult = buildServiceSnapshot(
      {
        name: String(service.name ?? ""),
        description: service.description as string | null,
        pricing_type: String(service.pricing_type ?? ""),
        price: service.price as number | null,
        duration_minutes: service.duration_minutes as number | null,
      },
      {
        pricingType: String(service.pricing_type ?? ""),
        rateCents: 0,
        eventDate,
        eventEndDate,
        eventTimeStart,
        eventTimeEnd,
      },
    );

    if (snapshotResult.ok === false) {
      return jsonResponse({ error: snapshotResult.error }, 400, cors);
    }

    const serviceSnapshot = snapshotResult.snapshot;

    const { data: primaryCat } = await admin
      .from("vendor_categories")
      .select("category_id")
      .eq("vendor_id", vendorId)
      .eq("is_primary", true)
      .maybeSingle();

    const eventLocation = typeof bodyJson.eventLocation === "string" &&
        bodyJson.eventLocation.trim()
      ? bodyJson.eventLocation.trim()
      : null;
    const notes = typeof bodyJson.notes === "string" && bodyJson.notes.trim()
      ? bodyJson.notes.trim()
      : null;

    const insertPayload = {
      idempotency_key: idempotencyKey,
      vendor_id: vendorId,
      customer_id: uid,
      service_id: serviceId,
      service_snapshot: serviceSnapshot,
      event_date: eventDate,
      event_end_date: eventEndDate,
      event_time_start: eventTimeStart,
      event_time_end: eventTimeEnd,
      event_location: eventLocation,
      notes,
      status: "requested",
      vendor_category_id: primaryCat?.category_id ?? null,
    };

    let booking: Record<string, unknown> | null = null;

    const { data: inserted, error: insertErr } = await admin
      .from("bookings")
      .insert(insertPayload)
      .select("*")
      .maybeSingle();

    if (!insertErr && inserted) {
      booking = inserted as Record<string, unknown>;
    } else if (insertErr?.code === "23505") {
      log.info("idempotency_collision", { idempotencyKey, vendorId });
      const { data: existing, error: selErr } = await admin
        .from("bookings")
        .select("*")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (selErr || !existing) {
        console.error(selErr ?? insertErr);
        return jsonResponse({ error: "Failed to create booking" }, 500, cors);
      }
      return jsonResponse({ booking: existing }, 200, cors);
    } else {
      log.error("booking_insert_failed", {
        vendorId,
        customerId: uid,
        errorMessage: insertErr?.message,
      });
      captureException(insertErr ?? new Error("booking insert failed"), {
        vendorId,
        customerId: uid,
      });
      console.error(insertErr);
      return jsonResponse({ error: "Failed to create booking" }, 500, cors);
    }

    if (!booking) {
      return jsonResponse({ error: "Failed to create booking" }, 500, cors);
    }

    const bookingId = booking.id as string;
    log.info("booking_created", { bookingId, vendorId, customerId: uid });
    let threadId: string | null = null;

    const { data: existingThread } = await admin
      .from("threads")
      .select("id")
      .eq("vendor_id", vendorId)
      .eq("customer_id", uid)
      .maybeSingle();

    if (existingThread) {
      threadId = existingThread.id as string;
      log.info("thread_attached", { bookingId, threadId, vendorId });
      await admin
        .from("threads")
        .update({ booking_id: bookingId })
        .eq("id", threadId);
    } else {
      const { data: newThread, error: threadInsErr } = await admin
        .from("threads")
        .insert({
          vendor_id: vendorId,
          customer_id: uid,
          booking_id: bookingId,
          status: "open",
        })
        .select("id")
        .single();

      if (threadInsErr?.code === "23505") {
        const { data: again } = await admin
          .from("threads")
          .select("id")
          .eq("vendor_id", vendorId)
          .eq("customer_id", uid)
          .maybeSingle();
        if (again) {
          threadId = again.id as string;
          await admin
            .from("threads")
            .update({ booking_id: bookingId })
            .eq("id", threadId);
        }
      } else if (newThread) {
        threadId = newThread.id as string;
        log.info("thread_created", { bookingId, threadId, vendorId });
      } else if (threadInsErr) {
        console.error("thread insert:", threadInsErr);
      }
    }

    if (threadId) {
      await admin
        .from("bookings")
        .update({ thread_id: threadId })
        .eq("id", bookingId);
      booking.thread_id = threadId;
    }

    await admin.from("booking_status_history").insert({
      booking_id: bookingId,
      from_status: null,
      to_status: "requested",
      changed_by: uid,
      actor_type: "customer",
    });

    const { data: customerProfile } = await admin
      .from("profiles")
      .select("name, email")
      .eq("id", uid)
      .maybeSingle();

    const plannerName = displayNameFromProfile(customerProfile, user.email);
    const vendorEmail = String(vendor.contact_email ?? "").trim();
    const baseUrl = getAppBaseUrl(req);
    const eventDateFormatted = formatEventDate(eventDate);

    if (vendorEmail) {
      await enqueueEmailOutbox(admin, {
        template: "booking_requested",
        idempotencyKey: `booking_requested:${bookingId}`,
        payload: {
          to: vendorEmail,
          vendorBusinessName: String(vendor.business_name ?? "").trim() || "Vendor",
          plannerName,
          serviceName: serviceSnapshot.name,
          eventDate: eventDateFormatted,
          bookingUrl: `${baseUrl}/vendor-dashboard?tab=bookings`,
        },
      });
    }

    return jsonResponse({ booking }, 200, cors);
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
