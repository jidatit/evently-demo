import type {
  PaginatedVendorResponse,
  VendorFilters,
  VendorListItem,
} from '@/features/browse-vendors/types';
import { getDb, getVendorCategoriesJoined } from '../db';
import { mockDelay } from '../delay';

function toListItem(
  vendor: ReturnType<typeof getDb>['vendors'][0],
  db: ReturnType<typeof getDb>,
): VendorListItem {
  const joined = getVendorCategoriesJoined(db, vendor.id);
  const vendorServices = db.services.filter(
    (s) => s.vendor_id === vendor.id && s.is_active,
  );
  const prices = vendorServices
    .map((s) => s.price)
    .filter((p): p is number => p != null);

  return {
    id: vendor.id,
    businessName: vendor.business_name,
    city: vendor.city,
    state: vendor.state,
    logoUrl: vendor.logo_url,
    profileSlug: vendor.profile_slug,
    categories: joined.map((vc) => ({
      id: vc.category_id,
      name: vc.categories.name,
      slug: vc.categories.slug || vc.categories.name.toLowerCase(),
      isPrimary: vc.is_primary,
      displayOrder: vc.display_order,
    })),
    acceptingBookings: vendor.accepting_bookings,
    unavailableUntil: vendor.unavailable_until,
    minServicePrice: prices.length ? Math.min(...prices) : null,
    maxServicePrice: prices.length ? Math.max(...prices) : null,
  };
}

export async function fetchVendorsMock(
  filters: VendorFilters,
  pageParam = 0,
): Promise<PaginatedVendorResponse> {
  await mockDelay();
  const db = getDb();
  const limit = filters.limit || 12;

  let vendors = db.vendors.filter(
    (v) => v.status === 'approved' && v.is_profile_public,
  );

  if (filters.state && filters.state !== 'all') {
    vendors = vendors.filter((v) => v.state === filters.state);
  }
  if (filters.city && filters.city !== 'all') {
    vendors = vendors.filter((v) => v.city === filters.city);
  }
  if (filters.categoryId && filters.categoryId !== 'all') {
    vendors = vendors.filter((v) =>
      db.vendor_categories.some(
        (vc) => vc.vendor_id === v.id && vc.category_id === filters.categoryId,
      ),
    );
  }
  if (filters.availability === 'available') {
    vendors = vendors.filter((v) => v.accepting_bookings);
  }
  if (filters.searchTerm?.trim()) {
    const q = filters.searchTerm.toLowerCase();
    vendors = vendors.filter(
      (v) =>
        v.business_name.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q),
    );
  }
  if (filters.priceRange) {
    vendors = vendors.filter((v) => {
      const item = toListItem(v, db);
      const min = item.minServicePrice ?? 0;
      const max = item.maxServicePrice ?? min;
      if (filters.priceRange!.min != null && max < filters.priceRange!.min) return false;
      if (filters.priceRange!.max != null && min > filters.priceRange!.max) return false;
      return true;
    });
  }

  const count = vendors.length;
  const start = pageParam * limit;
  const page = vendors.slice(start, start + limit).map((v) => toListItem(v, db));

  return {
    vendors: page,
    count,
    hasMore: start + limit < count,
  };
}
