import { format } from "date-fns";

export type BookingStatus =
  | "requested"
  | "quote_sent"
  | "quote_accepted"
  | "quote_declined"
  | "quote_withdrawn"
  | "accepted"
  | "payment_pending"
  | "paid"
  | "completed"
  | "declined"
  | "cancelled"
  | "expired"
  | "refunded";

export type PricingType = "per_event" | "per_hour" | "per_day" | "quote";

export type ServiceSnapshot = {
  name: string;
  description: string | null;
  pricingType: PricingType | string;
  rateCents: number;
  quantity: number;
  quantityUnit: "event" | "hours" | "days" | "quote" | string;
  totalPriceCents: number;
  durationMinutes: number | null;
  /** @deprecated Legacy snapshots only */
  priceCents?: number;
};

export type BookingPayment = {
  id: string;
  checkoutUrl: string | null;
  status: string;
  amountTotalCents: number;
  amountVendorPayoutCents?: number;
  stripeCheckoutSessionId?: string | null;
  payoutReleasedAt?: string | null;
};

export type CheckoutBookingStatus = {
  bookingId: string;
  bookingStatus: string;
  vendorName: string;
  serviceName: string;
  eventDate: string;
};

export type Booking = {
  id: string;
  idempotencyKey: string;
  vendorId: string;
  customerId: string;
  threadId: string | null;
  serviceId: string | null;
  serviceSnapshot: ServiceSnapshot;
  eventDate: string;
  eventEndDate: string | null;
  eventTimeStart: string | null;
  eventTimeEnd: string | null;
  eventLocation: string | null;
  notes: string | null;
  status: BookingStatus;
  declineReason: string | null;
  declinedBy: string | null;
  paymentLinkExpiresAt: string | null;
  payoutReleasedAt?: string | null;
  vendorCategoryId: string | null;
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  customerEmail?: string;
  vendorName?: string;
  payment?: BookingPayment | null;
};

export type BookingStatusHistoryEntry = {
  id: string;
  bookingId: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string | null;
  actorType: "customer" | "vendor" | "system" | "admin";
  reason: string | null;
  createdAt: string;
};

export type CreateBookingPayload = {
  idempotencyKey: string;
  vendorId: string;
  serviceId: string;
  eventDate: string;
  eventEndDate?: string;
  eventTimeStart?: string;
  eventTimeEnd?: string;
  eventLocation?: string;
  notes?: string;
};

export type SendQuotePayload = {
  bookingId: string;
  quotePriceCents: number;
  quoteNotes?: string;
};

export type QuoteActionPayload = {
  bookingId: string;
  threadMessageId: string;
  reason?: string;
};

export type QuoteMessage = {
  id: string;
  threadId: string;
  senderId: string;
  quotePriceCents: number | null;
  quoteNotes: string | null;
  quoteStatus: string | null;
  body: string;
  createdAt: string;
};

export type SendQuoteResult = {
  booking: Booking;
  quoteMessage: QuoteMessage;
};

export type AcceptQuoteResult = {
  booking: Booking;
  paymentUrl: string;
  quoteMessage?: QuoteMessage;
};

export type BookingListFilter =
  | "pending"
  | "upcoming"
  | "past"
  | "active"
  | "confirmed";

export function getStatusBadgeConfig(status: BookingStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "requested":
      return { label: "Pending", className: "bg-yellow-100 text-yellow-800" };
    case "accepted":
      return { label: "Accepted", className: "bg-blue-100 text-blue-800" };
    case "payment_pending":
      return { label: "Awaiting Payment", className: "bg-orange-100 text-orange-800" };
    case "paid":
      return { label: "Confirmed", className: "bg-green-100 text-green-800" };
    case "completed":
      return { label: "Completed", className: "bg-gray-100 text-gray-800" };
    case "declined":
      return { label: "Declined", className: "bg-red-100 text-red-800" };
    case "cancelled":
      return { label: "Cancelled", className: "bg-gray-100 text-gray-600" };
    case "expired":
      return { label: "Expired", className: "bg-gray-100 text-gray-600" };
    case "refunded":
      return { label: "Refunded", className: "bg-purple-100 text-purple-800" };
    case "quote_sent":
      return { label: "Quote Sent", className: "bg-blue-100 text-blue-800" };
    case "quote_accepted":
      return { label: "Quote Accepted", className: "bg-green-100 text-green-800" };
    case "quote_declined":
      return { label: "Quote Declined", className: "bg-red-100 text-red-800" };
    case "quote_withdrawn":
      return { label: "Quote Withdrawn", className: "bg-gray-100 text-gray-600" };
    default:
      return { label: status, className: "bg-gray-100 text-gray-800" };
  }
}

