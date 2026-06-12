// src/features/service/hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getServicesWithMedia,
  createService,
  updateService,
  deleteService,
} from "./api";
import type { CreateServicePayload, UpdateServicePayload } from "./types";

// Query key factory
export const serviceKeys = {
  all: ["services"] as const,
  byVendorId: (vendorId: string) =>
    [...serviceKeys.all, "vendor", vendorId] as const,
  withMedia: (vendorId: string) =>
    [...serviceKeys.byVendorId(vendorId), "with-media"] as const,
};

// Hook to fetch services with media by vendor ID
export const useServicesWithMedia = (vendorId?: string) => {
  return useQuery({
    queryKey: serviceKeys.withMedia(vendorId || ""),
    queryFn: () => getServicesWithMedia(vendorId!),
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};

// Hook to create service
export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createService,
    onMutate: async () => {
      // Optional: Show optimistic loading state
      toast.loading("Creating service...", { id: "create-service" });
    },
    onSuccess: (data, variables) => {
      // Dismiss loading toast
      toast.dismiss("create-service");

      // Invalidate queries to refetch
      queryClient.invalidateQueries({
        queryKey: serviceKeys.withMedia(variables.vendorId),
      });

      // Show success toast
      toast.success("Service added successfully! 🎉", {
        description: "Your new service is now available for booking.",
      });
    },
    onError: (error) => {
      // Dismiss loading toast
      toast.dismiss("create-service");

      // Show error toast
      toast.error("Failed to add service", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    },
  });
};

// Hook to update service
export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateService,
    onMutate: async () => {
      toast.loading("Updating service...", { id: "update-service" });
    },
    onSuccess: (data, variables) => {
      toast.dismiss("update-service");

      queryClient.invalidateQueries({
        queryKey: serviceKeys.withMedia(variables.vendorId),
      });

      toast.success("Service updated successfully! ✨", {
        description: "Your service has been updated and is now live.",
      });
    },
    onError: (error) => {
      toast.dismiss("update-service");

      toast.error("Failed to update service", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    },
  });
};

// Hook to delete service
export const useDeleteService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteService,
    onMutate: async (serviceId) => {
      toast.loading("Deleting service...", { id: "delete-service" });

      // Optimistically remove from UI
      // Get all service queries
      const queries = queryClient.getQueriesData({ queryKey: serviceKeys.all });

      queries.forEach(([queryKey, data]) => {
        if (Array.isArray(data)) {
          queryClient.setQueryData(
            queryKey,
            data.filter((service: any) => service.id !== serviceId)
          );
        }
      });

      return { queries };
    },
    onSuccess: () => {
      toast.dismiss("delete-service");

      toast.success("Service deleted 🗑️", {
        description: "The service has been removed from your offerings.",
      });
    },
    onError: (error, variables, context) => {
      toast.dismiss("delete-service");

      // Rollback optimistic update
      if (context?.queries) {
        context.queries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast.error("Failed to delete service", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    },
  });
};
