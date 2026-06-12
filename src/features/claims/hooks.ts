import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bookingKeys } from "@/features/bookings/hooks";
import {
  getClaimForBooking,
  getClaims,
  processClaim,
  submitClaim,
} from "./api";
import type { ClaimType } from "./types";

export const claimKeys = {
  all: ["claims"] as const,
  list: () => [...claimKeys.all, "list"] as const,
  forBooking: (bookingId: string) =>
    [...claimKeys.all, "booking", bookingId] as const,
};

export function useBookingClaim(bookingId?: string) {
  return useQuery({
    queryKey: claimKeys.forBooking(bookingId ?? ""),
    queryFn: () => getClaimForBooking(bookingId!),
    enabled: !!bookingId,
    staleTime: 30 * 1000,
  });
}

export function useSubmitClaim(customerId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      claimType,
      description,
    }: {
      bookingId: string;
      claimType: ClaimType;
      description: string;
    }) => {
      if (!customerId) {
        throw new Error("You must be signed in to submit a claim");
      }
      return submitClaim(bookingId, customerId, claimType, description);
    },
    onSuccess: (claim) => {
      queryClient.invalidateQueries({
        queryKey: claimKeys.forBooking(claim.bookingId),
      });
      if (customerId) {
        queryClient.invalidateQueries({
          queryKey: bookingKeys.plannerList(customerId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: bookingKeys.detail(claim.bookingId),
      });
      toast.success("Claim submitted — under review");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit claim");
    },
  });
}

export function useAdminClaims() {
  return useQuery({
    queryKey: claimKeys.list(),
    queryFn: getClaims,
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useProcessClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      claimId,
      action,
      adminNotes,
    }: {
      claimId: string;
      action: "approve" | "deny";
      adminNotes?: string;
    }) => processClaim(claimId, action, adminNotes),
    onSuccess: (result, vars) => {
      queryClient.invalidateQueries({ queryKey: claimKeys.all });
      const bookingId = result.claim.bookingId;
      if (bookingId) {
        queryClient.invalidateQueries({
          queryKey: bookingKeys.detail(bookingId),
        });
      }
      toast.success(
        vars.action === "approve"
          ? "Claim approved — refund issued"
          : "Claim denied",
      );
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to process claim");
    },
  });
}
