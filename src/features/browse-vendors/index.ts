// src/features/browse-vendors/index.ts

/**
 * Browse Vendors Feature
 *
 * Public barrel export for the browse vendors feature.
 * Provides optimized vendor browsing with filters, search, and pagination.
 */

// Hooks
export { useVendorBrowse, useVendorBrowseData } from "./hooks";

// API Functions
export { fetchVendors } from "./api";

// Types
export type {
  VendorFilters,
  VendorFilterOptions,
  VendorListItem,
  PaginatedVendorResponse,
  PriceRangeOption,
} from "./types";

export { PRICE_RANGE_OPTIONS, AVAILABILITY_OPTIONS } from "./types";

// Utilities
export {
  convertToApiFilters,
  sanitizeSearchTerm,
  parsePriceRange,
  buildVendorQueryKey,
} from "./utils";
