// Keep in sync with supabase/functions/_shared/booking-pricing.ts

export type PricingType = "per_event" | "per_hour" | "per_day" | "quote";

export type BookingPricingInput = {
  pricingType: string;
  rateCents: number;
  eventDate: string;
  eventEndDate?: string | null;
  eventTimeStart?: string | null;
  eventTimeEnd?: string | null;
};

export type PricingPreview = {
  pricingType: PricingType;
  rateCents: number;
  quantity: number;
  quantityUnit: "event" | "hours" | "days" | "quote";
  totalPriceCents: number;
  serviceName: string;
};

function parseTimeToMinutes(time: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function parseYmd(dateStr: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (
    dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d
  ) {
    return null;
  }
  return dt;
}

function inclusiveCalendarDays(start: string, end: string): number {
  const a = parseYmd(start);
  const b = parseYmd(end);
  if (!a || !b) return 1;
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.round((b.getTime() - a.getTime()) / msPerDay);
  return Math.max(1, diff + 1);
}

function roundToHalfHour(hours: number): number {
  return Math.round(hours * 2) / 2;
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatRateLabel(
  pricingType: string,
  rateCents: number,
): string {
  if (pricingType === "quote") return "Custom quote";
  const amount = formatCents(rateCents);
  switch (pricingType) {
    case "per_hour":
      return `${amount}/hr`;
    case "per_day":
      return `${amount}/day`;
    case "per_event":
      return `${amount}/event`;
    default:
      return amount;
  }
}

export function formatQuantityLabel(
  quantity: number,
  unit: string,
): string | null {
  if (unit === "quote") return null;
  if (unit === "event") return "1 event";
  if (unit === "hours") {
    const label = quantity === 1 ? "hour" : "hours";
    return `${quantity} ${label}`;
  }
  if (unit === "days") {
    const label = quantity === 1 ? "day" : "days";
    return `${quantity} ${label}`;
  }
  return null;
}

export function validateBookingPricingInput(
  input: BookingPricingInput,
): string | null {
  const type = input.pricingType as PricingType;

  if (type === "per_hour") {
    if (!input.eventTimeStart?.trim() || !input.eventTimeEnd?.trim()) {
      return "Start and end time are required to calculate total";
    }
    const startMin = parseTimeToMinutes(input.eventTimeStart);
    const endMin = parseTimeToMinutes(input.eventTimeEnd);
    if (startMin == null || endMin == null) {
      return "Invalid time format";
    }
    if (endMin <= startMin) {
      return "End time must be after start time";
    }
  }

  if (type === "per_day" && input.eventEndDate?.trim()) {
    const start = parseYmd(input.eventDate);
    const end = parseYmd(input.eventEndDate);
    if (!start || !end) {
      return "Invalid date";
    }
    if (end < start) {
      return "End date must be on or after the start date";
    }
  }

  return null;
}

export function calculateBookingPricingPreview(
  serviceName: string,
  input: BookingPricingInput,
): { preview: PricingPreview | null; error: string | null } {
  const validationError = validateBookingPricingInput(input);
  if (validationError) {
    return { preview: null, error: validationError };
  }

  const type = input.pricingType as PricingType;
  const rateCents = Math.max(0, input.rateCents);

  if (type === "quote") {
    return {
      preview: {
        pricingType: "quote",
        rateCents: 0,
        quantity: 0,
        quantityUnit: "quote",
        totalPriceCents: 0,
        serviceName,
      },
      error: null,
    };
  }

  if (type === "per_event") {
    return {
      preview: {
        pricingType: "per_event",
        rateCents,
        quantity: 1,
        quantityUnit: "event",
        totalPriceCents: rateCents,
        serviceName,
      },
      error: null,
    };
  }

  if (type === "per_hour") {
    const startMin = parseTimeToMinutes(input.eventTimeStart!)!;
    const endMin = parseTimeToMinutes(input.eventTimeEnd!)!;
    const quantity = roundToHalfHour((endMin - startMin) / 60);
    return {
      preview: {
        pricingType: "per_hour",
        rateCents,
        quantity,
        quantityUnit: "hours",
        totalPriceCents: Math.round(rateCents * quantity),
        serviceName,
      },
      error: null,
    };
  }

  if (type === "per_day") {
    const endDate = input.eventEndDate?.trim() || input.eventDate;
    const quantity = input.eventEndDate?.trim()
      ? inclusiveCalendarDays(input.eventDate, endDate)
      : 1;
    return {
      preview: {
        pricingType: "per_day",
        rateCents,
        quantity,
        quantityUnit: "days",
        totalPriceCents: rateCents * quantity,
        serviceName,
      },
      error: null,
    };
  }

  return { preview: null, error: "Unsupported pricing type" };
}
