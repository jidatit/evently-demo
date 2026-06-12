import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getAppBaseUrl } from "../_shared/app-url.ts";
import { corsHeaders, errorMessage, jsonResponse } from "../_shared/http.ts";
import { createLogger } from "../_shared/logger.ts";
import { captureException, initSentry } from "../_shared/sentry.ts";
import { getStripe } from "../_shared/stripe-client.ts";
import {
  isEnvGuardError,
  requireSupabaseUserEnv,
} from "../_shared/supabase-env.ts";

const cors = corsHeaders();
const log = createLogger("create-stripe-connect-account");
initSentry("create-stripe-connect-account");

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
      .select(
        "id, user_id, business_name, city, state, contact_email",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (vendorError || !vendor) {
      return jsonResponse({ error: "Vendor not found" }, 404, cors);
    }

    const profileOk =
      !!(vendor.business_name as string)?.trim() &&
      !!(vendor.city as string)?.trim() &&
      !!(vendor.state as string)?.trim() &&
      !!(vendor.contact_email as string)?.trim();
    if (!profileOk) {
      return jsonResponse(
        {
          error:
            "Complete your profile (business name, city, state, contact email) before connecting payouts.",
        },
        400,
        cors,
      );
    }

    const { data: existing } = await admin
      .from("vendor_stripe_accounts")
      .select("id, stripe_account_id")
      .eq("vendor_id", vendor.id)
      .maybeSingle();

    const stripe = getStripe();
    let stripeAccountId = existing?.stripe_account_id as string | undefined;

    if (stripeAccountId) {
      log.info("account_reused", {
        vendorId: vendor.id,
        stripeAccountId,
      });
    }

    if (!stripeAccountId) {
      const country = Deno.env.get("STRIPE_CONNECT_DEFAULT_COUNTRY") ?? "US";
      const account = await stripe.accounts.create({
        type: "express",
        country,
        metadata: { vendor_id: vendor.id },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      stripeAccountId = account.id;
      log.info("account_created", {
        vendorId: vendor.id,
        stripeAccountId,
      });

      const { error: insertError } = await admin.from("vendor_stripe_accounts")
        .insert({
          vendor_id: vendor.id,
          stripe_account_id: stripeAccountId,
          onboarding_complete: false,
          charges_enabled: false,
          payouts_enabled: false,
          payouts_ever_enabled: false,
        });

      if (insertError) {
        console.error(insertError);
        if (insertError.code === "23505") {
          const { data: row } = await admin
            .from("vendor_stripe_accounts")
            .select("stripe_account_id")
            .eq("vendor_id", vendor.id)
            .single();
          stripeAccountId = row?.stripe_account_id as string;
        } else {
          throw new Error(insertError.message);
        }
      }
    }

    const base = getAppBaseUrl(req);
    const returnUrl = `${base}/vendor-dashboard?stripe=success`;
    const refreshUrl = `${base}/vendor-dashboard?stripe=refresh`;

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    log.info("account_link_generated", {
      vendorId: vendor.id,
      stripeAccountId,
    });

    return jsonResponse({ url: accountLink.url }, 200, cors);
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
