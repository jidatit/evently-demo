-- Allow thread creation for planners whose JWT user_metadata.role is NULL
-- (matches app isCustomer) and avoid relying on upsert UPDATE without a customer UPDATE policy.

DROP POLICY IF EXISTS "Customers can insert threads" ON public.threads;

CREATE POLICY "Customers can insert threads"
    ON public.threads FOR INSERT
    TO authenticated
    WITH CHECK (
        customer_id = auth.uid()
        AND (
            (auth.jwt() -> 'user_metadata' ->> 'role') IS NULL
            OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'customer'
        )
    );
