import Stripe from "https://esm.sh/stripe@14.21.0";
import { isStaging } from "./env.ts";

export function getStripe(): Stripe {
  const key = isStaging()
    ? Deno.env.get("STRIPE_TEST_SECRET_KEY")
    : Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) {
    throw new Error(
      `Missing ${isStaging() ? "test" : "production"} Stripe secret key`,
    );
  }
  return new Stripe(key, {
    apiVersion: "2023-10-16" as "2025-06-30.basil",
  });
}
