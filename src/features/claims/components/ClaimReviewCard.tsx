import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatBookingEventDateRange } from "@/features/bookings/types";
import { useProcessClaim } from "../hooks";
import {
  getClaimStatusLabel,
  getClaimTypeLabel,
  type BookingClaim,
} from "../types";

interface ClaimReviewCardProps {
  claim: BookingClaim;
}

export function ClaimReviewCard({ claim }: ClaimReviewCardProps) {
  const processMutation = useProcessClaim();
  const [adminNotes, setAdminNotes] = useState(claim.adminNotes ?? "");
  const isPending = claim.status === "under_review";

  const statusBadgeClass =
    claim.status === "under_review"
      ? "bg-amber-100 text-amber-800"
      : claim.status === "approved"
        ? "bg-red-100 text-red-800"
        : "bg-gray-100 text-gray-700";

  const eventDateLabel = claim.bookingEventDate
    ? formatBookingEventDateRange(claim.bookingEventDate, null)
    : "—";

  const handleApprove = () => {
    void processMutation.mutateAsync({
      claimId: claim.id,
      action: "approve",
      adminNotes: adminNotes || undefined,
    });
  };

  const handleDeny = () => {
    void processMutation.mutateAsync({
      claimId: claim.id,
      action: "deny",
      adminNotes: adminNotes || undefined,
    });
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">
            {getClaimTypeLabel(claim.claimType)}
          </CardTitle>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass}`}
          >
            {getClaimStatusLabel(claim.status)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Submitted{" "}
          {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-1">
          <p>
            <span className="text-muted-foreground">Planner:</span>{" "}
            {claim.plannerName ?? claim.submitterName ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Vendor:</span>{" "}
            {claim.vendorName ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Service:</span>{" "}
            {claim.serviceName ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Event date:</span>{" "}
            {eventDateLabel}
          </p>
        </div>

        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Description
          </p>
          <p className="whitespace-pre-wrap">{claim.description}</p>
        </div>

        {claim.adminNotes && !isPending && (
          <p className="text-muted-foreground">
            <span className="font-medium">Admin notes:</span> {claim.adminNotes}
          </p>
        )}

        {isPending && (
          <>
            <div className="space-y-2">
              <Label htmlFor={`notes-${claim.id}`}>Admin notes (optional)</Label>
              <Textarea
                id={`notes-${claim.id}`}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes for the record…"
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={processMutation.isPending}
                  >
                    {processMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Approve — Issue Refund"
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Issue full refund?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will issue a full refund to the planner. This cannot
                      be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleApprove}
                    >
                      Approve refund
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                variant="secondary"
                className="flex-1"
                onClick={handleDeny}
                disabled={processMutation.isPending}
              >
                {processMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Deny Claim"
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
