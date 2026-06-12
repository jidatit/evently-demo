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
const log = createLogger("send-thread-message");
initSentry("send-thread-message");

function utcYmd(): string {
  return new Date().toISOString().slice(0, 10);
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

    let bodyJson: { threadId?: string; body?: string };
    try {
      bodyJson = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400, cors);
    }

    const threadId = typeof bodyJson.threadId === "string"
      ? bodyJson.threadId.trim()
      : "";
    const body = typeof bodyJson.body === "string" ? bodyJson.body.trim() : "";
    if (!threadId) {
      return jsonResponse({ error: "threadId is required" }, 400, cors);
    }
    if (!body) {
      return jsonResponse({ error: "body is required" }, 400, cors);
    }
    if (body.length > 8000) {
      return jsonResponse({ error: "body is too long" }, 400, cors);
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
    // Service role after JWT verification; participant check before writes.
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: thread, error: threadErr } = await admin
      .from("threads")
      .select("id, vendor_id, customer_id, last_notified_at")
      .eq("id", threadId)
      .maybeSingle();

    if (threadErr) {
      console.error(threadErr);
      return jsonResponse({ error: "Failed to load thread" }, 500, cors);
    }
    if (!thread) {
      return jsonResponse({ error: "Thread not found" }, 404, cors);
    }

    const { data: vendorRow, error: vendorErr } = await admin
      .from("vendors")
      .select("id, user_id, business_name, contact_email")
      .eq("id", thread.vendor_id as string)
      .maybeSingle();

    if (vendorErr || !vendorRow) {
      return jsonResponse({ error: "Vendor not found" }, 404, cors);
    }

    const isCustomer = thread.customer_id === uid;
    const isVendorOwner = vendorRow.user_id === uid;
    if (!isCustomer && !isVendorOwner) {
      return jsonResponse({ error: "Forbidden" }, 403, cors);
    }

    const { data: inserted, error: insertErr } = await admin
      .from("thread_messages")
      .insert({
        thread_id: threadId,
        sender_id: uid,
        type: "message",
        body,
      })
      .select("*")
      .single();

    if (insertErr || !inserted) {
      console.error(insertErr);
      return jsonResponse({ error: "Failed to send message" }, 500, cors);
    }

    log.info("message_inserted", { threadId, messageId: inserted.id });

    const { data: senderProfile } = await admin
      .from("profiles")
      .select("id, name, email")
      .eq("id", uid)
      .maybeSingle();

    const senderName = displayNameFromProfile(
      senderProfile,
      user.email ?? null,
    );
    const vendorBusinessName = String(vendorRow.business_name ?? "").trim() ||
      "Vendor";

    const baseUrl = getAppBaseUrl(req);
    const messageSnippet = body.length > 100 ? body.slice(0, 100) : body;

    let notify = false;
    const lastNotified = thread.last_notified_at as string | null;
    if (!lastNotified) {
      notify = true;
    } else {
      const last = new Date(lastNotified).getTime();
      if (Date.now() - last > 24 * 60 * 60 * 1000) notify = true;
    }

    if (notify) {
      let recipientEmail: string;
      let recipientName: string;
      let recipientId: string;
      let threadUrl: string;

      if (isCustomer) {
        const to = String(vendorRow.contact_email ?? "").trim();
        if (!to) {
          log.info("notification_skipped", {
            threadId,
            reason: "missing_recipient_email",
          });
          return jsonResponse({ message: inserted }, 200, cors);
        }
        const { data: vendorProfile } = await admin
          .from("profiles")
          .select("name, email")
          .eq("id", vendorRow.user_id as string)
          .maybeSingle();
        recipientEmail = to;
        recipientName = displayNameFromProfile(vendorProfile, to);
        recipientId = vendorRow.user_id as string;
        threadUrl = `${baseUrl}/vendor-dashboard?tab=messages`;
      } else {
        const { data: customerProfile } = await admin
          .from("profiles")
          .select("name, email")
          .eq("id", thread.customer_id as string)
          .maybeSingle();
        const to = String(customerProfile?.email ?? "").trim();
        if (!to) {
          log.info("notification_skipped", {
            threadId,
            reason: "missing_recipient_email",
          });
          return jsonResponse({ message: inserted }, 200, cors);
        }
        recipientEmail = to;
        recipientName = displayNameFromProfile(customerProfile, to);
        recipientId = thread.customer_id as string;
        threadUrl = `${baseUrl}/dashboard?tab=messages`;
      }

      const ymd = utcYmd();
      const idempotencyKey =
        `thread_msg:${threadId}:${recipientId}:${ymd}`;

      await enqueueEmailOutbox(admin, {
        template: "new_thread_message",
        idempotencyKey,
        payload: {
          to: recipientEmail,
          recipientName,
          senderName,
          vendorBusinessName,
          messageSnippet,
          threadUrl,
        },
      });

      log.info("notification_enqueued", { threadId, recipientId });

      const { error: notifyUpdateErr } = await admin
        .from("threads")
        .update({ last_notified_at: new Date().toISOString() })
        .eq("id", threadId);

      if (notifyUpdateErr) {
        console.error("last_notified_at update failed:", notifyUpdateErr);
        return jsonResponse(
          { error: "Message sent but notification state could not be updated" },
          500,
          cors,
        );
      }
    } else {
      log.info("notification_skipped", {
        threadId,
        reason: "cooldown_not_elapsed",
      });
    }

    return jsonResponse({ message: inserted }, 200, cors);
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
