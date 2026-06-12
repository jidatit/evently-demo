import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePendingQuoteMessage } from "@/features/threads/hooks";
import type { Booking, BookingStatus } from "../types";

const QUOTE_DETAIL_STATUSES: BookingStatus[] = [
  "quote_sent",
  "quote_declined",
  "quote_withdrawn",
  "payment_pending",
  "paid",
  "quote_accepted",
];

function formatPrice(cents: number | null): string {
  if (cents == null || cents <= 0) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

function statusLabel(status: string | null): string {
  switch (status) {
    case "pending":
      return "Awaiting your response";
    case "accepted":
      return "Accepted";
    case "declined":
      return "Declined";
    case "withdrawn":
      return "Withdrawn by vendor";
    default:
      return "Quote";
  }
}

function statusBadgeClass(status: string | null): string {
  switch (status) {
    case "pending":
      return "bg-blue-100 text-blue-800";
    case "accepted":
      return "bg-green-100 text-green-800";
    case "declined":
      return "bg-red-100 text-red-800";
    case "withdrawn":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export type BookingQuoteSectionMode = "vendor" | "planner";

interface BookingQuoteSectionProps {
  booking: Booking;
  mode: BookingQuoteSectionMode;
  onAcceptQuote?: (threadMessageId: string) => void;
  onDeclineQuote?: (threadMessageId: string, reason?: string) => void;
  onWithdrawQuote?: (threadMessageId: string, reason?: string) => void;
  isAccepting?: boolean;
  isDeclining?: boolean;
  isWithdrawing?: boolean;
  onOpenThread?: () => void;
}

export function BookingQuoteSection({
  booking,
  mode,
  onAcceptQuote,
  onDeclineQuote,
  onWithdrawQuote,
  isAccepting,
  isDeclining,
  isWithdrawing,
  onOpenThread,
}: BookingQuoteSectionProps) {
  const [declineOpen, setDeclineOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [reason, setReason] = useState("");

  const isQuoteService = booking.serviceSnapshot.pricingType === "quote";
  const showSection =
    isQuoteService && QUOTE_DETAIL_STATUSES.includes(booking.status);

  const { data: quoteMessage, isLoading } = usePendingQuoteMessage(
    booking.threadId ?? undefined,
    showSection && booking.status === "quote_sent",
  );

  if (!showSection) return null;

  const lockedTotalCents = booking.serviceSnapshot.totalPriceCents;
  const showLockedPrice =
    booking.status === "payment_pending" ||
    booking.status === "paid" ||
    lockedTotalCents > 0;

  const showPendingCard =
    booking.status === "quote_sent" && quoteMessage?.quoteStatus === "pending";

  const handleDecline = () => {
    if (!quoteMessage) return;
    onDeclineQuote?.(quoteMessage.id, reason.trim() || undefined);
    setDeclineOpen(false);
    setReason("");
  };

  const handleWithdraw = () => {
    if (!quoteMessage) return;
    onWithdrawQuote?.(quoteMessage.id, reason.trim() || undefined);
    setWithdrawOpen(false);
    setReason("");
  };

  if (showLockedPrice && !showPendingCard) {
    return (
      <section className="rounded-xl border-2 border-primary/20 bg-gradient-to-b from-card to-muted/30 p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Agreed quote
          </h4>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Accepted
          </Badge>
        </div>
        <p className="text-3xl font-bold tracking-tight">
          {formatPrice(lockedTotalCents)}
        </p>
        {onOpenThread && (
          <Button variant="ghost" size="sm" className="w-full" onClick={onOpenThread}>
            <MessageSquare className="h-4 w-4 mr-2" />
            View conversation
          </Button>
        )}
      </section>
    );
  }

  if (booking.status === "quote_sent" && isLoading) {
    return (
      <section className="rounded-xl border bg-muted/40 p-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading quote…
      </section>
    );
  }

  if (!showPendingCard || !quoteMessage) {
    if (booking.status === "quote_declined") {
      const declinedMessage =
        mode === "planner"
          ? "You declined the last quote. The vendor may send a revised quote."
          : "The planner declined your quote. You can send a revised quote when ready.";
      return (
        <section className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
          {declinedMessage}
        </section>
      );
    }
    if (booking.status === "quote_withdrawn") {
      const withdrawnMessage =
        mode === "planner"
          ? "The vendor withdrew their quote. They may send a new one soon."
          : "You withdrew this quote. Send a revised quote when you're ready.";
      return (
        <section className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
          {withdrawnMessage}
        </section>
      );
    }
    return null;
  }

  const showPlannerActions =
    mode === "planner" && quoteMessage.quoteStatus === "pending";
  const showVendorWithdraw =
    mode === "vendor" && quoteMessage.quoteStatus === "pending";

  return (
    <>
      <section className="rounded-xl border-2 border-primary/25 bg-gradient-to-b from-card to-muted/40 p-5 space-y-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {mode === "planner" ? "Quote from vendor" : "Your quote"}
          </h4>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${statusBadgeClass(quoteMessage.quoteStatus)}`}
          >
            {statusLabel(quoteMessage.quoteStatus)}
          </span>
        </div>

        <div>
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {formatPrice(quoteMessage.quotePriceCents)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Sent{" "}
            {formatDistanceToNow(new Date(quoteMessage.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>

        {quoteMessage.quoteNotes?.trim() && (
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Vendor notes
            </p>
            <p className="text-sm whitespace-pre-wrap text-foreground">
              {quoteMessage.quoteNotes}
            </p>
          </div>
        )}

        {showPlannerActions && (
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1"
              disabled={isAccepting || isDeclining}
              onClick={() => onAcceptQuote?.(quoteMessage.id)}
            >
              {isAccepting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Accept quote"
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={isAccepting || isDeclining}
              onClick={() => setDeclineOpen(true)}
            >
              Decline
            </Button>
          </div>
        )}

        {showVendorWithdraw && (
          <Button
            variant="outline"
            className="w-full"
            disabled={isWithdrawing}
            onClick={() => setWithdrawOpen(true)}
          >
            {isWithdrawing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Withdraw quote"
            )}
          </Button>
        )}

        {/* {onOpenThread && (
          <Button variant="ghost" size="sm" className="w-full" onClick={onOpenThread}>
            <MessageSquare className="h-4 w-4 mr-2" />
            View in messages
          </Button>
        )} */}
      </section>

      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline quote</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="detail-decline-reason">Reason (optional)</Label>
            <Textarea
              id="detail-decline-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Let the vendor know why…"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeclining}
              onClick={handleDecline}
            >
              {isDeclining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Decline quote"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw quote</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="detail-withdraw-reason">Note (optional)</Label>
            <Textarea
              id="detail-withdraw-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isWithdrawing} onClick={handleWithdraw}>
              {isWithdrawing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Withdraw"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
