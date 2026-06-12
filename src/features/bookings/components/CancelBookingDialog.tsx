import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCancelBooking } from "../hooks";
import { canCancelBooking, type Booking } from "../types";

export type CancelBookingDialogMode = "vendor" | "planner";

interface CancelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  mode: CancelBookingDialogMode;
  vendorId?: string;
  customerId?: string;
}

export function CancelBookingDialog({
  open,
  onOpenChange,
  booking,
  mode,
  vendorId,
  customerId,
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState("");
  const cancelMutation = useCancelBooking({ vendorId, customerId });

  const isPaid = booking?.status === "paid";
  const canCancel = booking ? canCancelBooking(booking.status) : false;
  const otherParty = mode === "planner" ? "vendor" : "planner";

  const handleConfirm = async () => {
    if (!booking || !canCancel) return;
    await cancelMutation.mutateAsync({
      bookingId: booking.id,
      reason: reason.trim() || undefined,
    });
    setReason("");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left text-muted-foreground">
              {isPaid ? (
                <p>
                  Cancelling after payment will issue a{" "}
                  <strong className="text-foreground">full refund</strong> to the
                  planner. This cannot be undone from the dashboard.
                </p>
              ) : (
                <p>
                  Are you sure you want to cancel this booking? The {otherParty}{" "}
                  will be notified.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Reason (optional)</Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Add a short note for the other party…"
            rows={3}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelMutation.isPending}>
            Back
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={!booking || !canCancel || cancelMutation.isPending}
            onClick={() => void handleConfirm()}
          >
            {cancelMutation.isPending ? "Cancelling…" : "Confirm cancel"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
