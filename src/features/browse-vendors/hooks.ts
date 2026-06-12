// src/features/browse-vendors/hooks.ts

import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchVendors } from "./api";
import type { VendorFilters } from "./types";
import { buildVendorQueryKey } from "./utils";

/**
 * Infinite query hook for vendor browsing with pagination
 *
 * @param filters - Filter criteria for vendors
 * @returns Infinite query result with vendors, loading states, and pagination controls
 */
export const useVendorBrowse = (filters: VendorFilters) => {
  return useInfiniteQuery({
    queryKey: buildVendorQueryKey(filters),

    queryFn: ({ pageParam = 0 }) => fetchVendors(filters, pageParam),

    // Calculate next page offset
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;

      // Calculate offset based on number of pages fetched
      return allPages.length * filters.limit;
    },

    // Initial page param
    initialPageParam: 0,

    // Cache configuration
    staleTime: 5 * 60 * 1000, // 5 minutes - balance between freshness and performance
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache

    // Retry configuration
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch configuration - disable aggressive refetching for better UX
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

/**
 * Helper hook to get flattened vendor list and metadata
 */
export const useVendorBrowseData = (filters: VendorFilters) => {
  const query = useVendorBrowse(filters);

  // Flatten all pages into single array
  const vendors = query.data?.pages.flatMap((page) => page.vendors) ?? [];

  // Get total count from first page
  const totalCount = query.data?.pages[0]?.count ?? 0;

  // Check if there are more pages to load
  const hasNextPage = query.hasNextPage ?? false;

  return {
    ...query,
    vendors,
    totalCount,
    hasNextPage,
  };
};
