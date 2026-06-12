import type { BookingClaim, ClaimType } from '@/features/claims/types';
import { findProfile, findVendor, getDb, newId, updateDb } from '../db';
import { mockDelay } from '../delay';

function mapClaim(row: ReturnType<typeof getDb>['booking_claims'][0], db: ReturnType<typeof getDb>): BookingClaim {
  const booking = db.bookings.find((b) => b.id === row.booking_id);
  const submitter = findProfile(db, row.submitted_by);
  const customer = booking ? findProfile(db, booking.customer_id) : null;
  const vendor = booking ? findVendor(db, booking.vendor_id) : null;

  return {
    id: row.id,
    bookingId: row.booking_id,
    submittedBy: row.submitted_by,
    claimType: row.claim_type,
    description: row.description,
    status: row.status,
    adminNotes: row.admin_notes,
    resolvedBy: row.resolved_by,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submitterName:
      submitter?.name?.trim() ||
      submitter?.email?.trim()?.split('@')[0] ||
      undefined,
    submitterEmail: submitter?.email?.trim() || undefined,
    bookingEventDate: booking?.event_date,
    bookingStatus: booking?.status,
    serviceName: booking?.service_snapshot.name,
    vendorName: vendor?.business_name?.trim() || undefined,
    vendorEmail: vendor?.contact_email?.trim() || undefined,
    plannerName:
      customer?.name?.trim() ||
      customer?.email?.trim()?.split('@')[0] ||
      undefined,
    plannerEmail: customer?.email?.trim() || undefined,
  };
}

export async function submitClaimMock(
  bookingId: string,
  submittedBy: string,
  claimType: ClaimType,
  description: string,
): Promise<BookingClaim> {
  await mockDelay();
  const now = new Date().toISOString();
  const claim = {
    id: newId('claim'),
    booking_id: bookingId,
    submitted_by: submittedBy,
    claim_type: claimType,
    description: description.trim(),
    status: 'under_review' as const,
    admin_notes: null,
    resolved_by: null,
    resolved_at: null,
    created_at: now,
    updated_at: now,
  };
  updateDb((db) => db.booking_claims.push(claim));
  return mapClaim(claim, getDb());
}

export async function getClaimForBookingMock(
  bookingId: string,
): Promise<BookingClaim | null> {
  await mockDelay();
  const db = getDb();
  const row = db.booking_claims
    .filter((c) => c.booking_id === bookingId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (!row) return null;
  return mapClaim(row, db);
}

export async function getClaimsMock(): Promise<BookingClaim[]> {
  await mockDelay();
  const db = getDb();
  return db.booking_claims
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((c) => mapClaim(c, db));
}

export async function processClaimMock(
  claimId: string,
  action: 'approve' | 'deny',
  adminNotes?: string,
): Promise<{ claim: BookingClaim; booking: Record<string, unknown> }> {
  await mockDelay();
  const now = new Date().toISOString();
  updateDb((db) => {
    const claim = db.booking_claims.find((c) => c.id === claimId);
    if (!claim) throw new Error('Claim not found');
    claim.status = action === 'approve' ? 'approved' : 'denied';
    claim.admin_notes = adminNotes?.trim() || null;
    claim.resolved_at = now;
    claim.updated_at = now;
  });
  const db = getDb();
  const claim = db.booking_claims.find((c) => c.id === claimId)!;
  const booking = db.bookings.find((b) => b.id === claim.booking_id);
  return {
    claim: mapClaim(claim, db),
    booking: booking ? { ...booking } : {},
  };
}
