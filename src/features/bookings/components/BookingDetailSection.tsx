import type { ComponentType, ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Calendar,
  Clock,
  CreditCard,
  MapPin,
  MessageSquare,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TrustCues } from "@/components/marketing/TrustCues";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { BookingQuoteSection } from "./BookingQuoteSection";
import {
  formatBookingEventDateRange,
  formatBookingTimeRange,
  formatPaymentLinkExpiry,
  formatSnapshotQuantityLabel,
  formatSnapshotRateLabel,
  formatSnapshotTotal,
  getSnapshotTotalCents,
  type Booking,
} from "../types";

export type BookingDetailMode = "vendor" | "planner";

interface BookingDetailSectionProps {
  booking: Booking;
  mode: BookingDetailMode;
  footer?: ReactNode;
  actionButtons?: ReactNode;
  onOpenThread?: () => void;
  onAcceptQuote?: (threadMessageId: string) => void;
  onDeclineQuote?: (threadMessageId: string, reason?: string) => void;
  onWithdrawQuote?: (threadMessageId: string, reason?: string) => void;
  isAcceptingQuote?: boolean;
  isDecliningQuote?: boolean;
  isWithdrawingQuote?: boolean;
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
}) {
  if (value == null || value === "") return null;
  return (
    <div className="flex gap-3 text-sm">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card/60 p-4 space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      {children}
    </section>
  );
}

function PricingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export function BookingDetailSection({
  booking,
  mode,
  footer,
  actionButtons,
  onOpenThread,
  onAcceptQuote,
  onDeclineQuote,
  onWithdrawQuote,
  isAcceptingQuote,
  isDecliningQuote,
  isWithdrawingQuote,
}: BookingDetailSectionProps) {
  const snap = booking.serviceSnapshot;
  const isQuote = snap.pricingType === "quote";
  const quantityLabel = formatSnapshotQuantityLabel(snap);
  const timeRange = formatBookingTimeRange(
    booking.eventTimeStart,
    booking.eventTimeEnd,
  );
  const checkoutUrl = booking.payment?.checkoutUrl;
  const linkExpired =
    !!booking.paymentLinkExpiresAt &&
    new Date(booking.paymentLinkExpiresAt).getTime() < Date.now();
  const paymentFailed =
    booking.status === "payment_pending" && booking.payment?.status === "failed";
  const totalCents = getSnapshotTotalCents(snap);

  const partyLabel = mode === "vendor" ? "Customer" : "Vendor";
  const partyName =
    mode === "vendor"
      ? booking.customerName ?? "Planner"
      : booking.vendorName ?? "Vendor";

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <BookingStatusBadge status={booking.status} />
        <p className="text-xs text-muted-foreground text-right">
          Requested{" "}
          {formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}
        </p>
      </div>

      <SectionCard title={partyLabel}>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold">{partyName}</p>
            {mode === "vendor" && booking.customerEmail && (
              <p className="text-sm text-muted-foreground truncate">
                {booking.customerEmail}
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Event details">
        <div className="space-y-3">
          <DetailRow
            icon={Calendar}
            label="Date"
            value={formatBookingEventDateRange(
              booking.eventDate,
              booking.eventEndDate,
            )}
          />
          <DetailRow icon={Clock} label="Time" value={timeRange} />
          <DetailRow
            icon={MapPin}
            label="Location"
            value={booking.eventLocation}
          />
        </div>
      </SectionCard>

      <SectionCard title="Service & pricing">
        <div className="space-y-3">
          <div>
            <p className="font-medium">{snap.name}</p>
            {snap.description?.trim() && (
              <p className="mt-1 text-sm text-muted-foreground">
                {snap.description}
              </p>
            )}
          </div>
          <Separator />
          <div className="space-y-2">
            <PricingRow
              label={
                isQuote && totalCents > 0 ? "Quoted price" : "Rate"
              }
              value={formatSnapshotRateLabel(snap)}
            />
            {quantityLabel && (
              <PricingRow label="Quantity" value={quantityLabel} />
            )}
            {snap.durationMinutes != null && snap.durationMinutes > 0 && (
              <PricingRow
                label="Service duration"
                value={`${snap.durationMinutes} min`}
              />
            )}
            <Separator />
            <PricingRow
              label="Total"
              value={
                isQuote && totalCents <= 0
                  ? "To be quoted"
                  : formatSnapshotTotal(snap).replace(/^Total: /, "")
              }
            />
          </div>
        </div>
      </SectionCard>

      {isQuote && (
        <BookingQuoteSection
          booking={booking}
          mode={mode}
          onAcceptQuote={onAcceptQuote}
          onDeclineQuote={onDeclineQuote}
          onWithdrawQuote={onWithdrawQuote}
          isAccepting={isAcceptingQuote}
          isDeclining={isDecliningQuote}
          isWithdrawing={isWithdrawingQuote}
          onOpenThread={onOpenThread}
        />
      )}

      {booking.notes?.trim() && (
        <SectionCard title="Notes from planner">
          <div className="flex gap-3 text-sm">
            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
            <p className="text-foreground whitespace-pre-wrap">{booking.notes}</p>
          </div>
        </SectionCard>
      )}

      {mode === "planner" &&
        booking.status === "declined" &&
        booking.declineReason && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <p className="font-semibold mb-1">Decline reason</p>
            <p>{booking.declineReason}</p>
          </div>
        )}

      {actionButtons}

      {mode === "planner" && booking.status === "paid" && (
        <SectionCard title="Booking confirmed">
          <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800 space-y-1">
            <p className="font-semibold">You&apos;re booked!</p>
            <p>Payment confirmed. Your booking is secured.</p>
          </div>
        </SectionCard>
      )}

      {mode === "planner" && booking.status === "refunded" && (
        <SectionCard title="Refund">
          <div className="rounded-md bg-purple-50 border border-purple-200 p-3 text-sm text-purple-900 space-y-1">
            <p className="font-semibold">Refund issued</p>
            <p>
              A full refund has been issued for this booking. It may take 5–10
              business days to appear on your statement.
            </p>
          </div>
        </SectionCard>
      )}

      {mode === "vendor" && booking.status === "paid" && (
        <SectionCard title="Payment">
          <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm space-y-2">
            <p className="font-semibold text-green-800">Payment received</p>
            {booking.payment?.amountVendorPayoutCents != null &&
              booking.payment.amountVendorPayoutCents > 0 && (
                <p className="text-green-700">
                  Your payout: $
                  {(booking.payment.amountVendorPayoutCents / 100).toFixed(2)}
                </p>
              )}
            <p className="text-xs text-green-700">
              Payout releases 48 hours after event date
            </p>
          </div>
        </SectionCard>
      )}

      {mode === "planner" && booking.status === "payment_pending" && (
        <SectionCard title="Payment">
          <div className="space-y-3">
            {paymentFailed && (
              <p className="text-sm font-medium text-red-700">Payment failed</p>
            )}
            <div className="flex gap-3 text-sm">
              <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">
                  {totalCents > 0
                    ? `$${(totalCents / 100).toFixed(2)} due`
                    : "Payment required"}
                </p>
                {booking.paymentLinkExpiresAt && (
                  <p className="text-xs text-orange-700 mt-1">
                    Payment link expires{" "}
                    {formatPaymentLinkExpiry(booking.paymentLinkExpiresAt)}
                  </p>
                )}
              </div>
            </div>
            {checkoutUrl && !linkExpired && booking.status === "payment_pending" && (
              <>
                <Button
                  className="w-full"
                  onClick={() =>
                    window.open(checkoutUrl, "_blank", "noopener,noreferrer")
                  }
                >
                  {paymentFailed ? "Retry payment" : "Pay now"}
                </Button>
                <TrustCues variant="card" showStripe />
              </>
            )}
            {linkExpired && (
              <p className="text-sm font-medium text-red-700">Payment link expired</p>
            )}
          </div>
        </SectionCard>
      )}

      {footer}
    </div>
  );
}
