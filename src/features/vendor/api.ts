import type { PublicVendor, UpdateVendorPayload, Vendor } from "./types";
import {
  getPublicVendorBySlugMock,
  getVendorByUserIdMock,
  updateVendorMock,
  uploadVendorLogoMock,
} from "@/mocks/handlers/vendors";

export const getVendorByUserId = getVendorByUserIdMock;
export const getPublicVendorBySlug = getPublicVendorBySlugMock;
export const uploadVendorLogo = uploadVendorLogoMock;
export const updateVendor = updateVendorMock;
