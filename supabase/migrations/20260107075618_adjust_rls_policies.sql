-- DROP old ones first
DROP POLICY IF EXISTS "Customers can insert own favorites" ON public.vendor_favorites;
DROP POLICY IF EXISTS "Owners can delete own favorites" ON public.vendor_favorites;
DROP POLICY IF EXISTS "Owners can select own favorites" ON public.vendor_favorites;
DROP POLICY IF EXISTS "Admins can manage favorites" ON public.vendor_favorites;

-- New minimal policies
CREATE POLICY "Customers can insert own favorites"
ON public.vendor_favorites FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'customer'
  AND customer_id = auth.uid()
);

CREATE POLICY "Users can select own favorites"
ON public.vendor_favorites FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

CREATE POLICY "Owners can delete own favorites"
ON public.vendor_favorites FOR DELETE
TO authenticated
USING (customer_id = auth.uid());