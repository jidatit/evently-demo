// Add these utility functions to your existing lib/utils.ts file

/**
 * Format price with currency
 */
export function formatPrice(price: number | null): string {
  if (price === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Format pricing type to readable text
 */
export function formatPricingType(
  pricingType: "per_hour" | "per_event" | "per_day" | "quote"
): string {
  const pricingTypeMap = {
    per_hour: "per hour",
    per_event: "per event",
    per_day: "per day",
    quote: "custom quote",
  };
  return pricingTypeMap[pricingType];
}

/**
 * Format duration in minutes to human-readable format
 * Examples:
 * - 30 -> "30 min"
 * - 60 -> "1 hr"
 * - 90 -> "1.5 hrs"
 * - 120 -> "2 hrs"
 * - 150 -> "2.5 hrs"
 */
export function formatDuration(durationMinutes: number | null): string {
  if (durationMinutes === null) return "N/A";

  if (durationMinutes < 60) {
    return `${durationMinutes} min`;
  }

  const hours = durationMinutes / 60;

  // Check if it's a whole number
  if (hours % 1 === 0) {
    return `${hours} ${hours === 1 ? "hr" : "hrs"}`;
  }

  // Has decimal, format to 1 decimal place
  return `${hours.toFixed(1)} hrs`;
}

/**
 * Get full price display with pricing type
 */
export function getFullPriceDisplay(
  price: number | null,
  pricingType: "per_hour" | "per_event" | "per_day" | "quote"
): string {
  if (pricingType === "quote") {
    return "Contact for quote";
  }

  if (price === null) {
    return "Price not set";
  }

  return `${formatPrice(price)} ${formatPricingType(pricingType)}`;
}
