import type {
  AcceptQuoteResult,
  Booking,
  BookingStatusHistoryEntry,
  CheckoutBookingStatus,
  CreateBookingPayload,
  QuoteActionPayload,
  QuoteMessage,
  SendQuotePayload,
  SendQuoteResult,
  ServiceSnapshot,
} from '@/features/bookings/types';
import { findProfile, findVendor, getDb, newId, updateDb } from '../db';
import { mockDelay } from '../delay';
import type { MockBooking, MockServiceSnapshot } from '../types';

function mapSnapshot(raw: MockServiceSnapshot): ServiceSnapshot {
  return {
    name: raw.name,
    description: raw.description,
    pricingType: raw.pricing_type,
    rateCents: raw.rate_cents,
    quantity: raw.quantity,
    quantityUnit: raw.quantity_unit,
    totalPriceCents: raw.total_price_cents,
    durationMinutes: raw.duration_minutes,
    priceCents: raw.price_cents,
  };
}

function mapBookingRow(row: MockBooking, db: ReturnType<typeof getDb>): Booking {
  const customer = findProfile(db, row.customer_id);
  const vendor = findVendor(db, row.vendor_id);
  const payment = db.payments.find((p) => p.booking_id === row.id);

  return {
    id: row.id,
    idempotencyKey: row.idempotency_key,
    vendorId: row.vendor_id,
    customerId: row.customer_id,
    threadId: row.thread_id,
    serviceId: row.service_id,
    serviceSnapshot: mapSnapshot(row.service_snapshot),
    eventDate: row.event_date,
    eventEndDate: row.event_end_date,
    eventTimeStart: row.event_time_start,
    eventTimeEnd: row.event_time_end,
    eventLocation: row.event_location,
    notes: row.notes,
    status: row.status as Booking['status'],
    declineReason: row.decline_reason,
    declinedBy: row.declined_by,
    paymentLinkExpiresAt: row.payment_link_expires_at,
    payoutReleasedAt: row.payout_released_at,
    vendorCategoryId: row.vendor_category_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customerName:
      customer?.name?.trim() ||
      customer?.email?.trim()?.split('@')[0] ||
      undefined,
    customerEmail: customer?.email?.trim() || undefined,
    vendorName: vendor?.business_name?.trim() || undefined,
    payment: payment
      ? {
          id: payment.id,
          checkoutUrl: payment.checkout_url,
          status: payment.status,
          amountTotalCents: payment.amount_total_cents,
          amountVendorPayoutCents: payment.amount_vendor_payout_cents,
          stripeCheckoutSessionId: payment.stripe_checkout_session_id,
          payoutReleasedAt: payment.payout_released_at,
        }
      : null,
  };
}

function snapshotFromService(
  service: ReturnType<typeof getDb>['services'][0],
): MockServiceSnapshot {
  const rateCents = service.price != null ? Math.round(service.price * 100) : 0;
  return {
    name: service.name,
    description: service.description,
    pricing_type: service.pricing_type,
    rate_cents: rateCents,
    quantity: service.pricing_type === 'per_hour' ? 4 : 1,
    quantity_unit: service.pricing_type === 'per_hour' ? 'hours' : 'event',
    total_price_cents: rateCents * (service.pricing_type === 'per_hour' ? 4 : 1),
    duration_minutes: service.duration_minutes,
    price_cents: rateCents,
  };
}

