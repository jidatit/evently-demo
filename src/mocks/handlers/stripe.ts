import type { VendorStripeAccount } from '@/features/stripe/types';
import { getDb, newId, updateDb } from '../db';
import { mockDelay } from '../delay';

function mapRow(row: ReturnType<typeof getDb>['vendor_stripe_accounts'][0]): VendorStripeAccount {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    stripeAccountId: row.stripe_account_id,
    onboardingComplete: row.onboarding_complete,
    chargesEnabled: row.charges_enabled,
    payoutsEnabled: row.payouts_enabled,
    payoutsEverEnabled: row.payouts_ever_enabled,
    stripeActionRequired: row.stripe_action_required,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getStripeAccountMock(
  vendorId: string,
): Promise<VendorStripeAccount | null> {
  await mockDelay();
  const db = getDb();
  const row = db.vendor_stripe_accounts.find((a) => a.vendor_id === vendorId);
  return row ? mapRow(row) : null;
}

export async function initiateStripeOnboardingMock(): Promise<string> {
  await mockDelay();
  return '/vendor-dashboard?tab=payouts&stripe=success';
}

export async function syncStripeStatusMock(vendorId?: string): Promise<{
  account: VendorStripeAccount;
  expressLoginUrl: string | null;
}> {
  await mockDelay(400);
  const db = getDb();
  let row = vendorId
    ? db.vendor_stripe_accounts.find((a) => a.vendor_id === vendorId)
    : db.vendor_stripe_accounts[0];

  if (!row && vendorId) {
    const now = new Date().toISOString();
    row = {
      id: newId('stripe-acct'),
      vendor_id: vendorId,
      stripe_account_id: `acct_demo_${vendorId}`,
      onboarding_complete: true,
      charges_enabled: true,
      payouts_enabled: true,
      payouts_ever_enabled: true,
      stripe_action_required: false,
      created_at: now,
      updated_at: now,
    };
    updateDb((d) => d.vendor_stripe_accounts.push(row!));
  }

  if (!row) {
    throw new Error('No account data returned');
  }

  updateDb((d) => {
    const acct = d.vendor_stripe_accounts.find((a) => a.id === row!.id);
    if (acct) {
      acct.onboarding_complete = true;
      acct.charges_enabled = true;
      acct.payouts_enabled = true;
      acct.payouts_ever_enabled = true;
      acct.updated_at = new Date().toISOString();
    }
  });

  return {
    account: mapRow(getDb().vendor_stripe_accounts.find((a) => a.id === row!.id)!),
    expressLoginUrl: 'https://connect.stripe.com/express/demo',
  };
}
