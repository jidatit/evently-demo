import React, { useState } from "react";
import { Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getPendingQuoteMessage } from "@/features/threads/api";
import {
  useAcceptBooking,
  useSendQuote,
  useVendorBookings,
  useWithdrawQuote,
} from "../hooks";
import {
  filterBookingsByGroup,
  SEND_QUOTE_BOOKING_STATUSES,
  type Booking,
  type BookingListFilter,
} from "../types";
import { BookingCard } from "./BookingCard";
import { BookingDeclineModal } from "./BookingDeclineModal";
import { BookingDetailSection } from "./BookingDetailSection";
import { BookingTimeline } from "./BookingTimeline";
import { ConflictWarning } from "./ConflictWarning";
import { QuoteForm } from "./QuoteForm";

const FILTERS: { value: BookingListFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

interface VendorBookingsPanelProps {
  vendorId: string;
  initialBookingId?: string | null;
  onOpenThread?: (booking: Booking) => void;
}

export function VendorBookingsPanel({
  vendorId,
  initialBookingId,
  onOpenThread,
}: VendorBookingsPanelProps) {
  const { data: bookings = [], isLoading } = useVendorBookings(vendorId);
  const acceptMutation = useAcceptBooking(vendorId);
  const sendQuoteMutation = useSendQuote(vendorId);
  const withdrawMutation = useWithdrawQuote(vendorId);

  const [filter, setFilter] = useState<BookingListFilter>("pending");
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [declineBookingId, setDeclineBookingId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [quoteFormBooking, setQuoteFormBooking] = useState<Booking | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  React.useEffect(() => {
    if (initialBookingId && bookings.length > 0) {
      const found = bookings.find((b) => b.id === initialBookingId);
      if (found) setDetailBooking(found);
    }
  }, [initialBookingId, bookings]);

  React.useEffect(() => {
    if (detailBooking) {
      const fresh = bookings.find((b) => b.id === detailBooking.id);
      if (fresh) setDetailBooking(fresh);
    }
  }, [bookings, detailBooking?.id]);

  const filtered = filterBookingsByGroup(bookings, filter);

  const handleAccept = async (bookingId: string) => {
    setAcceptingId(bookingId);
    try {
      await acceptMutation.mutateAsync(bookingId);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleSendQuote = async (quotePriceCents: number, quoteNotes?: string) => {
    if (!quoteFormBooking) return;
    await sendQuoteMutation.mutateAsync({
      bookingId: quoteFormBooking.id,
      quotePriceCents,
      quoteNotes,
    });
    setQuoteFormBooking(null);
  };

  const handleWithdrawQuote = async (booking: Booking) => {
    if (!booking.threadId) return;
    setWithdrawingId(booking.id);
    try {
      const pending = await getPendingQuoteMessage(booking.threadId);
      if (!pending) {
        throw new Error("No pending quote found");
      }
      await withdrawMutation.mutateAsync({
        bookingId: booking.id,
        threadMessageId: pending.id,
      });
    } finally {
      setWithdrawingId(null);
    }
  };

  const renderDetailActions = (booking: Booking) => {
    const isQuote = booking.serviceSnapshot.pricingType === "quote";
    if (!isQuote) return null;

    const canSend = SEND_QUOTE_BOOKING_STATUSES.includes(booking.status);

    if (!canSend) return null;

    return (
      <Button
        className="w-full"
        disabled={sendQuoteMutation.isPending}
        onClick={() => setQuoteFormBooking(booking)}
      >
        {sendQuoteMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Send quote"
        )}
      </Button>
    );
  };

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading bookings…
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/80 text-muted-foreground hover:bg-white",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <Calendar className="h-10 w-10 mx-auto mb-4 text-purple-500" />
              <h3 className="font-semibold mb-2">No bookings here</h3>
              <p className="text-sm text-muted-foreground">
                {filter === "pending"
                  ? "New requests from planners will appear here."
                  : "Nothing in this group yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                mode="vendor"
                isAccepting={acceptingId === booking.id}
                isSendingQuote={
                  sendQuoteMutation.isPending &&
                  quoteFormBooking?.id === booking.id
                }
                isWithdrawingQuote={withdrawingId === booking.id}
                onViewDetails={() => setDetailBooking(booking)}
                onAccept={() => void handleAccept(booking.id)}
                onDecline={() => setDeclineBookingId(booking.id)}
                onSendQuote={() => setQuoteFormBooking(booking)}
                onWithdrawQuote={() => void handleWithdrawQuote(booking)}
                onOpenThread={
                  onOpenThread ? () => onOpenThread(booking) : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      <Sheet
        open={!!detailBooking}
        onOpenChange={(open) => !open && setDetailBooking(null)}
      >
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {detailBooking && (
            <>
              <SheetHeader>
                <SheetTitle>{detailBooking.serviceSnapshot.name}</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {detailBooking.customerName ?? "Planner"}
                </p>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <BookingDetailSection
                  booking={detailBooking}
                  mode="vendor"
                  actionButtons={renderDetailActions(detailBooking)}
                  onOpenThread={
                    onOpenThread
                      ? () => onOpenThread(detailBooking)
                      : undefined
                  }
                  onWithdrawQuote={(threadMessageId, reason) =>
                    void withdrawMutation.mutateAsync({
                      bookingId: detailBooking.id,
                      threadMessageId,
                      reason,
                    })
                  }
                  isWithdrawingQuote={withdrawingId === detailBooking.id}
                  footer={
                    <ConflictWarning
                      vendorId={vendorId}
                      eventDate={detailBooking.eventDate}
                      excludeBookingId={detailBooking.id}
                    />
                  }
                />
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3">Status history</h4>
                  <BookingTimeline
                    bookingId={detailBooking.id}
                    view="vendor"
                  />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {declineBookingId && (
        <BookingDeclineModal
          open={!!declineBookingId}
          onOpenChange={(open) => !open && setDeclineBookingId(null)}
          bookingId={declineBookingId}
          vendorId={vendorId}
        />
      )}

      <QuoteForm
        open={!!quoteFormBooking}
        onOpenChange={(open) => !open && setQuoteFormBooking(null)}
        onSubmit={(cents, notes) => void handleSendQuote(cents, notes)}
        isSubmitting={sendQuoteMutation.isPending}
        serviceName={quoteFormBooking?.serviceSnapshot.name}
      />

    </>
  );
}
