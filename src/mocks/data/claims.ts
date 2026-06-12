import type { MockBookingClaim } from '../types';

export const mockBookingClaims: MockBookingClaim[] = [
  {
    id: 'claim-1',
    booking_id: 'booking-5',
    submitted_by: 'user-vendor-1',
    claim_type: 'no_show',
    description: 'Planner did not arrive for final walkthrough.',
    status: 'under_review',
    admin_notes: null,
    resolved_by: null,
    resolved_at: null,
    created_at: '2025-04-20T10:00:00Z',
    updated_at: '2025-04-20T10:00:00Z',
  },
  {
    id: 'claim-2',
    booking_id: 'booking-6',
    submitted_by: 'user-customer-1',
    claim_type: 'cancellation',
    description: 'Requesting refund review after vendor cancellation dispute.',
    status: 'approved',
    admin_notes: 'Refund processed per policy.',
    resolved_by: 'user-admin-1',
    resolved_at: '2024-12-20T10:00:00Z',
    created_at: '2024-12-16T10:00:00Z',
    updated_at: '2024-12-20T10:00:00Z',
  },
];
