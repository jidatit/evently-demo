// src/features/browse-vendors/utils.ts

import type {
  VendorFilterOptions,
  VendorFilters,
  PriceRangeOption,
} from "./types";
import { PRICE_RANGE_OPTIONS } from "./types";

/**
 * Parse price range string to min/max values
 */
export const parsePriceRange = (
  priceRangeValue: string
): { min: number; max: number } | undefined => {
  if (priceRangeValue === "all") return undefined;

  const option = PRICE_RANGE_OPTIONS.find(
    (opt) => opt.value === priceRangeValue
  );
  if (!option || (!option.min && !option.max)) return undefined;

  return {
    min: option.min ?? 0,
    max: option.max ?? Number.MAX_SAFE_INTEGER,
  };
};

/**
 * Convert UI filter options to API filter format
 */
export const convertToApiFilters = (
  options: VendorFilterOptions,
  limit: number = 12
): VendorFilters => {
  const filters: VendorFilters = { limit };

  // Search term
  if (options.searchTerm?.trim()) {
    filters.searchTerm = options.searchTerm.trim();
  }

  // Category
  if (options.selectedCategory && options.selectedCategory !== "all") {
    filters.categoryId = options.selectedCategory;
  }

  // Location
  if (options.selectedState && options.selectedState !== "all") {
    filters.state = options.selectedState;
  }
  if (options.selectedCity && options.selectedCity !== "all") {
    filters.city = options.selectedCity;
  }

  // Price Range
  const priceRange = parsePriceRange(options.selectedPriceRange);
  if (priceRange) {
    filters.priceRange = priceRange;
  }

  // Availability
  if (options.selectedAvailability === "available") {
    filters.availability = "available";
  } else {
    filters.availability = "all";
  }

  return filters;
};

/**
 * Sanitize search term for security
 */
export const sanitizeSearchTerm = (term: string): string => {
  if (!term) return "";

  // Remove potentially harmful characters
  return term
    .replace(/[<>'";&|]/g, "")
    .substring(0, 100) // Limit length
    .trim();
};

/**
 * Build query key for React Query cache
 */
export const buildVendorQueryKey = (filters: VendorFilters) => {
  return ["vendors", "browse", "infinite", filters] as const;
};
