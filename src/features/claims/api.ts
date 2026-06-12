import type { BookingClaim, ClaimType } from "./types";
import {
  getClaimForBookingMock,
  getClaimsMock,
  processClaimMock,
  submitClaimMock,
} from "@/mocks/handlers/claims";

export const submitClaim = submitClaimMock;
export const getClaimForBooking = getClaimForBookingMock;
export const getClaims = getClaimsMock;

export async function getUnresolvedClaims(): Promise<BookingClaim[]> {
  const claims = await getClaimsMock();
  return claims.filter((c) => c.status === "under_review");
}

export const processClaim = processClaimMock;
