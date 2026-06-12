import type { FavoritedVendor } from '@/features/vendor-favorites/types';
import { getDb, getVendorCategoriesJoined, newId, updateDb } from '../db';
import { mockDelay } from '../delay';

export async function getIsFavoritedMock(
  userId: string,
  vendorId: string,
): Promise<boolean> {
  await mockDelay(100);
  const db = getDb();
  return db.vendor_favorites.some(
    (f) => f.customer_id === userId && f.vendor_id === vendorId,
  );
}

export async function toggleFavoriteMock(
  userId: string,
  vendorId: string,
): Promise<{ action: 'added' | 'removed' }> {
  await mockDelay();
  const db = getDb();
  const existing = db.vendor_favorites.find(
    (f) => f.customer_id === userId && f.vendor_id === vendorId,
  );
  if (existing) {
    updateDb((d) => {
      d.vendor_favorites = d.vendor_favorites.filter((f) => f.id !== existing.id);
    });
    return { action: 'removed' };
  }
  updateDb((d) => {
    d.vendor_favorites.push({
      id: newId('fav'),
      customer_id: userId,
      vendor_id: vendorId,
      created_at: new Date().toISOString(),
    });
  });
  return { action: 'added' };
}

export async function getCustomerFavoritesMock(
  userId: string,
): Promise<FavoritedVendor[]> {
  await mockDelay();
  const db = getDb();
  return db.vendor_favorites
    .filter((f) => f.customer_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((f) => {
      const vendor = db.vendors.find((v) => v.id === f.vendor_id);
      if (!vendor) {
        return null;
      }
      const primary =
        getVendorCategoriesJoined(db, vendor.id).find((vc) => vc.is_primary)
          ?.categories.name ?? null;
      return {
        favoriteId: f.id,
        favoritedAt: f.created_at,
        id: vendor.id,
        business_name: vendor.business_name,
        description: vendor.description,
        city: vendor.city,
        state: vendor.state,
        logo_url: vendor.logo_url,
        profile_slug: vendor.profile_slug,
        primaryCategory: primary,
      };
    })
    .filter((v): v is FavoritedVendor => v != null);
}
