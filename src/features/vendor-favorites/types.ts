// src/features/vendor-favorites/types.ts

export interface VendorFavorite {
  id: string;
  customer_id: string;
  vendor_id: string;
  created_at: string;
}

export interface VendorCategory {
  id: string;
  name: string;
  slug: string;
}

// src/features/vendor-favorites/types.ts

export interface FavoritedVendor {
  /** Favorite metadata */
  favoriteId: string;
  favoritedAt: string;

  /** Vendor fields */
  id: string;
  business_name: string;
  description: string | null;
  city: string;
  state: string;
  logo_url: string | null;
  profile_slug: string | null;

  /** Primary category name only */
  primaryCategory: string | null;
}
