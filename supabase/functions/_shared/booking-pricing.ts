// Keep in sync with src/features/bookings/pricing.ts

export type PricingType = "per_event" | "per_hour" | "per_day" | "quote";

export type BookingPricingInput = {
  pricingType: string;
  rateCents: number;
  eventDate: string;
  eventEndDate?: string | null;
  eventTimeStart?: string | null;
  eventTimeEnd?: string | null;
};

export type ServiceSnapshotPayload = {
  name: string;
  description: string | null;
  pricing_type: PricingType;
  rate_cents: number;
  quantity: number;
  quantity_unit: "event" | "hours" | "days" | "quote";
  total_price_cents: number;
  duration_minutes: number | null;
};

export type PricingValidationError = {
  message: string;
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

export function validateBookingPricingInput(
  input: BookingPricingInput,
): PricingValidationError | null {
  const type = input.pricingType as PricingType;

  if (type === "per_hour") {
    if (!input.eventTimeStart?.trim() || !input.eventTimeEnd?.trim()) {
      return {
        message:
          "Event start and end time are required for hourly services",
      };
    }
    const startMin = parseTimeToMinutes(input.eventTimeStart);
    const endMin = parseTimeToMinutes(input.eventTimeEnd);
    if (startMin == null || endMin == null) {
      return { message: "Invalid event time format" };
    }
    if (endMin <= startMin) {
      return { message: "End time must be after start time" };
    }
  }

  if (type === "per_day" && input.eventEndDate?.trim()) {
    const start = parseYmd(input.eventDate);
    const end = parseYmd(input.eventEndDate);
    if (!start || !end) {
      return { message: "Invalid event date" };
    }
    if (end < start) {
      return { message: "End date must be on or after the start date" };
    }
  }

  return null;
}

export function calculateBookingPricing(
  input: BookingPricingInput,
):
  | { ok: true; snapshot: Omit<ServiceSnapshotPayload, "name" | "description" | "duration_minutes"> }
  | { ok: false; error: string } {
  const validation = validateBookingPricingInput(input);
  if (validation) {
    return { ok: false, error: validation.message };
  }

  const type = input.pricingType as PricingType;
  const rateCents = Math.max(0, input.rateCents);

  if (type === "quote") {
    return {
      ok: true,
      snapshot: {
        pricing_type: "quote",
        rate_cents: 0,
        quantity: 0,
        quantity_unit: "quote",
        total_price_cents: 0,
      },
    };
  }

  if (type === "per_event") {
    return {
      ok: true,
      snapshot: {
        pricing_type: "per_event",
        rate_cents: rateCents,
        quantity: 1,
        quantity_unit: "event",
        total_price_cents: rateCents,
      },
    };
  }

  if (type === "per_hour") {
    const startMin = parseTimeToMinutes(input.eventTimeStart!)!;
    const endMin = parseTimeToMinutes(input.eventTimeEnd!)!;
    const hours = roundToHalfHour((endMin - startMin) / 60);
    const quantity = hours;
    return {
      ok: true,
      snapshot: {
        pricing_type: "per_hour",
        rate_cents: rateCents,
        quantity,
        quantity_unit: "hours",
        total_price_cents: Math.round(rateCents * quantity),
      },
    };
  }

  if (type === "per_day") {
    const endDate = input.eventEndDate?.trim() || input.eventDate;
    const quantity = input.eventEndDate?.trim()
      ? inclusiveCalendarDays(input.eventDate, endDate)
      : 1;
    return {
      ok: true,
      snapshot: {
        pricing_type: "per_day",
        rate_cents: rateCents,
        quantity,
        quantity_unit: "days",
        total_price_cents: rateCents * quantity,
      },
    };
  }

  return { ok: false, error: "Unsupported pricing type" };
}

export function buildServiceSnapshot(
  service: {
    name: string;
    description: string | null;
    pricing_type: string;
    price: number | null;
    duration_minutes: number | null;
  },
  input: BookingPricingInput,
):
  | { ok: true; snapshot: ServiceSnapshotPayload }
  | { ok: false; error: string } {
  const isQuote = service.pricing_type === "quote";
  const rateCents = isQuote
    ? 0
    : Math.round(Number(service.price ?? 0) * 100);

  const result = calculateBookingPricing({
    ...input,
    pricingType: service.pricing_type,
    rateCents,
  });

  if (result.ok === false) {
    return result;
  }

  return {
    ok: true,
    snapshot: {
      name: String(service.name ?? ""),
      description: service.description,
      duration_minutes: service.duration_minutes,
      ...result.snapshot,
    },
  };
}
