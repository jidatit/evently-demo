import type { PublicVendor, UpdateVendorPayload, Vendor } from '@/features/vendor/types';
import {
  findVendorBySlug,
  findVendorByUserId,
  getDb,
  getVendorCategoriesJoined,
  newId,
  updateDb,
} from '../db';
import { mockDelay } from '../delay';
import type { MockVendor } from '../types';

function transformVendor(vendor: MockVendor, db: ReturnType<typeof getDb>): Vendor {
  const joined = getVendorCategoriesJoined(db, vendor.id);
  const primary = joined.find((vc) => vc.is_primary);
  const secondary = joined.filter((vc) => !vc.is_primary).sort((a, b) => a.display_order - b.display_order);
  const media = db.vendor_media
    .filter((m) => m.vendor_id === vendor.id && m.is_active && !m.service_id)
    .sort((a, b) => a.display_order - b.display_order);

  return {
    id: vendor.id,
    userId: vendor.user_id,
    businessName: vendor.business_name,
    description: vendor.description || '',
    city: vendor.city,
    state: vendor.state,
    contactEmail: vendor.contact_email || '',
    contactPhone: vendor.contact_phone || '',
    acceptingBookings: vendor.accepting_bookings,
    status: vendor.status,
    logoUrl: vendor.logo_url,
    profileSlug: vendor.profile_slug,
    socialLinks: vendor.social_links || {},
    isProfilePublic: vendor.is_profile_public,
    primaryCategory: primary
      ? { id: primary.category_id, name: primary.categories.name }
      : null,
    secondaryCategories: secondary.map((sc) => ({
      id: sc.category_id,
      name: sc.categories.name,
    })),
    media: media.map((m) => ({
      id: m.id,
      fileUrl: m.file_url,
      fileType: m.file_type,
      displayOrder: m.display_order,
    })),
    createdAt: vendor.created_at,
    updatedAt: vendor.updated_at,
  };
}

function transformPublicVendor(vendor: MockVendor, db: ReturnType<typeof getDb>): PublicVendor {
  const base = transformVendor(vendor, db);
  const services = db.services
    .filter((s) => s.vendor_id === vendor.id && s.is_active)
    .map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: s.price,
      pricingType: s.pricing_type,
      durationMinutes: s.duration_minutes,
      media: db.vendor_media
        .filter((m) => m.service_id === s.id && m.is_active)
        .sort((a, b) => a.display_order - b.display_order)
        .map((m) => ({
          id: m.id,
          fileUrl: m.file_url,
          fileType: m.file_type,
          displayOrder: m.display_order,
        })),
    }));

  return {
    id: base.id,
    ownerUserId: base.userId,
    businessName: base.businessName,
    description: base.description,
    city: base.city,
    state: base.state,
    contactEmail: base.contactEmail,
    contactPhone: base.contactPhone,
    logoUrl: base.logoUrl,
    profileSlug: base.profileSlug || vendor.id,
    socialLinks: base.socialLinks,
    primaryCategory: base.primaryCategory,
    secondaryCategories: base.secondaryCategories,
    media: base.media,
    services,
    createdAt: base.createdAt,
  };
}

export async function getVendorByUserIdMock(userId: string): Promise<Vendor> {
  await mockDelay();
  const db = getDb();
  const vendor = findVendorByUserId(db, userId);
  if (!vendor) throw new Error('Vendor not found');
  return transformVendor(vendor, db);
}

export async function getPublicVendorBySlugMock(slug: string): Promise<PublicVendor> {
  await mockDelay();
  const db = getDb();
  const vendor = findVendorBySlug(db, slug);
  if (!vendor || !vendor.is_profile_public || vendor.status !== 'approved') {
    throw new Error('Vendor profile not found or not public');
  }
  return transformPublicVendor(vendor, db);
}

export async function uploadVendorLogoMock(_userId: string, _file: File): Promise<string> {
  await mockDelay();
  return '/placeholder.svg';
}

