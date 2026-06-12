// src/features/vendor/types.ts
import { z } from "zod";

// Database types (directly matching Supabase table structure)
export interface VendorDB {
  id: string;
  user_id: string;
  business_name: string;
  description: string | null;
  city: string;
  state: string;
  contact_email: string | null;
  contact_phone: string | null;
  accepting_bookings: boolean;
  unavailable_until: string | null;
  unavailable_message: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  logo_url: string | null;
  profile_slug: string | null; // new - unique public URL slug
  social_links: Record<string, string>; // new - { instagram: "...", website: "...", ... }
  is_profile_public: boolean; // new - visibility toggle
  created_at: string;
  updated_at: string;
}

export interface VendorCategoryDB {
  vendor_id: string;
  category_id: string;
  is_primary: boolean;
  display_order: number;
  categories: {
    id: string;
    name: string;
    slug: string | null;
  };
}

export interface VendorMediaDB {
  id: string;
  vendor_id: string;
  file_name: string;
  file_url: string;
  file_type: "image" | "video";
  file_size: number | null;
  mime_type: string | null;
  display_order: number;
  is_active: boolean;
  service_id: string | null;
}

// Frontend-optimized Vendor type (camelCase + joined/derived data)
export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  description: string;
  city: string;
  state: string;
  contactEmail: string;
  contactPhone: string;
  acceptingBookings: boolean;
  status: string;
  logoUrl: string | null;
  profileSlug: string | null; // new
  socialLinks: Record<string, string>; // new - same shape as DB
  isProfilePublic: boolean; // new
  primaryCategory: {
    id: string;
    name: string;
  } | null;
  secondaryCategories: Array<{
    id: string;
    name: string;
  }>;
  media: Array<{
    id: string;
    fileUrl: string;
    fileType: string;
    displayOrder: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

//Public vendor types:
// src/features/vendor/types.ts (add to existing file)

export interface PublicVendor {
  id: string;
  /** auth.users / profiles id — for hiding "Ask a Question" when viewing own public profile */
  ownerUserId: string;
  businessName: string;
  description: string;
  city: string;
  state: string;
  contactEmail: string;
  contactPhone: string;
  logoUrl: string | null;
  profileSlug: string;
  socialLinks: Record<string, string>;
  primaryCategory: { id: string; name: string } | null;
  secondaryCategories: Array<{ id: string; name: string }>;
  media: Array<{
    id: string;
    fileUrl: string;
    fileType: string;
    displayOrder: number;
  }>;
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    pricingType: string | null;
    durationMinutes: number | null;
    media: Array<{
      id: string;
      fileUrl: string;
      fileType: string;
      displayOrder: number;
    }>;
  }>;
  createdAt: string;
}

// Zod schema for updating vendor profile
// (extended with new fields – add them as needed when you build the edit form)
export const vendorUpdateSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().optional(),
  // New fields (optional for now – make required if you want)
  profileSlug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug can only contain lowercase letters, numbers and hyphens"
    )
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug is too long")
    .optional(),
  socialLinks: z
    .record(z.string().url({ message: "Must be a valid URL" }))
    .optional()
    .refine(
      (links) => {
        const allowedKeys = ["instagram", "tiktok", "facebook", "website"];
        return Object.keys(links).every((key) => allowedKeys.includes(key));
      },
      { message: "Only instagram, tiktok, facebook, website are allowed" }
    ),
  isProfilePublic: z.boolean().optional(),
  // Existing onboarding-related fields
  primaryCategory: z.string().min(1, "Primary category is required"),
  secondaryCategories: z
    .array(z.string())
    .max(3, "Maximum 3 secondary categories"),
  logo: z.instanceof(File).optional().nullable(),
});

export type VendorUpdateInput = z.infer<typeof vendorUpdateSchema>;

// Form data type (includes logo preview)
export interface VendorFormData extends VendorUpdateInput {
  logoPreview?: string;
}

// API payload type for updates
export interface UpdateVendorPayload {
  userId: string;
  businessName: string;
  description: string;
  city: string;
  state: string;
  contactEmail: string;
  contactPhone?: string;
  profileSlug?: string | null; // new
  socialLinks?: Record<string, string>; // new
  isProfilePublic?: boolean; // new
  primaryCategory: string;
  secondaryCategories: string[];
  logo?: File | null;
}
