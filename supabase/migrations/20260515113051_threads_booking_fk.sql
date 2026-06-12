-- Layer 3: deferred FK from threads.booking_id to bookings.

ALTER TABLE public.threads
    ADD CONSTRAINT fk_threads_booking_id
    FOREIGN KEY (booking_id)
    REFERENCES public.bookings (id)
    ON DELETE SET NULL;