export async function updateVendorMock(payload: UpdateVendorPayload): Promise<Vendor> {
  await mockDelay();
  updateDb((db) => {
    const vendor = findVendorByUserId(db, payload.userId);
    if (!vendor) throw new Error('Vendor not found');

    vendor.business_name = payload.businessName;
    vendor.description = payload.description;
    vendor.city = payload.city;
    vendor.state = payload.state;
    vendor.contact_email = payload.contactEmail;
    vendor.contact_phone = payload.contactPhone || null;
    if (payload.profileSlug) vendor.profile_slug = payload.profileSlug;
    if (payload.socialLinks) vendor.social_links = payload.socialLinks;
    if (payload.isProfilePublic != null) vendor.is_profile_public = payload.isProfilePublic;
    vendor.updated_at = new Date().toISOString();

    db.vendor_categories = db.vendor_categories.filter((vc) => vc.vendor_id !== vendor.id);
    db.vendor_categories.push({
      vendor_id: vendor.id,
      category_id: payload.primaryCategory,
      is_primary: true,
      display_order: 0,
    });
    payload.secondaryCategories.forEach((catId, index) => {
      db.vendor_categories.push({
        vendor_id: vendor.id,
        category_id: catId,
        is_primary: false,
        display_order: index + 1,
      });
    });
  });

  return getVendorByUserIdMock(payload.userId);
}

export type OnboardingServiceInput = {
  name: string;
  description: string;
  price: number;
  pricingType: string;
  duration: number;
};

export type CompleteOnboardingPayload = {
  userId: string;
  businessName: string;
  description: string;
  city: string;
  state: string;
  contactEmail: string;
  contactPhone?: string;
  primaryCategory: string;
  secondaryCategories: string[];
  profileSlug?: string;
  logoUrl?: string | null;
  services: OnboardingServiceInput[];
};

export async function completeVendorOnboardingMock(
  payload: CompleteOnboardingPayload,
): Promise<Vendor> {
  await mockDelay(400);
  const existingVendor = findVendorByUserId(getDb(), payload.userId);
  if (existingVendor) {
    return transformVendor(existingVendor, getDb());
  }

  const vendorId = newId('vendor');
  const now = new Date().toISOString();
  let slug =
    payload.profileSlug ||
    payload.businessName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') ||
    'vendor';

  updateDb((db) => {
    if (db.vendors.some((v) => v.profile_slug === slug)) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const vendor: MockVendor = {
      id: vendorId,
      user_id: payload.userId,
      business_name: payload.businessName,
      description: payload.description,
      city: payload.city,
      state: payload.state,
      contact_email: payload.contactEmail,
      contact_phone: payload.contactPhone || null,
      accepting_bookings: true,
      unavailable_until: null,
      unavailable_message: null,
      status: 'approved',
      logo_url: payload.logoUrl ?? '/placeholder.svg',
      profile_slug: slug,
      social_links: {},
      is_profile_public: true,
      created_at: now,
      updated_at: now,
    };
    db.vendors.push(vendor);

    db.vendor_categories.push({
      vendor_id: vendorId,
      category_id: payload.primaryCategory,
      is_primary: true,
      display_order: 0,
    });
    payload.secondaryCategories.forEach((catId, i) => {
      db.vendor_categories.push({
        vendor_id: vendorId,
        category_id: catId,
        is_primary: false,
        display_order: i + 1,
      });
    });

    payload.services.forEach((svc, index) => {
      const serviceId = newId('svc');
      db.services.push({
        id: serviceId,
        vendor_id: vendorId,
        name: svc.name,
        description: svc.description,
        price: svc.price,
        pricing_type: svc.pricingType as 'per_hour' | 'per_event' | 'per_day' | 'quote',
        duration_minutes: svc.duration,
        is_active: true,
        display_order: index + 1,
        created_at: now,
        updated_at: now,
      });
    });

    const user = db.users.find((u) => u.id === payload.userId);
    if (user) user.role = 'vendor';
  });

  return getVendorByUserIdMock(payload.userId);
}

export async function isProfileSlugAvailableMock(slug: string): Promise<boolean> {
  await mockDelay(50);
  const db = getDb();
  return !db.vendors.some((v) => v.profile_slug === slug);
}
