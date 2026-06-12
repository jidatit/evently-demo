import { mockBookingClaims } from './data/claims';
import { mockCategories } from './data/categories';
import {
  mockBookings,
  mockBookingStatusHistory,
  mockThreadMessages,
  mockThreads,
} from './data/bookings';
import { mockPayments, mockVendorStripeAccounts } from './data/payments';
import { mockServiceMedia, mockServices } from './data/services';
import { mockProfiles, mockUsers } from './data/users';
import {
  mockVendorCategories,
  mockVendorMedia,
  mockVendors,
} from './data/vendors';
import { getJson, setJson, STORAGE_KEYS } from './storage';
import type { DemoDatabase } from './types';

export function createInitialDatabase(): DemoDatabase {
  return {
    users: structuredClone(mockUsers),
    profiles: structuredClone(mockProfiles),
    categories: structuredClone(mockCategories),
    vendors: structuredClone(mockVendors),
    vendor_categories: structuredClone(mockVendorCategories),
    vendor_media: [...structuredClone(mockVendorMedia), ...structuredClone(mockServiceMedia)],
    services: structuredClone(mockServices),
    bookings: structuredClone(mockBookings),
    booking_status_history: structuredClone(mockBookingStatusHistory),
    payments: structuredClone(mockPayments),
    threads: structuredClone(mockThreads),
    thread_messages: structuredClone(mockThreadMessages),
    vendor_favorites: [],
    booking_claims: structuredClone(mockBookingClaims),
    vendor_stripe_accounts: structuredClone(mockVendorStripeAccounts),
  };
}

export function getDb(): DemoDatabase {
  return getJson(STORAGE_KEYS.DB, createInitialDatabase());
}

export function setDb(db: DemoDatabase): void {
  setJson(STORAGE_KEYS.DB, db);
}

export function updateDb(mutator: (db: DemoDatabase) => void): DemoDatabase {
  const db = getDb();
  mutator(db);
  setDb(db);
  return db;
}

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function findCategory(db: DemoDatabase, id: string) {
  return db.categories.find((c) => c.id === id);
}

export function findVendor(db: DemoDatabase, id: string) {
  return db.vendors.find((v) => v.id === id);
}

export function findVendorByUserId(db: DemoDatabase, userId: string) {
  return db.vendors.find((v) => v.user_id === userId);
}

export function findVendorBySlug(db: DemoDatabase, slug: string) {
  return db.vendors.find((v) => v.profile_slug === slug);
}

export function findProfile(db: DemoDatabase, id: string) {
  return db.profiles.find((p) => p.id === id);
}

export function findUserByEmail(db: DemoDatabase, email: string) {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(db: DemoDatabase, id: string) {
  return db.users.find((u) => u.id === id);
}

export function getVendorCategoriesJoined(db: DemoDatabase, vendorId: string) {
  return db.vendor_categories
    .filter((vc) => vc.vendor_id === vendorId)
    .map((vc) => ({
      ...vc,
      categories: findCategory(db, vc.category_id)!,
    }))
    .filter((vc) => vc.categories);
}