export async function getPlannerBookingsMock(customerId: string): Promise<Booking[]> {
  await mockDelay();
  const db = getDb();
  return db.bookings
    .filter((b) => b.customer_id === customerId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((b) => mapBookingRow(b, db));
}

export async function getVendorBookingsMock(vendorId: string): Promise<Booking[]> {
  await mockDelay();
  const db = getDb();
  return db.bookings
    .filter((b) => b.vendor_id === vendorId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((b) => mapBookingRow(b, db));
}

export async function getBookingMock(bookingId: string): Promise<Booking> {
  await mockDelay();
  const db = getDb();
  const row = db.bookings.find((b) => b.id === bookingId);
  if (!row) throw new Error('Booking not found');
  return mapBookingRow(row, db);
}

export async function getBookingStatusHistoryMock(
  bookingId: string,
): Promise<BookingStatusHistoryEntry[]> {
  await mockDelay();
  const db = getDb();
  return db.booking_status_history
    .filter((h) => h.booking_id === bookingId)
    .map((row) => ({
      id: row.id,
      bookingId: row.booking_id,
      fromStatus: row.from_status,
      toStatus: row.to_status,
      changedBy: row.changed_by,
      actorType: row.actor_type,
      reason: row.reason,
      createdAt: row.created_at,
    }));
}

/** Simulate payment completion for checkout polling */
export function markCheckoutSessionPaid(sessionId: string): void {
  updateDb((db) => {
    const payment = db.payments.find((p) => p.stripe_checkout_session_id === sessionId);
    if (!payment) return;
    payment.status = 'paid';
    const booking = db.bookings.find((b) => b.id === payment.booking_id);
    if (booking) booking.status = 'paid';
  });
}

export async function getCheckoutBookingStatusMock(
  sessionId: string,
): Promise<CheckoutBookingStatus | null> {
  await mockDelay();
  const db = getDb();
  const payment = db.payments.find((p) => p.stripe_checkout_session_id === sessionId);
  if (!payment) return null;

  if (payment.status === 'pending') {
    markCheckoutSessionPaid(sessionId);
  }

  const freshDb = getDb();
  const booking = freshDb.bookings.find((b) => b.id === payment.booking_id);
  if (!booking) return null;
  const vendor = findVendor(freshDb, booking.vendor_id);
  return {
    bookingId: booking.id,
    bookingStatus: booking.status,
    vendorName: vendor?.business_name || 'Vendor',
    serviceName: booking.service_snapshot.name,
    eventDate: booking.event_date,
  };
}

export async function createBookingMock(
  payload: CreateBookingPayload,
  customerId: string,
): Promise<Booking> {
  await mockDelay(350);
  const db = getDb();
  const existing = db.bookings.find((b) => b.idempotency_key === payload.idempotencyKey);
  if (existing) return mapBookingRow(existing, db);

  const service = db.services.find((s) => s.id === payload.serviceId);
  if (!service) throw new Error('Service not found');

  const now = new Date().toISOString();
  const bookingId = newId('booking');
  const row: MockBooking = {
    id: bookingId,
    idempotency_key: payload.idempotencyKey,
    vendor_id: payload.vendorId,
    customer_id: customerId,
    thread_id: null,
    service_id: payload.serviceId,
    service_snapshot: snapshotFromService(service),
    event_date: payload.eventDate,
    event_end_date: payload.eventEndDate ?? null,
    event_time_start: payload.eventTimeStart ?? null,
    event_time_end: payload.eventTimeEnd ?? null,
    event_location: payload.eventLocation ?? null,
    notes: payload.notes ?? null,
    status: 'requested',
    decline_reason: null,
    declined_by: null,
    payment_link_expires_at: null,
    payout_released_at: null,
    vendor_category_id:
      db.vendor_categories.find(
        (vc) => vc.vendor_id === payload.vendorId && vc.is_primary,
      )?.category_id ?? null,
    created_at: now,
    updated_at: now,
  };

  updateDb((d) => {
    d.bookings.push(row);
  });

  return getBookingMock(bookingId);
}

export async function acceptBookingMock(bookingId: string): Promise<{ booking: Booking; paymentUrl: string }> {
  await mockDelay();
  const sessionId = `cs_demo_${bookingId}`;
  const paymentUrl = `/booking-confirmed?session_id=${sessionId}`;

  updateDb((db) => {
    const row = db.bookings.find((b) => b.id === bookingId);
    if (!row) throw new Error('Booking not found');
    row.status = 'payment_pending';
    row.payment_link_expires_at = new Date(Date.now() + 7 * 86400000).toISOString();
    row.updated_at = new Date().toISOString();
    db.payments.push({
      id: newId('pay'),
      booking_id: bookingId,
      checkout_url: paymentUrl,
      status: 'pending',
      amount_total_cents: row.service_snapshot.total_price_cents,
      amount_vendor_payout_cents: Math.round(row.service_snapshot.total_price_cents * 0.9),
      stripe_checkout_session_id: sessionId,
      payout_released_at: null,
    });
  });

  const booking = await getBookingMock(bookingId);
  return { booking, paymentUrl };
}

export async function sendQuoteMock(payload: SendQuotePayload): Promise<SendQuoteResult> {
  await mockDelay();
  let quoteMessage: QuoteMessage | null = null;
  updateDb((db) => {
    const row = db.bookings.find((b) => b.id === payload.bookingId);
    if (!row) throw new Error('Booking not found');
    row.status = 'quote_sent';
    row.service_snapshot.total_price_cents = payload.quotePriceCents;
    row.updated_at = new Date().toISOString();

    const threadId = row.thread_id ?? newId('thread');
    if (!row.thread_id) {
      row.thread_id = threadId;
      db.threads.push({
        id: threadId,
        vendor_id: row.vendor_id,
        customer_id: row.customer_id,
        booking_id: row.id,
        status: 'open',
        last_notified_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const msgId = newId('msg');
    db.thread_messages.push({
      id: msgId,
      thread_id: threadId,
      sender_id: findVendor(db, row.vendor_id)?.user_id || row.vendor_id,
      type: 'quote',
      body: `Quote: $${(payload.quotePriceCents / 100).toFixed(2)}`,
      quote_price_cents: payload.quotePriceCents,
      quote_notes: payload.quoteNotes ?? null,
      quote_status: 'pending',
      created_at: new Date().toISOString(),
    });

    quoteMessage = {
      id: msgId,
      threadId,
      senderId: findVendor(db, row.vendor_id)?.user_id || row.vendor_id,
      quotePriceCents: payload.quotePriceCents,
      quoteNotes: payload.quoteNotes ?? null,
      quoteStatus: 'pending',
      body: `Quote: $${(payload.quotePriceCents / 100).toFixed(2)}`,
      createdAt: new Date().toISOString(),
    };
  });

  const booking = await getBookingMock(payload.bookingId);
  return { booking, quoteMessage: quoteMessage! };
}

export async function acceptQuoteMock(payload: QuoteActionPayload): Promise<AcceptQuoteResult> {
  await mockDelay();
  updateDb((db) => {
    const msg = db.thread_messages.find((m) => m.id === payload.threadMessageId);
    if (msg) msg.quote_status = 'accepted';
    const row = db.bookings.find((b) => b.id === payload.bookingId);
    if (row) row.status = 'quote_accepted';
  });
  const { booking, paymentUrl } = await acceptBookingMock(payload.bookingId);
  return { booking, paymentUrl };
}

export async function declineQuoteMock(payload: QuoteActionPayload): Promise<Booking> {
  await mockDelay();
  updateDb((db) => {
    const msg = db.thread_messages.find((m) => m.id === payload.threadMessageId);
    if (msg) msg.quote_status = 'declined';
    const row = db.bookings.find((b) => b.id === payload.bookingId);
    if (row) {
      row.status = 'quote_declined';
      row.decline_reason = payload.reason ?? null;
    }
  });
  return getBookingMock(payload.bookingId);
}

export async function withdrawQuoteMock(payload: QuoteActionPayload): Promise<Booking> {
  await mockDelay();
  updateDb((db) => {
    const msg = db.thread_messages.find((m) => m.id === payload.threadMessageId);
    if (msg) msg.quote_status = 'withdrawn';
    const row = db.bookings.find((b) => b.id === payload.bookingId);
    if (row) row.status = 'quote_withdrawn';
  });
  return getBookingMock(payload.bookingId);
}

export async function cancelBookingMock(bookingId: string, reason?: string): Promise<Booking> {
  await mockDelay();
  updateDb((db) => {
    const row = db.bookings.find((b) => b.id === bookingId);
    if (!row) throw new Error('Booking not found');
    row.status = 'cancelled';
    row.decline_reason = reason?.trim() || null;
    row.updated_at = new Date().toISOString();
  });
  return getBookingMock(bookingId);
}

export async function declineBookingMock(bookingId: string, reason: string): Promise<Booking> {
  await mockDelay();
  updateDb((db) => {
    const row = db.bookings.find((b) => b.id === bookingId);
    if (!row) throw new Error('Booking not found');
    row.status = 'declined';
    row.decline_reason = reason;
    row.updated_at = new Date().toISOString();
  });
  return getBookingMock(bookingId);
}

export async function getVendorDateConflictsMock(
  vendorId: string,
  eventDate: string,
  excludeBookingId?: string,
) {
  await mockDelay();
  const db = getDb();
  return db.bookings
    .filter(
      (b) =>
        b.vendor_id === vendorId &&
        b.event_date === eventDate &&
        ['accepted', 'payment_pending', 'paid'].includes(b.status) &&
        b.id !== excludeBookingId,
    )
    .map((row) => {
      const customer = findProfile(db, row.customer_id);
      return {
        id: row.id,
        serviceName: row.service_snapshot.name,
        plannerName:
          customer?.name?.trim() ||
          customer?.email?.trim()?.split('@')[0] ||
          'Planner',
      };
    });
}
