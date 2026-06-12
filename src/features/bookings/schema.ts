import { format, startOfDay } from "date-fns";
import { z } from "zod";
import { validateBookingPricingInput } from "./pricing";

const pricingTypeSchema = z.enum([
  "per_hour",
  "per_event",
  "per_day",
  "quote",
]);

export const bookingRequestFormSchema = z
  .object({
    serviceId: z.string().min(1, "Select a service"),
    pricingType: pricingTypeSchema,
    eventDate: z.date().optional(),
    eventEndDate: z.date().optional(),
    eventTimeStart: z.string(),
    eventTimeEnd: z.string(),
    eventLocation: z
      .string()
      .max(500, "Location must be 500 characters or less")
      .optional(),
    notes: z
      .string()
      .max(2000, "Notes must be 2000 characters or less")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.eventDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["eventDate"],
        message: "Event date is required",
      });
      return;
    }

    const today = startOfDay(new Date());
    if (startOfDay(data.eventDate) < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["eventDate"],
        message: "Event date cannot be in the past",
      });
    }

    if (data.pricingType === "per_hour") {
      if (!data.eventTimeStart.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["eventTimeStart"],
          message: "Start time is required to calculate total",
        });
      }
      if (!data.eventTimeEnd.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["eventTimeEnd"],
          message: "End time is required to calculate total",
        });
      }
    }

    const eventDateStr = format(data.eventDate, "yyyy-MM-dd");
    const eventEndDateStr = data.eventEndDate
      ? format(data.eventEndDate, "yyyy-MM-dd")
      : null;

    const pricingError = validateBookingPricingInput({
      pricingType: data.pricingType,
      rateCents: 0,
      eventDate: eventDateStr,
      eventEndDate: eventEndDateStr,
      eventTimeStart: data.eventTimeStart || null,
      eventTimeEnd: data.eventTimeEnd || null,
    });

    if (!pricingError) return;

    if (data.pricingType === "per_hour") {
      if (pricingError.includes("End time must be after")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["eventTimeEnd"],
          message: pricingError,
        });
      } else if (pricingError.includes("Invalid time")) {
        const path = !data.eventTimeStart.trim()
          ? "eventTimeStart"
          : "eventTimeEnd";
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [path],
          message: pricingError,
        });
      }
      return;
    }

    if (data.pricingType === "per_day" && pricingError.includes("End date")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["eventEndDate"],
        message: pricingError,
      });
    }
  });

export type BookingRequestFormValues = z.infer<typeof bookingRequestFormSchema>;

export const bookingRequestFormDefaults: BookingRequestFormValues = {
  serviceId: "",
  pricingType: "per_event",
  eventDate: undefined,
  eventEndDate: undefined,
  eventTimeStart: "",
  eventTimeEnd: "",
  eventLocation: "",
  notes: "",
};
