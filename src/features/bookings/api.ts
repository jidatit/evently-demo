import type {
  AcceptQuoteResult,
  Booking,
  BookingStatusHistoryEntry,
  CheckoutBookingStatus,
  CreateBookingPayload,
  QuoteActionPayload,
  SendQuotePayload,
  SendQuoteResult,
} from "./types";
import {
  acceptBookingMock,
  acceptQuoteMock,
  cancelBookingMock,
  createBookingMock,
  declineBookingMock,
  declineQuoteMock,
  getBookingMock,
  getBookingStatusHistoryMock,
  getCheckoutBookingStatusMock,
  getPlannerBookingsMock,
  getVendorBookingsMock,
  getVendorDateConflictsMock,
  sendQuoteMock,
  withdrawQuoteMock,
} from "@/mocks/handlers/bookings";
import { mockGetSession } from "@/mocks/handlers/auth";

async function requireUserId(): Promise<string> {
  const { session } = await mockGetSession();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function getPaymentForBooking(bookingId: string) {
  const booking = await getBookingMock(bookingId);
  if (!booking.payment) return null;
  return booking.payment;
}

export async function getBookingStatusByCheckoutSession(
  sessionId: string,
): Promise<CheckoutBookingStatus | null> {
  return getCheckoutBookingStatusMock(sessionId);
}

export async function createBooking(
  payload: CreateBookingPayload,
): Promise<Booking> {
  const customerId = await requireUserId();
  return createBookingMock(payload, customerId);
}

export async function acceptBooking(
  bookingId: string,
): Promise<{ booking: Booking; paymentUrl: string }> {
  return acceptBookingMock(bookingId);
}

export async function sendQuote(
  payload: SendQuotePayload,
): Promise<SendQuoteResult> {
  return sendQuoteMock(payload);
}

export async function acceptQuote(
  payload: QuoteActionPayload,
): Promise<AcceptQuoteResult> {
  return acceptQuoteMock(payload);
}

export async function declineQuote(
  payload: QuoteActionPayload,
): Promise<Booking> {
  return declineQuoteMock(payload);
}

export async function withdrawQuote(
  payload: QuoteActionPayload,
): Promise<Booking> {
  return withdrawQuoteMock(payload);
}

export async function cancelBooking(
  bookingId: string,
  reason?: string,
): Promise<Booking> {
  return cancelBookingMock(bookingId, reason);
}

export async function declineBooking(
  bookingId: string,
  reason: string,
): Promise<Booking> {
  return declineBookingMock(bookingId, reason);
}

export async function getVendorBookings(vendorId: string): Promise<Booking[]> {
  return getVendorBookingsMock(vendorId);
}

export async function getPlannerBookings(
  customerId: string,
): Promise<Booking[]> {
  return getPlannerBookingsMock(customerId);
}

export async function getBooking(bookingId: string): Promise<Booking> {
  return getBookingMock(bookingId);
}

export async function getBookingStatusHistory(
  bookingId: string,
): Promise<BookingStatusHistoryEntry[]> {
  return getBookingStatusHistoryMock(bookingId);
}

export type DateConflict = {
  id: string;
  serviceName: string;
  plannerName: string;
};

export async function getVendorDateConflicts(
  vendorId: string,
  eventDate: string,
  excludeBookingId?: string,
): Promise<DateConflict[]> {
  return getVendorDateConflictsMock(vendorId, eventDate, excludeBookingId);
}
