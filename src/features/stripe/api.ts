import type { VendorStripeAccount } from "./types";
import {
  getStripeAccountMock,
  initiateStripeOnboardingMock,
  syncStripeStatusMock,
} from "@/mocks/handlers/stripe";
import { findVendorByUserId, getDb } from "@/mocks/db";
import { getJson, STORAGE_KEYS } from "@/mocks/storage";
import type { MockSessionPayload } from "@/mocks/types";

export const getStripeAccount = getStripeAccountMock;
export const initiateStripeOnboarding = initiateStripeOnboardingMock;

export type SyncStripeStatusResult = {
  account: VendorStripeAccount;
  expressLoginUrl: string | null;
};

export async function syncStripeStatus(): Promise<SyncStripeStatusResult> {
  const session = getJson<MockSessionPayload | null>(STORAGE_KEYS.SESSION, null);
  const vendor = session
    ? findVendorByUserId(getDb(), session.userId)
    : undefined;
  return syncStripeStatusMock(vendor?.id);
}
