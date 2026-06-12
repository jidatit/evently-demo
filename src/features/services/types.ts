// src/features/service/types.ts
import { z } from "zod";

// Database types
export interface ServiceDB {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number | null;
  pricing_type: "per_hour" | "per_event" | "per_day" | "quote";
  duration_minutes: number | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface VendorMediaDB {
  id: string;
  vendor_id: string;
  service_id: string | null;
  file_name: string;
  file_url: string;
  file_type: "image" | "video";
  file_size: number | null;
  mime_type: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Frontend types
export interface ServiceMedia {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType: "image" | "video";
  displayOrder: number;
}

export interface Service {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number | null;
  pricingType: "per_hour" | "per_event" | "per_day" | "quote";
  durationMinutes: number | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  media: ServiceMedia[];
}

// Form types
export interface ServiceFormMedia {
  file: File;
  preview: string;
  type: "image" | "video";
}

export interface ServiceFormData {
  name: string;
  description: string;
  price: string;
  pricingType: "per_hour" | "per_event" | "per_day" | "quote";
  durationMinutes: string;
  media: ServiceFormMedia[];
  existingMedia?: ServiceMedia[]; // For edit mode
  deleteMediaIds?: string[]; // Media to delete
}

// API payloads
export interface CreateServicePayload {
  vendorId: string;
  name: string;
  description: string;
  price: number | null;
  pricingType: "per_hour" | "per_event" | "per_day" | "quote";
  durationMinutes: number | null;
  mediaFiles: File[];
}

export interface UpdateServicePayload {
  serviceId: string;
  vendorId: string;
  name: string;
  description: string;
  price: number | null;
  pricingType: "per_hour" | "per_event" | "per_day" | "quote";
  durationMinutes: number | null;
  newMediaFiles?: File[];
  deleteMediaIds?: string[];
}

// Zod validation schemas
export const serviceFormSchema = z
  .object({
    name: z.string().min(3, "Service name must be at least 3 characters"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    price: z.string().refine(
      (val) => {
        if (val === "") return true; // Allow empty for "quote" pricing
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
      },
      { message: "Price must be a valid number" }
    ),
    pricingType: z.enum(["per_hour", "per_event", "per_day", "quote"]),
    durationMinutes: z.string().refine(
      (val) => {
        if (val === "") return true; // Optional
        const num = parseInt(val);
        return !isNaN(num) && num > 0;
      },
      { message: "Duration must be a positive number" }
    ),
  })
  .refine(
    (data) => {
      // Price is required unless pricing type is "quote"
      if (data.pricingType !== "quote" && data.price === "") {
        return false;
      }
      return true;
    },
    {
      message: "Price is required for this pricing type",
      path: ["price"],
    }
  );

export type ServiceFormSchema = z.infer<typeof serviceFormSchema>;
