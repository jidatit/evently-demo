export type StripeConnectionStatus =
  | "not_started"
  | "incomplete"
  | "pending_verification"
  | "partially_enabled"
  | "fully_active"
  | "restricted";

export type VendorStripeAccount = {
  id: string;
  vendorId: string;
  stripeAccountId: string;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  payoutsEverEnabled: boolean;
  /** Stripe has past_due fields or disabled_reason — vendor must finish in Express */
  stripeActionRequired: boolean;
  createdAt: string;
  updatedAt: string;
};

export function deriveStripeConnectionStatus(
  row: VendorStripeAccount | null | undefined,
): StripeConnectionStatus {
  if (!row) return "not_started";
  if (!row.onboardingComplete) return "incomplete";
  if (row.chargesEnabled && row.payoutsEnabled) return "fully_active";
  if (row.chargesEnabled && !row.payoutsEnabled) return "partially_enabled";
  if (row.payoutsEverEnabled && !row.payoutsEnabled) return "restricted";
  // details_submitted can be true while Stripe still needs SSN, ID, etc. (past_due)
  if (
    row.onboardingComplete &&
    row.stripeActionRequired &&
    !row.chargesEnabled &&
    !row.payoutsEnabled
  ) {
    return "restricted";
  }
  if (
    row.onboardingComplete &&
    !row.chargesEnabled &&
    !row.payoutsEnabled &&
    !row.payoutsEverEnabled
  ) {
    return "pending_verification";
  }
  return "pending_verification";
}