export function filterBookingsByGroup(
  bookings: Booking[],
  filter: BookingListFilter,
): Booking[] {
  switch (filter) {
    case "pending":
      return bookings.filter((b) =>
        [
          "requested",
          "quote_sent",
          "quote_declined",
          "quote_withdrawn",
        ].includes(b.status),
      );
    case "upcoming":
      return bookings.filter((b) =>
        ["accepted", "payment_pending", "paid", "quote_accepted"].includes(
          b.status,
        ),
      );
    case "past":
      return bookings.filter((b) =>
        ["completed", "declined", "cancelled", "expired", "refunded"].includes(
          b.status,
        )
      );
    case "active":
      return bookings.filter((b) =>
        [
          "requested",
          "quote_sent",
          "quote_declined",
          "quote_withdrawn",
          "accepted",
          "payment_pending",
          "paid",
        ].includes(b.status),
      );
    case "confirmed":
      return bookings.filter((b) =>
        ["accepted", "payment_pending", "paid", "completed"].includes(b.status)
      );
    default:
      return bookings;
  }
}

export function formatSnapshotRateLabel(snap: ServiceSnapshot): string {
  if (snap.pricingType === "quote") {
    const locked = getSnapshotTotalCents(snap);
    if (locked > 0) {
      return `$${(locked / 100).toFixed(2)}`;
    }
    return "Price: To be quoted";
  }
  const rate = snap.rateCents || snap.priceCents || 0;
  const amount = `$${(rate / 100).toFixed(2)}`;
  switch (snap.pricingType) {
    case "per_hour":
      return `${amount}/hr`;
    case "per_day":
      return `${amount}/day`;
    case "per_event":
      return `${amount}/event`;
    default:
      return amount;
  }
}

export function formatSnapshotQuantityLabel(snap: ServiceSnapshot): string | null {
  if (snap.pricingType === "quote") return null;
  const unit = snap.quantityUnit;
  const q = snap.quantity;
  if (unit === "event" || snap.pricingType === "per_event") return "1 event";
  if (unit === "hours") {
    return `${q} ${q === 1 ? "hour" : "hours"}`;
  }
  if (unit === "days") {
    return `${q} ${q === 1 ? "day" : "days"}`;
  }
  return null;
}

export function getSnapshotTotalCents(snap: ServiceSnapshot): number {
  if (snap.pricingType === "quote") {
    return snap.totalPriceCents || snap.priceCents || 0;
  }
  return snap.totalPriceCents || snap.priceCents || 0;
}

export function formatSnapshotTotal(snap: ServiceSnapshot): string {
  const total = getSnapshotTotalCents(snap);
  if (snap.pricingType === "quote" && total <= 0) {
    return "Total: To be quoted by vendor";
  }
  return `Total: $${(total / 100).toFixed(2)}`;
}

export const SEND_QUOTE_BOOKING_STATUSES: BookingStatus[] = [
  "requested",
  "quote_declined",
  "quote_withdrawn",
];

/** Pre-payment statuses that allow cancellation (matches cancel-booking edge function). */
export const PRE_PAYMENT_CANCELLABLE_STATUSES: BookingStatus[] = [
  "requested",
  "quote_sent",
  "quote_accepted",
  "quote_declined",
  "quote_withdrawn",
  "accepted",
  "payment_pending",
];

export function canCancelBooking(status: BookingStatus): boolean {
  if (status === "completed") return false;
  return PRE_PAYMENT_CANCELLABLE_STATUSES.includes(status);
}

/** Timeline row label (richer copy than status badge). */
export function getTimelineStatusLabel(status: string): string {
  switch (status) {
    case "requested":
      return "Booking requested";
    case "accepted":
      return "Accepted by vendor";
    case "payment_pending":
      return "Awaiting payment";
    case "paid":
      return "Payment confirmed";
    case "completed":
      return "Booking completed";
    case "declined":
      return "Declined by vendor";
    case "cancelled":
      return "Cancelled";
    case "expired":
      return "Payment link expired";
    case "refunded":
      return "Refunded";
    case "quote_sent":
      return "Quote sent by vendor";
    case "quote_accepted":
      return "Quote accepted";
    case "quote_declined":
      return "Quote declined";
    case "quote_withdrawn":
      return "Quote withdrawn";
    default:
      return status;
  }
}

export function formatPaymentLinkExpiry(iso: string): string {
  return format(new Date(iso), "MMM d, yyyy 'at' h:mm a");
}

export function formatBookingEventDateRange(
  eventDate: string,
  eventEndDate: string | null,
): string {
  const startLabel = format(new Date(eventDate + "T12:00:00"), "MMM d, yyyy");
  if (!eventEndDate || eventEndDate === eventDate) {
    return startLabel;
  }
  const endLabel = format(new Date(eventEndDate + "T12:00:00"), "MMM d, yyyy");
  return `${startLabel} — ${endLabel}`;
}

export function formatBookingTimeRange(
  start: string | null,
  end: string | null,
): string | null {
  if (!start) return null;
  if (end) return `${start} – ${end}`;
  return start;
}
