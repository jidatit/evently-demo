import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getStripeAccount,
  initiateStripeOnboarding,
  syncStripeStatus,
} from "./api";
import { vendorKeys } from "@/features/vendor/hooks";

export const stripeKeys = {
  all: ["stripe"] as const,
  status: (vendorId: string) => [...stripeKeys.all, "status", vendorId] as const,
};

export function useStripeStatus(vendorId?: string) {
  return useQuery({
    queryKey: stripeKeys.status(vendorId || ""),
    queryFn: () => getStripeAccount(vendorId!),
    enabled: !!vendorId,
    staleTime: 60 * 1000,
  });
}

export function useInitiateStripeOnboarding(vendorId?: string, userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: initiateStripeOnboarding,
    onSuccess: () => {
      if (vendorId) {
        queryClient.invalidateQueries({ queryKey: stripeKeys.status(vendorId) });
      }
      if (userId) {
        queryClient.invalidateQueries({ queryKey: vendorKeys.byUserId(userId) });
      }
    },
    onError: (err: Error) => {
      toast.error("Stripe onboarding failed", { description: err.message });
    },
  });
}

export function useSyncStripeStatus(vendorId?: string, userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncStripeStatus,
    onSuccess: () => {
      if (vendorId) {
        queryClient.invalidateQueries({ queryKey: stripeKeys.status(vendorId) });
      }
      if (userId) {
        queryClient.invalidateQueries({ queryKey: vendorKeys.byUserId(userId) });
      }
    },
    onError: (err: Error) => {
      toast.error("Could not refresh Stripe status", { description: err.message });
    },
  });
}
