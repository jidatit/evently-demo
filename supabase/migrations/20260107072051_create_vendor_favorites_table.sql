-- Create the vendor_favorites table
CREATE TABLE public.vendor_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT vendor_favorites_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_favorites_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT vendor_favorites_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE,
  CONSTRAINT vendor_favorites_unique UNIQUE (customer_id, vendor_id)
);

-- Indexes for performance
CREATE INDEX idx_vendor_favorites_customer_id ON public.vendor_favorites (customer_id);
CREATE INDEX idx_vendor_favorites_vendor_id ON public.vendor_favorites (vendor_id);

-- RLS Policies for security
ALTER TABLE public.vendor_favorites ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can insert own favorites
CREATE POLICY "Customers can insert own favorites"
ON public.vendor_favorites FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'customer'
  AND customer_id = auth.uid()
);

-- Policy: Owners can delete their own favorites
CREATE POLICY "Owners can delete own favorites"
ON public.vendor_favorites FOR DELETE
TO authenticated
USING (customer_id = auth.uid());

-- Policy: Owners can select their own favorites
CREATE POLICY "Owners can select own favorites"
ON public.vendor_favorites FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- Optional: Admins can manage all (insert/delete/select)
CREATE POLICY "Admins can manage favorites"
ON public.vendor_favorites FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);