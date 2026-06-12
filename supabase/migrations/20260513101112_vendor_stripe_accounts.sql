-- vendor_stripe_accounts: Stripe Connect Express state per vendor (service role writes via edge functions)

CREATE TABLE public.vendor_stripe_accounts (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id             uuid NOT NULL UNIQUE REFERENCES public.vendors (id) ON DELETE CASCADE,
    stripe_account_id     text NOT NULL UNIQUE,
    onboarding_complete   boolean NOT NULL DEFAULT false,
    charges_enabled       boolean NOT NULL DEFAULT false,
    payouts_enabled       boolean NOT NULL DEFAULT false,
    payouts_ever_enabled    boolean NOT NULL DEFAULT false,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_stripe_accounts_stripe_account_id ON public.vendor_stripe_accounts (stripe_account_id);

ALTER TABLE public.vendor_stripe_accounts ENABLE ROW LEVEL SECURITY;

-- Vendor can read own row (linked vendors.user_id = auth.uid())
CREATE POLICY vendor_stripe_accounts_select_own ON public.vendor_stripe_accounts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.vendors v
            WHERE v.id = vendor_stripe_accounts.vendor_id
              AND v.user_id = auth.uid()
        )
    );

-- No INSERT/UPDATE for authenticated — edge functions use service role

CREATE POLICY vendor_stripe_accounts_admin_all ON public.vendor_stripe_accounts
    FOR ALL
    TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE TRIGGER trig_vendor_stripe_accounts_update_timestamp
    BEFORE UPDATE ON public.vendor_stripe_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();
