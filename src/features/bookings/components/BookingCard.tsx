import { Calendar, Clock, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useExpiryCountdown } from "../hooks";
import {
  formatBookingEventDateRange,
  formatPaymentLinkExpiry,
  formatSnapshotQuantityLabel,
  formatSnapshotRateLabel,
  formatSnapshotTotal,
  getSnapshotTotalCents,
  SEND_QUOTE_BOOKING_STATUSES,
  type Booking,
} from "../types";
import { BookingStatusBadge } from "./BookingStatusBadge";

export type BookingCardMode = "vendor" | "planner";

interface BookingCardProps {
  booking: Booking;
  mode: BookingCardMode;
  onViewDetails?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onSendQuote?: () => void;
  onWithdrawQuote?: () => void;
  onOpenThread?: () => void;
  isAccepting?: boolean;
  isSendingQuote?: boolean;
  isWithdrawingQuote?: boolean;
}

function PaymentExpiryCountdown({ expiresAt }: { expiresAt: string | null }) {
  const label = useExpiryCountdown(expiresAt);
  if (!expiresAt) return null;
  return <p className="text-xs font-medium text-orange-800">{label}</p>;
}

export function BookingCard({
  booking,
  mode,
  onViewDetails,
  onAccept,
  onDecline,
  onSendQuote,
  onWithdrawQuote,
  onOpenThread,
  isAccepting,
  isSendingQuote,
  isWithdrawingQuote,
}: BookingCardProps) {
  const snap = booking.serviceSnapshot;
  const partyName =
    mode === "vendor"
      ? booking.customerName ?? "Planner"
      : booking.vendorName ?? "Vendor";
  const isQuote = snap.pricingType === "quote";
  const showVendorFixedActions =
    mode === "vendor" && booking.status === "requested" && !isQuote;
  const showVendorSendQuote =
    mode === "vendor" &&
    isQuote &&
    SEND_QUOTE_BOOKING_STATUSES.includes(booking.status);
  const showVendorWithdraw =
    mode === "vendor" && isQuote && booking.status === "quote_sent";
  const showVendorDecline =
    mode === "vendor" &&
    (booking.status === "requested" ||
      SEND_QUOTE_BOOKING_STATUSES.includes(booking.status));
  const checkoutUrl = booking.payment?.checkoutUrl;
  const linkExpired =
    !!booking.paymentLinkExpiresAt &&
    new Date(booking.paymentLinkExpiresAt).getTime() < Date.now();
  const paymentFailed =
    booking.status === "payment_pending" && booking.payment?.status === "failed";
  const totalCents = getSnapshotTotalCents(snap);
  const payoutReleasedAt =
    booking.payoutReleasedAt ?? booking.payment?.payoutReleasedAt ?? null;
  const payoutCents = booking.payment?.amountVendorPayoutCents ?? 0;

  const quantityLabel = formatSnapshotQuantityLabel(snap);

  return (
    <Card
      className="bg-white/80 backdrop-blur-sm border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onViewDetails}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-foreground">{partyName}</p>
            <p className="text-sm text-muted-foreground">{snap.name}</p>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatBookingEventDateRange(booking.eventDate, booking.eventEndDate)}
          </span>
          {booking.eventTimeStart && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {booking.eventTimeStart}
              {booking.eventTimeEnd ? ` — ${booking.eventTimeEnd}` : ""}
            </span>
          )}
          {booking.eventLocation && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {booking.eventLocation}
            </span>
          )}
        </div>

        <div className="text-sm space-y-0.5">
          <p className="font-medium">{formatSnapshotRateLabel(snap)}</p>
          {quantityLabel && (
            <p className="text-muted-foreground">{quantityLabel}</p>
          )}
          <p className="font-medium">{formatSnapshotTotal(snap)}</p>
        </div>

        {booking.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2">{booking.notes}</p>
        )}

        {mode === "planner" && booking.status === "declined" && booking.declineReason && (
          <p className="text-sm rounded-md bg-red-50 border border-red-100 p-2 text-red-800">
            <strong>Decline reason:</strong> {booking.declineReason}
          </p>
        )}

        {booking.status === "expired" && (
          <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
            <p className="font-semibold">Expired</p>
            <p className="text-amber-800">Payment was not completed in time.</p>
          </div>
        )}

        {mode === "planner" && booking.status === "quote_sent" && (
          <div onClick={(e) => e.stopPropagation()}>
            <Button className="w-full" onClick={onViewDetails}>
              Review quote
            </Button>
          </div>
        )}

        {mode === "planner" && booking.status === "paid" && (
          <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
            <p className="font-semibold">Confirmed</p>
            <p className="text-green-700">Payment received — you&apos;re booked!</p>
          </div>
        )}

        {mode === "vendor" && booking.status === "paid" && (
          <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm space-y-1">
            <p className="font-semibold text-green-800">Payment received</p>
            {payoutCents > 0 && (
              <p className="text-green-700">
                Your payout: ${(payoutCents / 100).toFixed(2)}
              </p>
            )}
            <p className="text-xs text-green-700">
              Payout pending — releases 48 hours after event
            </p>
          </div>
        )}

        {mode === "vendor" && booking.status === "completed" && (
          <div className="rounded-md bg-slate-50 border border-slate-200 p-3 text-sm space-y-1">
            <p className="font-semibold text-slate-800">Payout released</p>
            {payoutReleasedAt && payoutCents > 0 && (
              <p className="text-slate-700">
                ${(payoutCents / 100).toFixed(2)} sent to your Stripe account
              </p>
            )}
            {!payoutReleasedAt && (
              <p className="text-xs text-muted-foreground">
                Transfer processing — check your Stripe dashboard for status.
              </p>
            )}
          </div>
        )}

        {mode === "planner" && booking.status === "payment_pending" && (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            {paymentFailed && (
              <p className="text-sm font-medium text-red-700">Payment failed</p>
            )}
            <PaymentExpiryCountdown expiresAt={booking.paymentLinkExpiresAt} />
            {booking.paymentLinkExpiresAt && (
              <p className="text-xs text-orange-700/90">
                Deadline: {formatPaymentLinkExpiry(booking.paymentLinkExpiresAt)}
              </p>
            )}
            {checkoutUrl && !linkExpired && booking.status === "payment_pending" && (
              <Button
                className="w-full"
                onClick={() =>
                  window.open(checkoutUrl, "_blank", "noopener,noreferrer")
                }
              >
                {paymentFailed ? "Retry payment" : "Pay now"}
                {totalCents > 0
                  ? ` — $${(totalCents / 100).toFixed(2)}`
                  : ""}
              </Button>
            )}
            {linkExpired && (
              <p className="text-sm font-medium text-red-700">Payment link expired</p>
            )}
          </div>
        )}

        {(showVendorFixedActions ||
          showVendorSendQuote ||
          showVendorWithdraw ||
          showVendorDecline) && (
          <div
            className="flex flex-wrap gap-2 pt-1"
            onClick={(e) => e.stopPropagation()}
          >
            {showVendorFixedActions && (
              <Button
                className="flex-1 min-w-[120px]"
                disabled={isAccepting}
                onClick={onAccept}
              >
                {isAccepting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Accept"
                )}
              </Button>
            )}
            {showVendorSendQuote && (
              <Button
                className="flex-1 min-w-[120px]"
                disabled={isSendingQuote}
                onClick={onSendQuote}
              >
                {isSendingQuote ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send quote"
                )}
              </Button>
            )}
            {showVendorWithdraw && (
              <Button
                variant="secondary"
                className="flex-1 min-w-[120px]"
                disabled={isWithdrawingQuote}
                onClick={onWithdrawQuote}
              >
                {isWithdrawingQuote ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Withdraw quote"
                )}
              </Button>
            )}
            {showVendorDecline && (
              <Button
                variant="outline"
                className="flex-1 min-w-[120px]"
                onClick={onDecline}
              >
                Decline
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
