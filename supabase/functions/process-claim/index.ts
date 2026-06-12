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
const log = createLogger("process-claim");
initSentry("process-claim");

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function isAdminUser(user: { app_metadata?: Record<string, unknown> }): boolean {
  return (user.app_metadata as { role?: string } | undefined)?.role === "admin";
}

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

    let bodyJson: { claimId?: string; action?: string; adminNotes?: string };
    try {
      bodyJson = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400, cors);
    }

    const claimId = typeof bodyJson.claimId === "string"
      ? bodyJson.claimId.trim()
      : "";
    const action = typeof bodyJson.action === "string"
      ? bodyJson.action.trim()
      : "";
    const adminNotes = typeof bodyJson.adminNotes === "string"
      ? bodyJson.adminNotes.trim()
      : "";

    if (!claimId || !UUID_RE.test(claimId)) {
      return jsonResponse({ error: "claimId is required" }, 400, cors);
    }
    if (action !== "approve" && action !== "deny") {
      return jsonResponse(
        { error: "action must be approve or deny" },
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

    if (!isAdminUser(user)) {
      return jsonResponse({ error: "Forbidden" }, 403, cors);
    }

    const uid = user.id;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: claim, error: claimErr } = await admin
      .from("booking_claims")
      .select("*")
      .eq("id", claimId)
      .maybeSingle();

    if (claimErr) {
      console.error(claimErr);
      return jsonResponse({ error: "Failed to load claim" }, 500, cors);
    }
    if (!claim) {
      return jsonResponse({ error: "Claim not found" }, 404, cors);
    }
    if (claim.status !== "under_review") {
      return jsonResponse({ error: "Claim already resolved" }, 400, cors);
    }

    const bookingId = claim.booking_id as string;

    const { data: booking, error: bookingErr } = await admin
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingErr) {
      console.error(bookingErr);
      return jsonResponse({ error: "Failed to load booking" }, 500, cors);
    }
    if (!booking) {
      return jsonResponse({ error: "Booking not found" }, 404, cors);
    }

    const { data: payment, error: payErr } = await admin
      .from("payments")
      .select("*")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (payErr) {
      console.error(payErr);
      return jsonResponse({ error: "Failed to load payment" }, 500, cors);
    }

    const baseUrl = getAppBaseUrl(req);
    const snapshot = booking.service_snapshot as { name?: string };
    const serviceName = String(snapshot?.name ?? "Service");
    const eventDate = formatEventDate(String(booking.event_date));

    const { data: customerProfile } = await admin
      .from("profiles")
      .select("name, email")
      .eq("id", booking.customer_id as string)
      .maybeSingle();

    const { data: vendor } = await admin
      .from("vendors")
      .select("business_name, contact_email")
      .eq("id", booking.vendor_id as string)
      .maybeSingle();

    const plannerEmail = String(customerProfile?.email ?? "").trim();
    const vendorEmail = String(vendor?.contact_email ?? "").trim();
    const plannerName = displayNameFromProfile(customerProfile, plannerEmail);
    const vendorBusinessName =
      String(vendor?.business_name ?? "").trim() || "Vendor";

    if (action === "approve") {
      if (booking.status !== "paid") {
        return jsonResponse(
          { error: "Booking is not in a paid state" },
          400,
          cors,
        );
      }
      if (!payment) {
        return jsonResponse({ error: "Payment not found" }, 404, cors);
      }
      if (payment.status === "refunded") {
        return jsonResponse(
          { error: "Payment has already been refunded" },
          400,
          cors,
        );
      }

      const piId = String(payment.stripe_payment_intent_id ?? "").trim();
      if (!piId) {
        return jsonResponse(
          { error: "No Stripe payment intent for this booking" },
          400,
          cors,
        );
      }

      const stripe = getStripe();
      let refundId: string;
      try {
        const refund = await stripe.refunds.create({
          payment_intent: piId,
          metadata: {
            booking_id: bookingId,
            claim_id: claimId,
            ...(adminNotes ? { admin_notes: adminNotes } : {}),
          },
        });
        refundId = refund.id;
        log.info("stripe_refund_created", {
          bookingId,
          claimId,
          refundId,
        });
      } catch (e: unknown) {
        log.error("stripe_refund_failed", {
          bookingId,
          claimId,
          errorMessage: e instanceof Error ? e.message : String(e),
          errorStack: e instanceof Error ? e.stack : undefined,
        });
        captureException(e, { bookingId, claimId });
        console.error(e);
        return jsonResponse({ error: errorMessage(e) }, 502, cors);
      }

      const nowIso = new Date().toISOString();

      const { error: payUpErr } = await admin
        .from("payments")
        .update({
          status: "refunded",
          stripe_refund_id: refundId,
          refunded_at: nowIso,
        })
        .eq("id", payment.id)
        .eq("status", "succeeded");

      if (payUpErr) {
        console.error(payUpErr);
        return jsonResponse({ error: "Failed to update payment" }, 500, cors);
      }

      const { data: refundedBooking, error: bookUpErr } = await admin
        .from("bookings")
        .update({ status: "refunded" })
        .eq("id", bookingId)
        .eq("status", "paid")
        .select("*")
        .single();

      if (bookUpErr || !refundedBooking) {
        console.error(bookUpErr);
        return jsonResponse({ error: "Failed to update booking" }, 500, cors);
      }

      await admin.from("booking_status_history").insert({
        booking_id: bookingId,
        from_status: "paid",
        to_status: "refunded",
        changed_by: uid,
        actor_type: "admin",
        reason: adminNotes || null,
      });

      const { data: updatedClaim, error: claimUpErr } = await admin
        .from("booking_claims")
        .update({
          status: "approved",
          admin_notes: adminNotes || null,
          resolved_by: uid,
          resolved_at: nowIso,
        })
        .eq("id", claimId)
        .select("*")
        .single();

      if (claimUpErr || !updatedClaim) {
        console.error(claimUpErr);
        return jsonResponse({ error: "Failed to update claim" }, 500, cors);
      }

      log.info("claim_approved", { claimId, bookingId });

      if (plannerEmail) {
        await enqueueEmailOutbox(admin, {
          template: "claim_approved_planner",
          idempotencyKey: `claim_approved_planner:${claimId}`,
          payload: {
            to: plannerEmail,
            plannerName,
            vendorBusinessName,
            serviceName,
            eventDate,
            dashboardUrl: `${baseUrl}/dashboard?tab=bookings`,
          },
        });
      }

      if (vendorEmail) {
        await enqueueEmailOutbox(admin, {
          template: "claim_approved_vendor",
          idempotencyKey: `claim_approved_vendor:${claimId}`,
          payload: {
            to: vendorEmail,
            vendorBusinessName,
            plannerName,
            serviceName,
            eventDate,
            dashboardUrl: `${baseUrl}/vendor-dashboard?tab=bookings`,
          },
        });
      }

      return jsonResponse(
        { claim: updatedClaim, booking: refundedBooking },
        200,
        cors,
      );
    }

    // deny
    const nowIso = new Date().toISOString();
    const bookingStatus = booking.status as string;
    const denyReason = adminNotes
      ? `Claim denied: ${adminNotes}`
      : "Claim denied";

    const { data: updatedClaim, error: claimUpErr } = await admin
      .from("booking_claims")
      .update({
        status: "denied",
        admin_notes: adminNotes || null,
        resolved_by: uid,
        resolved_at: nowIso,
      })
      .eq("id", claimId)
      .select("*")
      .single();

    if (claimUpErr || !updatedClaim) {
      console.error(claimUpErr);
      return jsonResponse({ error: "Failed to update claim" }, 500, cors);
    }

    log.info("claim_denied", { claimId, bookingId });

    await admin.from("booking_status_history").insert({
      booking_id: bookingId,
      from_status: bookingStatus,
      to_status: bookingStatus,
      changed_by: uid,
      actor_type: "admin",
      reason: denyReason,
    });

    if (plannerEmail) {
      await enqueueEmailOutbox(admin, {
        template: "claim_denied_planner",
        idempotencyKey: `claim_denied_planner:${claimId}`,
        payload: {
          to: plannerEmail,
          plannerName,
          vendorBusinessName,
          serviceName,
          eventDate,
          adminNotes: adminNotes || undefined,
          dashboardUrl: `${baseUrl}/dashboard?tab=bookings`,
        },
      });
    }

    if (vendorEmail) {
      await enqueueEmailOutbox(admin, {
        template: "claim_denied_vendor",
        idempotencyKey: `claim_denied_vendor:${claimId}`,
        payload: {
          to: vendorEmail,
          vendorBusinessName,
          plannerName,
          serviceName,
          eventDate,
          dashboardUrl: `${baseUrl}/vendor-dashboard?tab=bookings`,
        },
      });
    }

    return jsonResponse(
      { claim: updatedClaim, booking },
      200,
      cors,
    );
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
