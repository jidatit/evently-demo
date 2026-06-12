import { format, parseISO, isValid } from "date-fns";

export type DateInput = string | number | Date;

/**
 * Safely converts any date input into a Date object
 */
const toDate = (value: DateInput): Date | null => {
  if (!value) return null;

  const date =
    typeof value === "string"
      ? parseISO(value)
      : value instanceof Date
      ? value
      : new Date(value);

  return isValid(date) ? date : null;
};

/**
 * Format date as: Jan 7, 2026
 */
export const formatDate = (
  value: DateInput,
  dateFormat = "MMM d, yyyy"
): string => {
  const date = toDate(value);
  if (!date) return "";

  return format(date, dateFormat);
};
