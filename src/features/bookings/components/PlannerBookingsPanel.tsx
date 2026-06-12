import React, { useState } from "react";
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { NoShowClaimForm } from "@/features/claims/components/NoShowClaimForm";
import { useAcceptQuote, useDeclineQuote, usePlannerBookings } from "../hooks";
import {
  filterBookingsByGroup,
  type Booking,
  type BookingListFilter,
} from "../types";
import { BookingCard } from "./BookingCard";
import { BookingDetailSection } from "./BookingDetailSection";
import { BookingTimeline } from "./BookingTimeline";

const FILTERS: { value: BookingListFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "confirmed", label: "Confirmed" },
  { value: "past", label: "Past" },
];

interface PlannerBookingsPanelProps {
  customerId: string;
  initialBookingId?: string | null;
  onOpenThread?: (booking: Booking) => void;
}

export function PlannerBookingsPanel({
  customerId,
  initialBookingId,
  onOpenThread,
}: PlannerBookingsPanelProps) {
  const { data: bookings = [], isLoading } = usePlannerBookings(customerId);
  const acceptQuoteMutation = useAcceptQuote(customerId);
  const declineQuoteMutation = useDeclineQuote(customerId);
  const [filter, setFilter] = useState<BookingListFilter>("active");
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

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
              <h3 className="font-semibold mb-2">No bookings yet</h3>
              <p className="text-sm text-muted-foreground">
                Visit a vendor profile to request a booking.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                mode="planner"
                onViewDetails={() => setDetailBooking(booking)}
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
                  {detailBooking.vendorName ?? "Vendor"}
                </p>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <BookingDetailSection
                  booking={detailBooking}
                  mode="planner"
                  onOpenThread={
                    onOpenThread
                      ? () => onOpenThread(detailBooking)
                      : undefined
                  }
                  onAcceptQuote={(threadMessageId) =>
                    void acceptQuoteMutation.mutateAsync({
                      bookingId: detailBooking.id,
                      threadMessageId,
                    })
                  }
                  onDeclineQuote={(threadMessageId, reason) =>
                    void declineQuoteMutation.mutateAsync({
                      bookingId: detailBooking.id,
                      threadMessageId,
                      reason,
                    })
                  }
                  isAcceptingQuote={acceptQuoteMutation.isPending}
                  isDecliningQuote={declineQuoteMutation.isPending}
                />
                <NoShowClaimForm
                  booking={detailBooking}
                  customerId={customerId}
                />
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3">Status history</h4>
                  <BookingTimeline
                    bookingId={detailBooking.id}
                    view="planner"
                  />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
