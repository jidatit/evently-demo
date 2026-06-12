import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Booking } from "@/features/bookings/types";
import { useBookingClaim, useSubmitClaim } from "../hooks";
import {
  getClaimStatusLabel,
  isWithinClaimBuffer,
  type ClaimType,
} from "../types";

interface NoShowClaimFormProps {
  booking: Booking;
  customerId: string;
}

export function NoShowClaimForm({ booking, customerId }: NoShowClaimFormProps) {
  const { data: existingClaim, isLoading } = useBookingClaim(booking.id);
  const submitMutation = useSubmitClaim(customerId);
  const [claimType, setClaimType] = useState<ClaimType>("no_show");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (booking.status !== "paid") return null;
  if (!isWithinClaimBuffer(booking.eventDate)) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading…
      </div>
    );
  }

  if (existingClaim) {
    const badgeClass =
      existingClaim.status === "under_review"
        ? "bg-amber-100 text-amber-900 border-amber-200"
        : existingClaim.status === "approved"
          ? "bg-purple-100 text-purple-800 border-purple-200"
          : "bg-gray-100 text-gray-700 border-gray-200";
    return (
      <div
        className={`rounded-lg border p-4 text-sm ${badgeClass}`}
      >
        <p className="font-semibold">
          Claim {getClaimStatusLabel(existingClaim.status).toLowerCase()}
        </p>
        {existingClaim.status === "under_review" && (
          <p className="mt-1">
            Your claim has been submitted and is under review. We will notify
            you of the outcome.
          </p>
        )}
        {existingClaim.status === "approved" && (
          <p className="mt-1">Your claim was approved and a refund was issued.</p>
        )}
        {existingClaim.status === "denied" && (
          <p className="mt-1">
            Your claim was reviewed and denied.
            {existingClaim.adminNotes
              ? ` Note: ${existingClaim.adminNotes}`
              : ""}
          </p>
        )}
      </div>
    );
  }

  if (submitted || submitMutation.isSuccess) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        <p className="font-semibold">Claim submitted</p>
        <p className="mt-1">
          Your claim has been submitted and is under review. We will notify you
          of the outcome.
        </p>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!description.trim()) return;
    void submitMutation.mutateAsync(
      {
        bookingId: booking.id,
        claimType,
        description: description.trim(),
      },
      { onSuccess: () => setSubmitted(true) },
    );
  };

  return (
    <section className="rounded-lg border bg-card/60 p-4 space-y-4">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Report an issue
        </h4>
        <p className="text-sm text-muted-foreground mt-1">
          Submit a claim within 48 hours of your event date for admin review.
        </p>
      </div>

      <RadioGroup
        value={claimType}
        onValueChange={(v) => setClaimType(v as ClaimType)}
        className="space-y-2"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="no_show" id="claim-no-show" />
          <Label htmlFor="claim-no-show" className="font-normal cursor-pointer">
            Vendor did not show up
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="cancellation" id="claim-cancel" />
          <Label htmlFor="claim-cancel" className="font-normal cursor-pointer">
            I need to cancel
          </Label>
        </div>
      </RadioGroup>

      <div className="space-y-2">
        <Label htmlFor="claim-description">Please describe what happened</Label>
        <Textarea
          id="claim-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the situation…"
          rows={4}
          className="resize-none"
        />
      </div>

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={!description.trim() || submitMutation.isPending}
      >
        {submitMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Submitting…
          </>
        ) : (
          "Submit Claim"
        )}
      </Button>
    </section>
  );
}
