// src/features/vendor/hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getVendorByUserId, updateVendor } from "./api";
import type { UpdateVendorPayload } from "./types";

// Query key factory
export const vendorKeys = {
  all: ["vendors"] as const,
  byUserId: (userId: string) => [...vendorKeys.all, userId] as const,
};

// Hook to fetch vendor by user ID
export const useVendor = (userId?: string) => {
  return useQuery({
    queryKey: vendorKeys.byUserId(userId || ""),
    queryFn: () => getVendorByUserId(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (cache time)
    retry: 1,
  });
};

// Hook to update vendor
export const useVendorMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateVendor,
    onMutate: async (newVendor) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: vendorKeys.byUserId(newVendor.userId),
      });

      // Snapshot previous value for rollback
      const previousVendor = queryClient.getQueryData(
        vendorKeys.byUserId(newVendor.userId)
      );

      // Optimistically update (optional - you can remove this if you prefer to wait)
      // queryClient.setQueryData(
      //   vendorKeys.byUserId(newVendor.userId),
      //   (old: any) => ({ ...old, ...newVendor })
      // );

      return { previousVendor };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousVendor) {
        queryClient.setQueryData(
          vendorKeys.byUserId(variables.userId),
          context.previousVendor
        );
      }

      // Show error toast
      toast.error("Failed to update profile", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: vendorKeys.byUserId(variables.userId),
      });

      // Show success toast
      toast.success("Profile updated successfully! 🎉", {
        description: "Your changes are now live and visible to customers.",
      });
    },
  });
};
