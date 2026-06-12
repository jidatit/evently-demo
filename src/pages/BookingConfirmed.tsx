import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  bookingKeys,
  useCheckoutBookingStatus,
} from "@/features/bookings/hooks";

const MAX_POLLS = 5;
const POLL_INTERVAL_MS = 3000;

export default function BookingConfirmed() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id")?.trim() ?? "";
  const queryClient = useQueryClient();
  const [pollCount, setPollCount] = React.useState(0);
  const [pollingDone, setPollingDone] = React.useState(false);

  const { data, isLoading, isError, refetch } = useCheckoutBookingStatus(
    sessionId || undefined,
  );
  console.log("data", data);
  const isPaid = data?.bookingStatus === "paid";
  const isPending = data?.bookingStatus === "payment_pending";

  React.useEffect(() => {
    if (!sessionId || isPaid || pollingDone) return;

    if (pollCount >= MAX_POLLS) {
      setPollingDone(true);
      return;
    }

    const timer = window.setTimeout(() => {
      void refetch().then(() => {
        setPollCount((c) => c + 1);
      });
    }, POLL_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [sessionId, isPaid, pollingDone, pollCount, refetch]);

  React.useEffect(() => {
    if (isPaid && data?.bookingId) {
      queryClient.invalidateQueries({
        queryKey: bookingKeys.detail(data.bookingId),
      });
    }
  }, [isPaid, data?.bookingId, queryClient]);

  const eventDateLabel = data?.eventDate
    ? format(new Date(data.eventDate + "T12:00:00"), "MMMM d, yyyy")
    : null;

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-primary/10 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <h1 className="text-xl font-bold">Invalid confirmation link</h1>
            <p className="text-muted-foreground text-sm">
              This page requires a payment session. Check your bookings dashboard
              for status updates.
            </p>
            <Button asChild className="w-full">
              <Link to="/dashboard?tab=bookings">View my bookings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-primary/10 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h1 className="text-xl font-bold">Confirming your payment…</h1>
            <p className="text-muted-foreground text-sm">
              This usually takes just a moment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-primary/10 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <h1 className="text-xl font-bold">Could not load booking</h1>
            <p className="text-muted-foreground text-sm">
              We could not find a booking for this payment session. If you
              completed payment, check your bookings dashboard.
            </p>
            <Button asChild className="w-full">
              <Link to="/dashboard?tab=bookings">View my bookings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPaid) {
    return (
      <div className="min-h-screen bg-primary/10 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle className="h-14 w-14 text-green-600 mx-auto" />
            <h1 className="text-2xl font-bold">You&apos;re booked!</h1>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">{data.vendorName}</p>
              <p>{data.serviceName}</p>
              {eventDateLabel && <p>{eventDateLabel}</p>}
            </div>
            <Button asChild className="w-full">
              <Link to="/dashboard?tab=bookings">View Booking</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPending && !pollingDone) {
    return (
      <div className="min-h-screen bg-primary/10 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h1 className="text-xl font-bold">Confirming your payment…</h1>
            <p className="text-muted-foreground text-sm">
              This usually takes just a moment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary/10 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-8 text-center space-y-4">
          <Loader2 className="h-10 w-10 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold">Payment is being processed</h1>
          <p className="text-muted-foreground text-sm">
            Your payment may still be processing. Check your bookings dashboard
            for the latest status.
          </p>
          <Button asChild className="w-full">
            <Link to="/dashboard?tab=bookings">View my bookings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
