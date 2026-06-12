import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type EmailOutboxPayload = Record<string, unknown>;

export async function enqueueEmailOutbox(
  admin: SupabaseClient,
  opts: {
    template: string;
    idempotencyKey: string;
    payload: EmailOutboxPayload;
  },
): Promise<{ inserted: boolean }> {
  const { error } = await admin.from("email_outbox").insert({
    template: opts.template,
    idempotency_key: opts.idempotencyKey,
    payload: opts.payload,
    status: "pending",
    attempts: 0,
    max_attempts: 5,
    next_attempt_at: new Date().toISOString(),
  });

  if (error?.code === "23505") {
    return { inserted: false };
  }
  if (error) {
    throw new Error(`email_outbox insert: ${error.message}`);
  }
  return { inserted: true };
}

/** One congratulations email per vendor; dedupes webhook + manual sync. */
export async function maybeEnqueuePayoutsLiveEmail(
  admin: SupabaseClient,
  opts: {
    vendorId: string;
    to: string | null | undefined;
    dashboardUrl: string;
    previousPayoutsEnabled: boolean;
    nextPayoutsEnabled: boolean;
  },
): Promise<void> {
  if (opts.previousPayoutsEnabled || !opts.nextPayoutsEnabled) return;
  const to = opts.to?.trim();
  if (!to) return;

  await enqueueEmailOutbox(admin, {
    template: "payouts_live",
    idempotencyKey: `payouts_live:vendor:${opts.vendorId}`,
    payload: {
      to,
      dashboardUrl: opts.dashboardUrl,
    },
  });
}
