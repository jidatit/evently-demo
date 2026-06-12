// src/features/browse-vendors/types.ts

// ============================================================================
// Filter Types
// ============================================================================

export interface VendorFilters {
  searchTerm?: string;
  categoryId?: string;
  state?: string;
  city?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  availability?: "all" | "available";
  limit: number;
}

export interface VendorFilterOptions {
  searchTerm: string;
  selectedCategory: string;
  selectedState: string;
  selectedCity: string;
  selectedPriceRange: string;
  selectedAvailability: string;
}

// ============================================================================
// Database Types
// ============================================================================

export interface VendorCategoryDB {
  category_id: string;
  is_primary: boolean;
  display_order: number;
  categories: {
    id: string;
    name: string;
    slug: string | null;
  };
}

export interface VendorCategory {
  id: string;
  name: string;
  slug: string;
  isPrimary: boolean;
  displayOrder: number;
}

// ============================================================================
// Response Types
// ============================================================================

export interface VendorListItem {
  id: string;
  businessName: string;
  city: string;
  state: string;
  logoUrl: string | null;
  profileSlug: string;
  categories: VendorCategory[];
  acceptingBookings: boolean;
  unavailableUntil: string | null;
  minServicePrice: number | null;
  maxServicePrice: number | null;
}

export interface PaginatedVendorResponse {
  vendors: VendorListItem[];
  count: number | null;
  hasMore: boolean;
}

// ============================================================================
// UI Helper Types
// ============================================================================

export interface PriceRangeOption {
  value: string;
  label: string;
  min?: number;
  max?: number;
}

export const PRICE_RANGE_OPTIONS: PriceRangeOption[] = [
  { value: "all", label: "Any Budget" },
  { value: "under-500", label: "Under $500", min: 0, max: 500 },
  { value: "500-1000", label: "$500 - $1,000", min: 500, max: 1000 },
  { value: "1000-2500", label: "$1,000 - $2,500", min: 1000, max: 2500 },
  { value: "2500-5000", label: "$2,500 - $5,000", min: 2500, max: 5000 },
  { value: "over-5000", label: "Over $5,000", min: 5000 },
];

export const AVAILABILITY_OPTIONS = [
  { value: "all", label: "All Vendors" },
  { value: "available", label: "Available Now" },
] as const;
