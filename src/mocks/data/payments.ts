import type { MockPayment, MockVendorStripeAccount } from '../types';

const ts = '2024-09-01T10:00:00Z';

export const mockPayments: MockPayment[] = [
  {
    id: 'pay-1',
    booking_id: 'booking-2',
    checkout_url: '/booking-confirmed?session_id=cs_demo_pending',
    status: 'pending',
    amount_total_cents: 250000,
    amount_vendor_payout_cents: 225000,
    stripe_checkout_session_id: 'cs_demo_pending',
    payout_released_at: null,
  },
  {
    id: 'pay-2',
    booking_id: 'booking-4',
    checkout_url: null,
    status: 'paid',
    amount_total_cents: 450000,
    amount_vendor_payout_cents: 405000,
    stripe_checkout_session_id: 'cs_demo_paid_4',
    payout_released_at: null,
  },
  {
    id: 'pay-3',
    booking_id: 'booking-5',
    checkout_url: null,
    status: 'paid',
    amount_total_cents: 500000,
    amount_vendor_payout_cents: 450000,
    stripe_checkout_session_id: 'cs_demo_paid_5',
    payout_released_at: '2025-04-25T10:00:00Z',
  },
];

export const mockVendorStripeAccounts: MockVendorStripeAccount[] = [
  {
    id: 'stripe-acct-1',
    vendor_id: 'vendor-1',
    stripe_account_id: 'acct_demo_vendor1',
    onboarding_complete: true,
    charges_enabled: true,
    payouts_enabled: true,
    payouts_ever_enabled: true,
    stripe_action_required: false,
    created_at: ts,
    updated_at: ts,
  },
];
