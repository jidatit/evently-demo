import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getAppBaseUrl } from "../_shared/app-url.ts";
import { maybeEnqueuePayoutsLiveEmail } from "../_shared/email-outbox.ts";
import { corsHeaders, errorMessage, jsonResponse } from "../_shared/http.ts";
import { createLogger } from "../_shared/logger.ts";
import { captureException, initSentry } from "../_shared/sentry.ts";
import { getStripe } from "../_shared/stripe-client.ts";
import { stripeAccountNeedsAction } from "../_shared/stripe-account.ts";
import {
  isEnvGuardError,
  requireSupabaseUserEnv,
} from "../_shared/supabase-env.ts";

const cors = corsHeaders();
const log = createLogger("sync-stripe-account-status");
initSentry("sync-stripe-account-status");

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

    // Service role after JWT verification; queries scoped by user.id / vendor ownership.
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: vendor, error: vendorError } = await admin
      .from("vendors")
      .select("id, contact_email, business_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (vendorError || !vendor) {
      return jsonResponse({ error: "Vendor not found" }, 404, cors);
    }

    const { data: stripeRow, error: rowError } = await admin
      .from("vendor_stripe_accounts")
      .select("*")
      .eq("vendor_id", vendor.id)
      .maybeSingle();

    if (rowError || !stripeRow) {
      return jsonResponse(
        { error: "Stripe account not initialized" },
        404,
        cors,
      );
    }

    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(
      stripeRow.stripe_account_id as string,
    );

    const stripeActionRequired = stripeAccountNeedsAction(account);

    const chargesEnabled = !!account.charges_enabled;
    const payoutsEnabled = !!account.payouts_enabled;
    const onboardingComplete = !!account.details_submitted;
    const previousPayoutsEnabled = !!stripeRow.payouts_enabled;
    const payoutsEverEnabled =
      !!(stripeRow.payouts_ever_enabled as boolean) || payoutsEnabled;

    const base = getAppBaseUrl(req);

    const { data: updated, error: updateError } = await admin
      .from("vendor_stripe_accounts")
      .update({
        charges_enabled: chargesEnabled,
        payouts_enabled: payoutsEnabled,
        onboarding_complete: onboardingComplete,
        payouts_ever_enabled: payoutsEverEnabled,
        stripe_action_required: stripeActionRequired,
      })
      .eq("vendor_id", vendor.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    log.info("status_synced", {
      vendorId: vendor.id,
      payoutsEnabled,
      chargesEnabled,
    });

    if (!previousPayoutsEnabled && payoutsEnabled) {
      log.info("payouts_enabled_transition", { vendorId: vendor.id });
    }

    const dashboardUrl = `${base}/vendor-dashboard`;
    try {
      await maybeEnqueuePayoutsLiveEmail(admin, {
        vendorId: vendor.id,
        to: vendor.contact_email as string | null,
        dashboardUrl,
        previousPayoutsEnabled,
        nextPayoutsEnabled: payoutsEnabled,
      });
    } catch (e) {
      console.error("email_outbox enqueue failed:", e);
    }

    let expressLoginUrl: string | null = null;
    try {
      const link = await stripe.accounts.createLoginLink(
        stripeRow.stripe_account_id as string,
      );
      expressLoginUrl = link.url;
    } catch (e) {
      console.warn("createLoginLink failed:", e);
    }

    return jsonResponse({ account: updated, expressLoginUrl }, 200, cors);
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
