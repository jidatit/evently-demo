-- Multi-day per_day bookings: optional end date (inclusive with event_date).

ALTER TABLE public.bookings
ADD COLUMN event_end_date date;
