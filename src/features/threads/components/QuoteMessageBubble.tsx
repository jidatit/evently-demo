import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/features/bookings/types";
import type { ThreadMessage } from "../types";

export type QuoteBubbleMode = "vendor" | "planner";

interface QuoteMessageBubbleProps {
  message: ThreadMessage;
  mode: QuoteBubbleMode;
  bookingStatus?: BookingStatus | null;
  onAccept?: () => void;
  onDecline?: (reason?: string) => void;
  onWithdraw?: (reason?: string) => void;
  isAccepting?: boolean;
  isDeclining?: boolean;
  isWithdrawing?: boolean;
}

function formatPrice(cents: number | null): string {
  if (cents == null || cents <= 0) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

function statusLabel(status: string | null): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "declined":
      return "Declined";
    case "withdrawn":
      return "Withdrawn";
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

export function QuoteMessageBubble({
  message,
  mode,
  bookingStatus,
  onAccept,
  onDecline,
  onWithdraw,
  isAccepting,
  isDeclining,
  isWithdrawing,
}: QuoteMessageBubbleProps) {
  const [declineOpen, setDeclineOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [reason, setReason] = useState("");

  const when = formatDistanceToNow(new Date(message.createdAt), {
    addSuffix: true,
  });
  const isPending = message.quoteStatus === "pending";
  const showPlannerActions =
    mode === "planner" &&
    isPending &&
    bookingStatus === "quote_sent" &&
    !!onAccept &&
    !!onDecline;
  const showVendorWithdraw =
    mode === "vendor" &&
    isPending &&
    bookingStatus === "quote_sent" &&
    !!onWithdraw;

  const handleDecline = () => {
    onDecline?.(reason.trim() || undefined);
    setDeclineOpen(false);
    setReason("");
  };

  const handleWithdraw = () => {
    onWithdraw?.(reason.trim() || undefined);
    setWithdrawOpen(false);
    setReason("");
  };

  return (
    <>
      <div className="flex w-full justify-center">
        <div
          className={cn(
            "w-full max-w-sm rounded-xl border-2 border-primary/25 bg-gradient-to-b from-card to-muted/40 px-5 py-4 shadow-md",
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <Badge variant="outline" className="font-semibold">
              Quote
            </Badge>
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                statusBadgeClass(message.quoteStatus),
              )}
            >
              {statusLabel(message.quoteStatus)}
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {formatPrice(message.quotePriceCents)}
          </p>
          {message.quoteNotes?.trim() && (
            <div className="mt-3 rounded-lg bg-muted/60 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Notes
              </p>
              <p className="text-sm whitespace-pre-wrap text-foreground">
                {message.quoteNotes}
              </p>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{when}</p>

          {showPlannerActions && (
            <div className="mt-4 flex gap-2">
              <Button
                className="flex-1"
                disabled={isAccepting || isDeclining}
                onClick={onAccept}
              >
                {isAccepting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Accept"
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
              className="mt-4 w-full"
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
        </div>
      </div>

      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline quote</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="decline-reason">Reason (optional)</Label>
            <Textarea
              id="decline-reason"
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
            <Label htmlFor="withdraw-reason">Note (optional)</Label>
            <Textarea
              id="withdraw-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional message for the planner…"
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
