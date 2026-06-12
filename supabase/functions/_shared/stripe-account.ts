import type Stripe from "https://esm.sh/stripe@14.21.0";

/** True when Stripe needs more data before enabling charges/payouts (not just underwriting wait). */
export function stripeAccountNeedsAction(account: Stripe.Account): boolean {
  const r = account.requirements;
  if (!r) return false;
  if ((r.past_due?.length ?? 0) > 0) return true;
  if (r.disabled_reason) return true;
  return false;
}
