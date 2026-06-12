// src/features/vendor-favorites/hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getIsFavorited, toggleFavorite, getCustomerFavorites } from "./api";
import { useConsolidatedAuth } from "@/components/ConsolidatedAuthProvider";

export const favoriteKeys = {
  all: ["vendor_favorites"] as const,
  isFavorited: (vendorId: string) =>
    [...favoriteKeys.all, "isFavorited", vendorId] as const,
  list: () => [...favoriteKeys.all, "list"] as const,
};

export const useIsFavorited = (vendorId?: string) => {
  const { user, isAuthenticated } = useConsolidatedAuth();

  return useQuery({
    queryKey: favoriteKeys.isFavorited(vendorId || ""),
    queryFn: () => {
      if (!user?.id || !vendorId) return false;
      return getIsFavorited(user.id, vendorId);
    },
    enabled: isAuthenticated && !!user?.id && !!vendorId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isCustomer } = useConsolidatedAuth();

  return useMutation({
    mutationFn: async (vendorId: string) => {
      if (!isAuthenticated || !isCustomer || !user?.id) {
        throw new Error("Only authenticated customers can toggle favorites");
      }
      return toggleFavorite(user.id, vendorId);
    },

    onMutate: async (vendorId) => {
      await queryClient.cancelQueries({
        queryKey: favoriteKeys.isFavorited(vendorId),
      });
      const previousIsFavorited = queryClient.getQueryData<boolean>(
        favoriteKeys.isFavorited(vendorId)
      );

      // Optimistic toggle
      queryClient.setQueryData(
        favoriteKeys.isFavorited(vendorId),
        !previousIsFavorited
      );

      return { previousIsFavorited };
    },

    onError: (err, vendorId, context) => {
      // Rollback optimistic update
      if (context?.previousIsFavorited !== undefined) {
        queryClient.setQueryData(
          favoriteKeys.isFavorited(vendorId),
          context.previousIsFavorited
        );
      }
      toast.error("Failed to update favorite");
    },

    onSuccess: (result, vendorId) => {
      toast.success(
        `Vendor ${
          result.action === "added" ? "added to" : "removed from"
        } favorites`
      );
      queryClient.invalidateQueries({
        queryKey: favoriteKeys.isFavorited(vendorId),
      });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.list() });
    },
  });
};

export const useCustomerFavorites = () => {
  const { user, isAuthenticated, isCustomer } = useConsolidatedAuth();

  return useQuery({
    queryKey: favoriteKeys.list(),
    queryFn: () => {
      if (!user?.id) return [];
      return getCustomerFavorites(user.id);
    },
    enabled: isAuthenticated && isCustomer && !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
